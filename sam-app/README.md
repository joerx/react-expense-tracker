# SAM Backend for Expense Tracker

## TODO

[x] Basic stack setup & deployment
[x] Add API gateway integration (proxy mode)
[x] Local development setup
[x] Implement list expenses
[x] Implement add expense
[x] Implement delete expense
[ ] Refactor code
[ ] Deploy frontend

## Deploy

```sh
sam deploy \
  --template-file template.yml \
  --stack-name expense-tracker-sam \
  --region ap-southeast-1 \
  --capabilities CAPABILITY_IAM \
  --s3-bucket aws-sam-cli-managed-default-samclisourcebucket-1wvvyi6xwwa4x
```

## Local DynamoDB

```sh
docker network create local-dev

docker run -d -p 8000:8000 --network local-dev --name dynamodb amazon/dynamodb-local

aws dynamodb create-table --cli-input-json file://dynamodb/create-table.json --endpoint-url http://localhost:8000

aws dynamodb list-tables  --endpoint-url http://localhost:8000

sam local start-api --docker-network local-dev
```

- In a new terminal window:

```sh
sam build 

curl http://localhost:3000/transactions
```

## Logs

- Install https://github.com/jorgebastida/awslogs
- List log group: `awslogs groups`  
- Watch logs: `awslogs get <log-group-name> -w`

## Resources 

- https://docs.aws.amazon.com/codedeploy/latest/userguide/tutorial-lambda-sam-deploy.html
