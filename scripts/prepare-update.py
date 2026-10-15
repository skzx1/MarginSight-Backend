"""Prepare (never execute) an update of the existing authorized team stack.

Preserves all live parameter values. SAM uploads artifacts during preparation.
Requires AWS CLI, SAM CLI and the operator's existing SSO/CloudShell session.
"""
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REGION = 'ap-southeast-1'
ACCOUNT = '109991964227'
STACK = 'marginsight'


def aws(*args):
    return json.loads(subprocess.check_output(
        ['aws', *args, '--region', REGION, '--output', 'json'], text=True))


def main():
    assert aws('sts', 'get-caller-identity')['Account'] == ACCOUNT, 'Wrong account'
    stack = aws('cloudformation', 'describe-stacks', '--stack-name', STACK)['Stacks'][0]
    assert stack['StackStatus'] in ('CREATE_COMPLETE', 'UPDATE_COMPLETE'), 'Stack not stable'
    template = ROOT / 'template-external-roles.yaml'
    declared = set(json.loads(template.read_text(encoding='utf-8'))['Parameters'])
    values = {p['ParameterKey']: p['ParameterValue'] for p in stack['Parameters']}
    assert set(values) == declared, 'Parameter schema changed: review new/removed defaults first'
    assert values['AIRegion'] == 'us-east-1', 'Unexpected inference Region'
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
