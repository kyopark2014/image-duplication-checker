const aws = require('aws-sdk');
const cd = require('content-disposition');
const {v4: uuidv4} = require('uuid');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });

var crypto = require('crypto');
var dynamodb = new aws.DynamoDB({apiVersion: '2012-08-10'});
var TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event, context) => {
    console.log('## ENVIRONMENT VARIABLES: ' + JSON.stringify(process.env))
    // console.log('## EVENT: ' + JSON.stringify(event))
    
    const body = Buffer.from(event["body-json"], "base64");
    console.log('## EVENT: ' + JSON.stringify(event.params))
    console.log('## EVENT: ' + JSON.stringify(event.context))

    const bucket = 's3-duplication-checker';
    const tableName = "dynamodb-image-duplication-checker";
    const indexName = "ContentID-index"; // GSI
    var uuid;

    var contentType;
    if(event.params.header['Content-Type']) {
        contentType = event.params.header["Content-Type"];
    } 
    else if(event.params.header['content-type']) {
        contentType = event.params.header["content-type"];
    }
    console.log('contentType = '+contentType); 

    var contentDisposition;
    if(event.params.header['Content-Disposition']) {
        contentDisposition = event.params.header["Content-Disposition"];  
    } 
    else if(event.params.header['content-disposition']) {
        contentDisposition = event.params.header["content-disposition"];  
    }
    console.log('disposition = '+contentDisposition);

    // extract fingerprint from the given image
    console.log('### start hashing');
    let fingerprint = "";
    try {
      const hashSum = crypto.createHash('sha256');    
      hashSum.update(body);      
      fingerprint = hashSum.digest('hex');
      
      console.log('### finish hashing: fingerprint = '+fingerprint);
    } catch(error) {
      console.log(error);
      return;
    }

    // check the duplication of the given image
    var dynamo = new aws.DynamoDB.DocumentClient();
    var queryParams = {
      TableName: tableName,
      IndexName: indexName,    
      KeyConditionExpression: "ContentID = :content_id",
      ExpressionAttributeValues: {
          ":content_id": fingerprint
      }
    };

    var dynamoQuery; 
    try {
      dynamoQuery = await dynamo.query(queryParams).promise();

      console.log('query: '+JSON.stringify(dynamoQuery));
    } catch (error) {
      console.log(error);
      return;
    } 

    if(dynamoQuery.Count == 0) {  // new file
      uuid = uuidv4();

      // make filename
      var filename = "";
      if(contentDisposition) {
          filename = cd.parse(contentDisposition).parameters.filename;
      }
      else { // no filename from input
        var ext;
        if(contentType == 'image/jpeg') ext = '.jpeg';
        else if(contentType == 'image/jpg') ext = '.jpg';
        else if(contentType == 'image/png') ext = '.png';
        else ext = '.jpeg';  // default
  
        filename = uuid+ext;
      }
      
      // putObject to S3
      console.log('### start upload: ' + uuid);
      try {
          const destparams = {
              Bucket: bucket, 
              Key: filename,
              Body: body,
              ContentType: contentType
          };
          const {putResult} = await s3.putObject(destparams).promise(); 
  
          console.log('### finish upload: ' + uuid);
      } catch (error) {
          console.log(error);
          return;
      } 

      // putItem to DynamoDB
      var date = new Date();        
      var timestamp = Math.floor(date.getTime()/1000).toString();

      var putParams = {
        TableName: tableName,
        Item: {
          uuid: uuid,
          timestamp: timestamp,
          ContentID: fingerprint,
          "info":{
            "filename": filename,
            "json": "",
            "text": "",
            "url": ""
          }
        } 
      };

      var dynomoPut; 
      try {
        dynomoPut = await dynamo.put(putParams).promise();

        console.log('put: '+JSON.stringify(dynomoPut));
      } catch (error) {
        console.log(error);
        return;
      } 
    }
    else {
      console.log('Duplicated ContentID!');

      uuid = dynamoQuery.Items[0].uuid;
      timestamp = dynamoQuery.Items[0].timestamp;
      filename = dynamoQuery.Items[0].info.filename;

      console.log('uuid: '+uuid);
      console.log('filename: '+filename);

      // for test
    /*  var getParams = {
        TableName: tableName,
        Key: {uuid: uuid}
      };

      var dynomoGet; 
      try {
        dynomoGet = await dynamo.get(getParams).promise();

        console.log('gut: '+JSON.stringify(dynomoGet));
      } catch (error) {
        console.log(error);
        return;
      }  */
    } 
     
    const fileInfo = {
        Bucket: bucket,
        Name: filename,
        UUID: uuid,
        ContentID: fingerprint,
        ContentType: contentType
    }; 
    console.log('file info: ' + JSON.stringify(fileInfo)) 

    const response = {
        statusCode: 200,
        body: JSON.stringify(fileInfo),
    };
    return response;
};