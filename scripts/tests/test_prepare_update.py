import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('prepare_update', Path(__file__).resolve().parents[1] / 'prepare-update.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class UpdateParametersTest(unittest.TestCase):
    def setUp(self):
        self.live = {'AIEnabled': 'true', 'AIRegion': 'us-east-1', 'DemoEnabled': 'true', 'LineSecretArn': ''}
        self.declared = set(self.live) | {'AssistantModelId'}

    def test_legacy_update_adds_nova_without_switching_or_mutating_live_parameters(self):
        result = module.parameters_for_update(self.declared, self.live)
        self.assertEqual(result, {**self.live, 'AssistantModelId': module.NOVA})
        self.assertNotIn('AssistantModelId', self.live)

    def test_existing_model_preserved(self):
        live = {**self.live, 'AssistantModelId': module.HAIKU}
        self.assertEqual(module.parameters_for_update(self.declared, live), live)

    def test_explicit_switch_and_rollback_preserve_other_parameters(self):
        result = module.parameters_for_update(self.declared, self.live, module.HAIKU)
        self.assertEqual(result, {**self.live, 'AssistantModelId': module.HAIKU})
        result = module.parameters_for_update(self.declared, result, module.NOVA)
        self.assertEqual(result, {**self.live, 'AssistantModelId': module.NOVA})

    def test_unknown_schema_or_model_fails_closed(self):
        for declared in [self.declared | {'Unexpected'}, self.declared - {'DemoEnabled'}]:
            with self.assertRaises(AssertionError):
                module.parameters_for_update(declared, self.live)
        with self.assertRaises(AssertionError):
            module.parameters_for_update(self.declared, self.live, 'global.anthropic.claude-haiku-4-5-20251001-v1:0')

    def test_unapproved_region_rejected(self):
        with self.assertRaises(AssertionError):
            module.parameters_for_update(self.declared, {**self.live, 'AIRegion': 'us-west-2'}, module.HAIKU)


if __name__ == '__main__':
    unittest.main()
