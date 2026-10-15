"""Transfer-only helper: require exact old/new bundle SHA-256; no credentials."""
import json,gzip,hashlib,pathlib
patches=json.loads(gzip.decompress(pathlib.Path('deploy-delta.json.gz').read_bytes()))
updated={}
for name,patch in patches.items():
 assert name in ['backend/dist/api.mjs','backend/dist/line.mjs','backend/dist/worker.mjs','backend/dist/seed.mjs']
 original=pathlib.Path(name).read_bytes()
 assert hashlib.sha256(original).hexdigest()==patch['oldSha'],f'Unexpected source bundle: {name}'
 lines=original.decode().splitlines(keepends=True)
 for change in reversed(patch['changes']):lines[change['start']:change['end']]=change['lines']
 result=''.join(lines).encode()
 assert hashlib.sha256(result).hexdigest()==patch['newSha'],f'New bundle mismatch: {name}'
 updated[name]=result
for name,result in updated.items():pathlib.Path(name).write_bytes(result)
print('PASS all four deployment bundles exactly match verified local SHA-256')
