# image-duplication-checker

본 문서를 통해서, 수신된 이미지가 중복인지 확인하고 결과를 Cache와 Database로 관리하는 프로세스를 설명하고자 합니다. 이를 통해 AWS Severless Service인 Lambda, ElastiCache, DynamoDB, S3 사용법을 이해할 수 있습니다. 

전체적인 Architecture는 아래와 같습니다. 

<img width="598" alt="image" src="https://user-images.githubusercontent.com/52392004/156489406-0f3fbf15-9183-4a2b-a73f-badbb609414f.png">

## 상세 시나리오

1) 이미지 파일을 업로드하기 위하여 API Gateway - Lambda를 통해 전송합니다. 

2) Lambda는 수신된 이미지의 UUID를 생성하여 파일명과 페어로 관리합니다. 

3) 입력된 이미지를 hashing하여 이미지에 대한 Content-Id를 생성합니다. 

4) AWS Redis를 통해 중복 여부를 Cache에서 먼저 확인하고, 없다면 AWS DynamoDB에서도 추가적으로 조회를 합니다. 

5) 입력된 이미지가 중복이라면 해당 이미지의 UUID를 리턴합니다.

6) 입력된 이미지가 증복이 아니라면, UUID, Content-ID를 Redis와 DynamoDB에 저장하고, 컨텐츠는 S3에 저장합니다. 

상세 시나리오는 아래 sequeance diagram을 참조하시기 바랍니다. 

![image](https://user-images.githubusercontent.com/52392004/156688110-02d91ee1-77e8-40df-b25c-46925f53eaf6.png)

### Lambda for Duplication Checker

https://github.com/kyopark2014/image-duplication-checker/blob/main/docs/lambda-duplication-checker.md

### API Gateway

https://github.com/kyopark2014/image-duplication-checker/blob/main/docs/api-gateway.md

### S3

https://github.com/kyopark2014/image-duplication-checker/blob/main/docs/s3.md

