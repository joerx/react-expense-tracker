# SAM Backend for Expense Tracker

## Deploy

```sh
# Find bucket to use for deployment
aws s3 ls | grep aws-sam-cli-managed

S3_BUCKET=<bucket_name>

sam deploy \
  --template-file template.yml \
  --stack-name expense-tracker-sam \
  --region ap-southeast-1 \
  --capabilities CAPABILITY_IAM \
  --s3-bucket $S3_BUCKET
```

## Local DynamoDB

```sh
docker network create local-dev

docker run -d -p 8000:8000 --network local-dev --name dynamodb amazon/dynamodb-local

aws dynamodb create-table --cli-input-json file://dynamodb/create-table.json --endpoint-url http://localhost:8000

aws dynamodb list-tables  --endpoint-url http://localhost:8000

npm run dev-stack
```

- In a new terminal window:

```sh
sam build 

curl http://localhost:3000/transactions
```

## Deployment Via CloudFormation

```sh
aws cloudformation package --template template.yml --s3-bucket $S3_BUCKET --output-template template-export.yml

aws cloudformation deploy --template-file template-export.yml --stack-name expense-tracker-sam --capabilities CAPABILITY_IAM
```

## Logs

- Install https://github.com/jorgebastida/awslogs
- List log group: `awslogs groups`  
- Watch logs: `awslogs get <log-group-name> -w`

## Resources 

- https://docs.aws.amazon.com/codedeploy/latest/userguide/tutorial-lambda-sam-deploy.html

## API Usage

Set URL:

```bash
API_URL=http://localhost:3000
```

Get transactions:

```bash
curl $API_URL/transactions
```

Create transaction:

```bash
curl -XPOST -H"Content-type: application/json" -d'{"text": "AWS bill", "amount": -5000}' $API_URL/transactions
```

Delete transaction:

```bash
curl -XDELETE $API_URL/transactions/63611bb3-93cb-421c-8e57-0bbc958eec68
```
