# Lambda for Upload 구현"

1) AWS 콘솔 에서 AWS Lambda 서비스로 이동합니다.

https://ap-northeast-2.console.aws.amazon.com/lambda/home?region=ap-northeast-2#/functions

2) [Create function]의 [Basic information]에서 [Function name]은 “lambda-duplication-checker"으로 입력하고 [Runtime]으로 Node.js를 선택합니다. 이후 아래로 스크롤하여 [Create function]을 선택합니다.
 
![image](https://user-images.githubusercontent.com/52392004/156529036-d050f9fb-c0d7-45c4-ac48-0802f2c4262a.png)

3) [Lambda] - [Funtions] - [lambda-duplication-checker]에서 아래와 같이 [Configuration] - [Permissions]을 선택후, [Execution role]의 [Role name]을 아래와 같이 선택합니다. 본 워크샵의 예제에서는 아래와 같이 “lambda-duplication-checker-role-prez7rwz”을 선택합니다.

![image](https://user-images.githubusercontent.com/52392004/156529460-c46864ed-77f8-467b-8e25-4a6e57e50f8e.png)


4) 이때 IAM의 [Roles]로 이동하는데, Policy를 수정하기 위하여 아래와 같이 [Permissions policies]에 있는 “AWSLambdaBasicExecutionRole-26e6d419-1c39-4322-8243-a35df4fe233d”을 선택합니다.

![image](https://user-images.githubusercontent.com/52392004/156529608-978035a1-66bb-410b-94df-54b7cea44cd4.png)



5) [IAM]의 [Policies]로 이동하면, [Permissions]에서 [Edit policy]를 선택합니다.

![Edit Policy](https://user-images.githubusercontent.com/52392004/156359595-e8f4244a-2a2b-4d23-a07c-17acb71c7a0a.png)


6) [JSON]에서 아래와 같이 S3와 SQS에 대한 퍼미션을 추가합니다. Permission은 향후 필요에 따라 원하는 범위로 조정할 수 있습니다. 아례 예시에서 "****"은 AWS 계정 번호를 다른 퍼미션과 비교하여 입력하여야 합니다. 

```java
        {
            "Effect": "Allow",
            "Action": [
                "s3:Put*",
                "s3:Get*",
                "s3:List*"
            ],
            "Resource": "*"
        }
```

7) S3에 대한 Policy를 확인후 [Save changes] 선택하여 저장합니다.

8) API Gateway로 부터 받은 event에서 파일을 추출하여 S3에 저장하기 위한 코드를 다운로드 합니다.

아래와 같이 소스를 내려 받습니다.
 
```c
$ git clone https://github.com/kyopark2014/image-duplication-checker
```

해당 repository에는 이미 압축된 파일이 있지만, 추후 수정시 폴더로 이동하여 압축을 합니다. 이때 압축 명령어는 아래와 같습니다.

```c
$ zip -r deploy.zip *
```

9) Lambda console에서 [Functions] - [lambda-duplication-checker]을 선택한후, 코드를 업로드 합니다.

[Upload from] 버튼을 누른후에 아래처럼 [.zip file]을 선택합니다. 이후 다운로드한 파일에서 “deploy.zip” 을 선택합니다.

10) 업로드 후에는 자동으로 [Deploy]이 됩니다. 하지만 추후 console에서 바로 수정시에는 아래와 같이 [Deploy]를 선택하여 배포하여야 합니다.

![image](https://user-images.githubusercontent.com/52392004/156530512-59dbecee-2336-45cb-9f37-ca9177465b9a.png)
