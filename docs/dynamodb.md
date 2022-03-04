# DynamoDB

1) AWS 콘솔 에서 Amazon DynamoDB 서비스로 이동합니다.

https://ap-northeast-2.console.aws.amazon.com/dynamodbv2/home?region=ap-northeast-2#service

![image](https://user-images.githubusercontent.com/52392004/156774129-74f40bce-a28f-42ad-b27c-fad897c2ec9e.png)

2) [DynamoDB] - [Tables] - [Create table]에서 아래와 같이 Partition key와 Sort key를 정의한다. 여기서에서는 Unique ID인 uuid를 Partition key로 사용하고, Sort key로는 item 생성시간인 timestamp를 사용하고, 이후 아래로 스크롤하여 [Create Table]을 선택한다. 

![image](https://user-images.githubusercontent.com/52392004/156787178-eb380f17-800b-43f3-84d4-1b8469245ae2.png)

생성된 dyanmo table의 정보는 아래와 같다. 

![image](https://user-images.githubusercontent.com/52392004/156787695-1074062c-8b30-424b-9533-14c83592e027.png)


