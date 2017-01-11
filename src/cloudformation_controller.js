
var request = require('request');
var querystring = require('querystring');
var Q = require("q");

var AWS = require('aws-sdk');
var s3 = require('aws-services-lib/aws_promise/s3bucket');
var lambda = require('aws-services-lib/aws_promise/lambda');
var collector = require('./instance_attr_collector');
var builder = require('./spotinst_json_builder');

var federatedCreds = null;

module.exports = {

  post: function(params) {

    federatedCreds = new AWS.Credentials({
      accessKeyId: params.federatedCreds.AccessKeyId,
      secretAccessKey: params.federatedCreds.SecretAccessKey,
      sessionToken: params.federatedCreds.SessionToken
    });
    var spotinstAccessKey = params.spotinstAccessKey;
    var instanceAccount = params.instanceAccount;
    var instanceId = params.instanceId;
    var instanceRegion = params.instanceRegion;

    var bucketName = process.env.BUCKET_NAME;
    var templateFilePath = __dirname + '/' + process.env.TEMPLATE_FILE_PATH;
    var serviceTokenFunctionArn = process.env.SERVICE_TOKEN_FUNCTION_ARN;

    var lambdaRegion = serviceTokenFunctionArn.split(":")[3];

    // first check if the target account has a permission to call the service token lambda and add a permission if it doesn't have yet
    var input = { region:lambdaRegion, functionArn: serviceTokenFunctionArn, instanceAccount: instanceAccount };
    return lambda.findAccountPolicy(input).then(data => {
      console.log(data);
      if (!data) {
        input = { region:lambdaRegion, principal: instanceAccount, statementId: 'Id-' + instanceAccount, functionArn: serviceTokenFunctionArn };
        return lambda.addPermission(input).then(res => {
          console.log(res);
          return true;
        });
      }
      else return data;
    }).then(data => {
      // get the attributes of the given instance
      return collector.getEC2InstanceAttrs(instanceId, instanceRegion, federatedCreds).then(instance => {
        console.log(JSON.stringify(instance, null, 2));
        // now build the cloudformation template
        var name = instance.InstanceId + '-elastigroup';
        var description = name;
        var keyPairName = '';
        var nameTag = name;
        var cfJson = builder.buildCF(serviceTokenFunctionArn, spotinstAccessKey, instance, name, description, keyPairName, nameTag, templateFilePath);
        console.log(JSON.stringify(cfJson, null, 2));
        return cfJson;
      });
    }).then(cfJson => {
      // find the target bucket and create it if not exists
      return s3.createBucket({ region: instanceRegion, bucketName: bucketName }).then(res => {
        console.log(res);
        return cfJson;
      });
    }).then(cfJson => {
      // upload the generated cloudformation template in s3 bucket
      var templateName = instanceAccount + '.' + cfJson.Parameters.ElastiGroupName.Default.replace(/ /g, '-') + '.cf.json';
      var params = {
        region: instanceRegion,
        acl: 'public-read',
        bucketName: bucketName,
        keyName: templateName,
        data: JSON.stringify(cfJson),
      };
      return s3.putObject(params).then(res => {
        return templateName;
      });
    }).then(templateName => {
      // now generated aws cloudformation console url
      var stackName = 'Spotinst-' + templateName.replace('.cf.json', '').replace('.', '-');
      var s3Url = 'https://s3.amazonaws.com/' + bucketName + '/' + templateName;
      var deferred = Q.defer();
      this.generatedAWSConsoleUrl(stackName, s3Url, instanceRegion, function(err, url) {
        if (err) {
          deferred.reject(new Error(err));
        }
        else {
          console.log(url);
          deferred.resolve({consoleUrl: url});
        }
      });
      return deferred.promise;
    });
  },

  generatedAWSConsoleUrl: function(stackName, s3Url, instanceRegion, cb) {
    var sessString = JSON.stringify({
      sessionId: federatedCreds.accessKeyId,
      sessionKey: federatedCreds.secretAccessKey,
      sessionToken: federatedCreds.sessionToken
    });
    var getTokenQuery = {
      Action: 'getSigninToken',
      Session: sessString
    };
    request.get(
      'https://signin.aws.amazon.com/federation?'+querystring.stringify(getTokenQuery),
      function(err,res,body) {
        var token = JSON.parse(body);
        var loginQuery = {
          Action: 'login',
          Destination: "https://console.aws.amazon.com/cloudformation/home?region=" + instanceRegion + "#/stacks/new?stackName=" + stackName + "&templateURL=" + s3Url,
          SigninToken: token.SigninToken
        };
        //if (options.Issuer) {
        //  loginQuery.Issuer = options.Issuer
        //}
        var url = "https://signin.aws.amazon.com/federation?" + querystring.stringify(loginQuery);
        //console.log(url);
        cb(err, url);
      }
    );
  }
}
