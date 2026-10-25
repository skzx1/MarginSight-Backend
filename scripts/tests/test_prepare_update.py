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

    def test_explicit_qwen_switch_and_preservation(self):
        result = module.parameters_for_update(self.declared, self.live, module.QWEN)
        self.assertEqual(result, {**self.live, 'AssistantModelId': module.QWEN})
        self.assertEqual(module.parameters_for_update(self.declared, result), result)

    def test_fee_parameters_start_disabled_and_explicit_enable_preserves_live_model(self):
        declared = self.declared | {'FeeRulesEnabled', 'FeeRulesIndexKey', 'FeeRulesIndexSha256'}
        live = {**self.live, 'AssistantModelId': module.QWEN}
        result = module.parameters_for_update(declared, live)
        self.assertEqual(result['FeeRulesEnabled'], 'false')
        enabled = {'FeeRulesEnabled': 'true', 'FeeRulesIndexKey': 'fee-rules/v1/' + 'a'*64 + '/index.json', 'FeeRulesIndexSha256': 'b'*64}
        ready = module.parameters_for_update(declared, live, fee_rules=enabled)
        self.assertEqual(ready['AssistantModelId'], module.QWEN)
        self.assertEqual(module.parameters_for_update(declared, ready), ready)
        disabled = module.parameters_for_update(declared, ready, fee_rules={'FeeRulesEnabled': 'false'})
        self.assertEqual(disabled['FeeRulesIndexKey'], ready['FeeRulesIndexKey'])

    def test_fee_enable_rejects_missing_hash_and_objects_outside_knowledge_prefix(self):
        declared = self.declared | {'FeeRulesEnabled', 'FeeRulesIndexKey', 'FeeRulesIndexSha256'}
        for key, digest in [('some-merchant/report.csv', 'b'*64), ('fee-rules/v1/'+'a'*64+'/index.json', '')]:
            with self.assertRaises(AssertionError):
                module.parameters_for_update(declared, self.live, fee_rules={'FeeRulesEnabled': 'true', 'FeeRulesIndexKey': key, 'FeeRulesIndexSha256': digest})

    def test_sam_empty_parameter_is_explicitly_quoted_instead_of_becoming_an_unknown_key(self):
        self.assertIn('ParameterKey=LineSecretArn,ParameterValue=""', module.sam_overrides(self.live))
        self.assertIn('ParameterKey=AIEnabled,ParameterValue="true"', module.sam_overrides(self.live))


if __name__ == '__main__':
    unittest.main()
