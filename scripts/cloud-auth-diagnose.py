"""Read-only auth/CORS diagnostics. Never inspect or log user credentials/tokens."""
import boto3,json,urllib.request,urllib.error,datetime,sys
r='ap-southeast-1'; assert boto3.client('sts').get_caller_identity()['Account']=='109991964227'
o=json.load(open('foundation-outputs.json')); origin=o['WebUrl'].rstrip('/');api=o['ApiUrl'].rstrip('/')
def check(label,url,method='GET',headers=None,data=None):
 req=urllib.request.Request(url,method=method,headers=headers or {},data=data)
 try:res=urllib.request.urlopen(req,timeout=15)
 except urllib.error.HTTPError as e:res=e
 return {'check':label,'status':res.status,'cors':{k:v for k,v in res.headers.items() if k.lower().startswith('access-control-')},'body':res.read(500).decode(errors='replace')}
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'origin':origin,'checks':[
 check('API preflight authorization',api+'/me/stores','OPTIONS',{'Origin':origin,'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization'}),
 check('API POST preflight',api+'/stores/DIAGNOSTIC/imports','OPTIONS',{'Origin':origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}),
 check('Foreign origin preflight',api+'/me/stores','OPTIONS',{'Origin':'https://untrusted.invalid','Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization'}),
 check('API GET no token',api+'/me/stores',headers={'Origin':origin}),
 check('Cognito invalid code CORS',o['AuthDomain']+'/oauth2/token','POST',{'Origin':origin,'Content-Type':'application/x-www-form-urlencoded'},('grant_type=authorization_code&client_id='+o['ClientId']+'&code=diagnostic-invalid-code&redirect_uri='+origin+'/&code_verifier=diagnostic-invalid-verifier').encode())]}
api_id=api.split('//')[1].split('.')[0]
a=boto3.client('apigatewayv2',region_name=r)
report['apiCors']=a.get_api(ApiId=api_id).get('CorsConfiguration')
report['routes']=[{k:v.get(k) for k in ['RouteKey','AuthorizationType','AuthorizationScopes']} for v in a.get_routes(ApiId=api_id)['Items']]
json.dump(report,open('auth-diagnosis.json','w'),indent=2);print(json.dumps(report))
if '--verify' in sys.argv:
 checks={c['check']:c for c in report['checks']}
 for name in ['API preflight authorization','API POST preflight']:
  assert checks[name]['status'] in [200,204],checks[name]
  assert checks[name]['cors'].get('access-control-allow-origin')==origin,checks[name]
 assert 'access-control-allow-origin' not in checks['Foreign origin preflight']['cors']
 assert checks['API GET no token']['status']==401
 assert all(v['AuthorizationType']=='JWT' for v in report['routes'] if v['RouteKey'] in ['ANY /{proxy+}','POST /stores/{storeId}/assistant'])
 print('PASS browser preflight allowed only from web origin; protected finance routes still JWT; unauthenticated GET denied')
