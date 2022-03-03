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

    const uuid = uuidv4();
    console.log('### start upload: ' + uuid);

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

    try {
      const hashSum = crypto.createHash('sha256');
      hashSum.update(body);
      const hex = hashSum.digest('hex');
      console.log('fingerprint = '+hex);
      
      //console.log('body = '+body);
    } catch(error) {
      console.log(error);
      return;
    }

    const bucket = 's3-duplication-checker';
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
    
    const fileInfo = {
        Bucket: bucket,
        Name: filename,
        ContentType: contentType
    }; 
    console.log('file info: ' + JSON.stringify(fileInfo)) 

    const response = {
        statusCode: 200,
        body: JSON.stringify(fileInfo),
    };
    return response;
};

function hexToBinary(s) {
  const lookup = {
    0: "0000",
    1: "0001",
    2: "0010",
    3: "0011",
    4: "0100",
    5: "0101",
    6: "0110",
    7: "0111",
    8: "1000",
    9: "1001",
    a: "1010",
    b: "1011",
    c: "1100",
    d: "1101",
    e: "1110",
    f: "1111",
    A: "1010",
    B: "1011",
    C: "1100",
    D: "1101",
    E: "1110",
    F: "1111",
  };
  let ret = "";
  for (let i = 0; i < s.length; i++) {
    ret += lookup[s[i]];
  }
  return ret;
}


async function putItem(key, text) {
    let item = {
      "pid": {"S": key},
      "text": {"S": text}
    };
    try {
      let result = await dynamodb.putItem({
        "TableName": TABLE_NAME,
        "Item" : item
      }).promise();
      console.log('result', result);
      return createReseponse(200, key);
    } catch (err) {
      return createReseponse(500, `Failed to put item ${err}`);
    }
  }
  
  async function getItem(pid) {
    console.log('pid', pid);
    try {
      let result = await dynamodb.getItem({
        "TableName": TABLE_NAME,
        "Key" : {
            "pid": {"S": pid }
        }
      }).promise();
      console.log('result', result);
      return createReseponse(200, result.Item.text.S);
    } catch (err) {
      return createReseponse(500, `Failed to get item ${err}`);
    }
  }
  
  function createReseponse(code, data) {
    return {
      statusCode: code,
      headers: {'Content-Type': 'text/plain; charset=utf-8'},
      body: JSON.stringify({ "data": data })
    };
  }