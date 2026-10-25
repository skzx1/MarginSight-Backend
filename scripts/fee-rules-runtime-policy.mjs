// Render only; applying the reviewed policy is an explicit operator action.
const bucket=process.argv[2];
if(!bucket||!/^marginsight-uploadsbucket-[a-z0-9]+$/.test(bucket))throw new Error('Pass the existing stack UploadsBucket; no wildcard bucket accepted');
console.log(JSON.stringify({Version:'2012-10-17',Statement:[
 {Sid:'TitanEmbeddingV2Only',Effect:'Allow',Action:'bedrock:InvokeModel',Resource:'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0',Condition:{StringEquals:{'aws:RequestedRegion':'us-east-1'}}},
 {Sid:'ReadPublicFeeResearchIndexOnly',Effect:'Allow',Action:'s3:GetObject',Resource:`arn:aws:s3:::${bucket}/fee-rules/v1/*/index.json`,Condition:{StringEquals:{'aws:RequestedRegion':'ap-southeast-1'}}}
]},null,2));
