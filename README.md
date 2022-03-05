# ㅑmage Duplication Checker

본 문서를 통해서, 수신된 이미지가 중복인지 확인하고 결과를 Cache와 Database로 관리하는 프로세스를 설명하고자 합니다. 이를 통해 AWS Severless Service인 Lambda, ElastiCache, DynamoDB, S3 사용법을 이해할 수 있습니다. 

전체적인 Architecture는 아래와 같습니다. 

<!-- <img width="598" alt="image" src="https://user-images.githubusercontent.com/52392004/156489406-0f3fbf15-9183-4a2b-a73f-badbb609414f.png"> -->

<img width="503" alt="image" src="https://user-images.githubusercontent.com/52392004/156871322-6db2822c-1b21-4094-8c1d-1d584f7d0ae7.png">

## 상세 시나리오

1) 이미지 파일을 업로드하기 위하여 API Gateway - Lambda를 통해 전송합니다. 

2) Lambda는 수신된 이미지의 UUID를 생성하여 파일명과 페어로 관리합니다. 

3) 입력된 이미지를 hashing하여 이미지에 대한 Content-Id를 생성합니다. 

<!-- 4) AWS Redis를 통해 중복 여부를 Cache에서 먼저 확인하고, 없다면 AWS DynamoDB에서도 추가적으로 조회를 합니다. -->
4) AWS DynamoDB를 통해 중복 여부를 확인합니다.

5) 입력된 이미지가 중복이라면 해당 이미지의 UUID를 리턴합니다.

6) 입력된 이미지가 증복이 아니라면, UUID, Content-ID를 Redis와 DynamoDB에 저장하고, 컨텐츠는 S3에 저장합니다. 

상세 시나리오는 아래 sequeance diagram을 참조하시기 바랍니다. 

<!-- ![image](https://user-images.githubusercontent.com/52392004/156688110-02d91ee1-77e8-40df-b25c-46925f53eaf6.png) -->

![image](https://user-images.githubusercontent.com/52392004/156871212-7c8afc29-65ec-49ff-bc39-2802a1d903ef.png)



#### Hash 

이미지를 SHA265으로 Hashing해서 unique한 ID인 fingerprint를 생성합니다. 

```java
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
````

#### Check Duplication

이미지가 중복되었는지 확인하기 위하여 DynamoDB에 저장된 ContentID를 query 합니다. 중복되었다면 dynamoQuery에 컨텐츠에 대한 정보가 포함됩니다. 

```java
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
```    


#### Put Item

DynamoDB에 저장되는 Item은 partition key로 uuid를 short key로 timestamp를 쓰고, global secondary index로 hash ID인 ContentID 사용합니다.

각 item의 info는 파일이름, Rekognition 결과 데이터인 json, json에서 text extraction 과정을 통해 얻어진 text와 Polly에 의해 추출된 mp3 파일이 저장된 url로 구성됩니다. 

```java
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
```

### Lambda for Duplication Checker

https://github.com/kyopark2014/image-duplication-checker/blob/main/docs/lambda-duplication-checker.md

### API Gateway

https://github.com/kyopark2014/image-duplication-checker/blob/main/docs/api-gateway.md

### S3

https://github.com/kyopark2014/image-duplication-checker/blob/main/docs/s3.md

### DynamoDB

https://github.com/kyopark2014/image-duplication-checker/blob/main/docs/dynamodb.md

### Plant UML
https://github.com/kyopark2014/image-duplication-checker/blob/main/docs/plantuml.md
