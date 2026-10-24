"""Prepare (never execute) an update of the existing authorized team stack.

Preserves all live parameter values. SAM uploads artifacts during preparation.
Requires AWS CLI, SAM CLI and the operator's existing SSO/CloudShell session.
"""
import argparse
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REGION = 'ap-southeast-1'
ACCOUNT = '109991964227'
STACK = 'marginsight'
NOVA = 'amazon.nova-lite-v1:0'
HAIKU = 'anthropic.claude-haiku-4-5'


def parameters_for_update(declared, live, assistant_model=None):
    values = dict(live)
    missing = set(declared) - set(values)
    assert missing <= {'AssistantModelId'} and not set(values) - set(declared), 'Unexpected parameter schema change'
    # An ordinary unrelated deployment must not silently switch the live model.
    if missing:
        values['AssistantModelId'] = NOVA
    if assistant_model is not None:
        assert assistant_model in (NOVA, HAIKU), 'Unapproved model'
        values['AssistantModelId'] = assistant_model
    assert set(values) == set(declared), 'Unexpected parameter schema change'
    assert values['AIRegion'] == 'us-east-1', 'Unexpected inference Region'
    return values


def aws(*args):
    return json.loads(subprocess.check_output(
        ['aws', *args, '--region', REGION, '--output', 'json'], text=True))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--assistant-model', choices=[NOVA, HAIKU])
    args = parser.parse_args()
    assert aws('sts', 'get-caller-identity')['Account'] == ACCOUNT, 'Wrong account'
    stack = aws('cloudformation', 'describe-stacks', '--stack-name', STACK)['Stacks'][0]
    assert stack['StackStatus'] in ('CREATE_COMPLETE', 'UPDATE_COMPLETE'), 'Stack not stable'
    template = ROOT / 'template-external-roles.yaml'
    declared = set(json.loads(template.read_text(encoding='utf-8'))['Parameters'])
    values = parameters_for_update(declared, {p['ParameterKey']: p['ParameterValue'] for p in stack['Parameters']}, args.assistant_model)
    if values['AssistantModelId'] == HAIKU and values['AIEnabled'] == 'true':
        # Non-inference probe. Never create agreements or subscribe to Marketplace.
        from importlib.util import spec_from_file_location, module_from_spec
        spec = spec_from_file_location('haiku_preflight', ROOT / 'scripts' / 'haiku-preflight.py')
        module = module_from_spec(spec)
        spec.loader.exec_module(module)
        module.check_access()
    overrides = [f'ParameterKey={name},ParameterValue={values[name]}' for name in sorted(declared)]
    subprocess.run(['sam', 'validate', '--lint', '--region', REGION,
                    '--template-file', str(template)], cwd=ROOT, check=True)
    subprocess.run(['sam', 'deploy', '--template-file', str(template), '--stack-name', STACK,
                    '--region', REGION, '--resolve-s3', '--parameter-overrides', *overrides,
                    '--no-execute-changeset', '--no-confirm-changeset',
                    '--no-fail-on-empty-changeset'], cwd=ROOT, check=True)
    print('Prepared only. Review the NEW change set before executing; no old change set names.')


if __name__ == '__main__':
    main()
