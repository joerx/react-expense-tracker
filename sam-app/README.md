# SAM Backend for Expense Tracker

## TODO

[x] Basic stack setup & deployment
[ ] Add API gateway integration (proxy mode)
[ ] Implement list expenses
[ ] Implement add expense
[ ] Implement delete expense

## Deploy

```sh
sam deploy \
  --template-file template.yml \
  --stack-name expense-tracker-sam \
  --region ap-southeast-1 \
  --capabilities CAPABILITY_IAM \
  --s3-bucket aws-sam-cli-managed-default-samclisourcebucket-1wvvyi6xwwa4x
```

## Resources 

- https://docs.aws.amazon.com/codedeploy/latest/userguide/tutorial-lambda-sam-deploy.html
