"""Prepare (never execute) an update of the existing authorized team stack.

Preserves all live parameter values. SAM uploads artifacts during preparation.
Requires AWS CLI, SAM CLI and the operator's existing SSO/CloudShell session.
"""
import argparse
import json
from pathlib import Path
import subprocess
import re

ROOT = Path(__file__).resolve().parents[1]
REGION = 'ap-southeast-1'
ACCOUNT = '109991964227'
STACK = 'marginsight'
NOVA = 'amazon.nova-lite-v1:0'
HAIKU = 'anthropic.claude-haiku-4-5'
QWEN = 'qwen.qwen3-32b-v1:0'


def parameters_for_update(declared, live, assistant_model=None, fee_rules=None):
    values = dict(live)
    missing = set(declared) - set(values)
    defaults = {'AssistantModelId': NOVA, 'FeeRulesEnabled': 'false', 'FeeRulesIndexKey': '', 'FeeRulesIndexSha256': ''}
    assert missing <= set(defaults) and not set(values) - set(declared), 'Unexpected parameter schema change'
    # An ordinary unrelated deployment must not silently switch the live model.
    for name in missing:
        values[name] = defaults[name]
    if assistant_model is not None:
        assert assistant_model in (NOVA, HAIKU, QWEN), 'Unapproved model'
        values['AssistantModelId'] = assistant_model
    if fee_rules is not None:
        assert {'FeeRulesEnabled', 'FeeRulesIndexKey', 'FeeRulesIndexSha256'} <= set(declared), 'Fee parameters missing'
        values.update(fee_rules)
    if values.get('FeeRulesEnabled') == 'true':
        assert re.fullmatch(r'fee-rules/v1/[a-f0-9]{64}/index\.json', values['FeeRulesIndexKey']), 'Invalid fee index key'
        assert re.fullmatch(r'[a-f0-9]{64}', values['FeeRulesIndexSha256']), 'Invalid fee index hash'
    assert set(values) == set(declared), 'Unexpected parameter schema change'
    assert values['AIRegion'] == 'us-east-1', 'Unexpected inference Region'
    return values


def aws(*args):
    return json.loads(subprocess.check_output(
        ['aws', *args, '--region', REGION, '--output', 'json'], text=True))


def sam_overrides(values):
    # Quote values inside SAM's parameter grammar (subprocess still uses argv, not a shell).
    # An unquoted empty value can be misparsed as a parameter named "ParameterKey".
    return [f'ParameterKey={name},ParameterValue={json.dumps(values[name])}' for name in sorted(values)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--assistant-model', choices=[NOVA, HAIKU, QWEN])
    parser.add_argument('--fee-rules-index-key')
    parser.add_argument('--fee-rules-index-sha256')
    parser.add_argument('--disable-fee-rules', action='store_true')
    args = parser.parse_args()
    assert aws('sts', 'get-caller-identity')['Account'] == ACCOUNT, 'Wrong account'
    stack = aws('cloudformation', 'describe-stacks', '--stack-name', STACK)['Stacks'][0]
    assert stack['StackStatus'] in ('CREATE_COMPLETE', 'UPDATE_COMPLETE'), 'Stack not stable'
    template = ROOT / 'template-external-roles.yaml'
    declared = set(json.loads(template.read_text(encoding='utf-8'))['Parameters'])
    fee_rules = None
    if args.fee_rules_index_key or args.fee_rules_index_sha256:
        assert args.fee_rules_index_key and args.fee_rules_index_sha256 and not args.disable_fee_rules, 'Pass both reviewed index parameters'
        fee_rules = {'FeeRulesEnabled': 'true', 'FeeRulesIndexKey': args.fee_rules_index_key, 'FeeRulesIndexSha256': args.fee_rules_index_sha256}
    elif args.disable_fee_rules:
        fee_rules = {'FeeRulesEnabled': 'false'}
    values = parameters_for_update(declared, {p['ParameterKey']: p['ParameterValue'] for p in stack['Parameters']}, args.assistant_model, fee_rules)
    if values['AssistantModelId'] == HAIKU and values['AIEnabled'] == 'true':
        # Non-inference probe. Never create agreements or subscribe to Marketplace.
        from importlib.util import spec_from_file_location, module_from_spec
        spec = spec_from_file_location('haiku_preflight', ROOT / 'scripts' / 'haiku-preflight.py')
        module = module_from_spec(spec)
        spec.loader.exec_module(module)
        module.check_access()
    if values['AssistantModelId'] == QWEN and values['AIEnabled'] == 'true':
        from importlib.util import spec_from_file_location, module_from_spec
        spec = spec_from_file_location('qwen_preflight', ROOT / 'scripts' / 'qwen-preflight.py')
        module = module_from_spec(spec)
        spec.loader.exec_module(module)
        module.check_access()
    overrides = sam_overrides(values)
    subprocess.run(['sam', 'validate', '--lint', '--region', REGION,
                    '--template-file', str(template)], cwd=ROOT, check=True)
    subprocess.run(['sam', 'deploy', '--template-file', str(template), '--stack-name', STACK,
                    '--region', REGION, '--resolve-s3', '--parameter-overrides', *overrides,
                    '--no-execute-changeset', '--no-confirm-changeset',
                    '--no-fail-on-empty-changeset'], cwd=ROOT, check=True)
    print('Prepared only. Review the NEW change set before executing; no old change set names.')


if __name__ == '__main__':
    main()
