
/**************
export BUCKET_NAME=aws-services-spotinst-bucket-1k8rxpeqwo5ku
export TEMPLATE_FILE_PATH=./cloudformation.template.json
export SERVICE_TOKEN_FUNCTION_ARN=arn:aws:lambda:us-east-1:089476987273:function:spotinst-builder
***************/

const federatedCreds = {
  "AccessKeyId": "",
  "SecretAccessKey": "",
  "SessionToken": ""
};
const body = {
  federatedCreds: federatedCreds,
  instanceAccount: "290093585298",
  instanceId: "i-4b38ad45",
  instanceRegion: "us-east-1",
  spotinstAccessKey: ""
};

event = { resource: '/{proxy+}',
  path: '/cloudformation',
  httpMethod: 'POST',
  headers: { Authorization: 'dummy' },
  queryStringParameters: null,
  pathParameters: { proxy: 'ec2' },
  stageVariables: null,
  requestContext:
   { accountId: '089476987273',
     resourceId: 'd3prmy',
     stage: 'test-invoke-stage',
     requestId: 'test-invoke-request',
     identity:
      { cognitoIdentityPoolId: null,
        accountId: '089476987273',
        cognitoIdentityId: null,
        caller: 'AROAI65QJVPMVXS2ZTUPC:af91c390dd72013232d6005056ba56f5',
        apiKey: 'test-invoke-api-key',
        sourceIp: 'test-invoke-source-ip',
        accessKey: 'ASIAIW4MC76RKEMZFR7Q',
        cognitoAuthenticationType: null,
        cognitoAuthenticationProvider: null,
        userArn: 'arn:aws:sts::089476987273:assumed-role/sgas_admin/af91c390dd72013232d6005056ba56f5',
        userAgent: 'Apache-HttpClient/4.5.x (Java/1.8.0_102)',
        user: 'AROAI65QJVPMVXS2ZTUPC:af91c390dd72013232d6005056ba56f5' },
     resourcePath: '/{proxy+}',
     httpMethod: 'GET',
     apiId: 'ev4z0gjdi3' },
  body: JSON.stringify(body),
  isBase64Encoded: false
}

var i = require('../src/index.js');
var context = {succeed: res => console.log(res)};
i.handler(event, context, function(err, data) {
  if (err)  console.log("failed : " + err);
  else console.log("completed: " + JSON.stringify(data));
});
