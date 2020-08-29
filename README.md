# Expense Tracker Application

Based on React expense tracker app on YouTube with some additional components added by me. Object was to play around with the various components of AWS CodePipeline for serverless apps. AWS resources are provisioned through CDK.

## Components

- Frontend: ReactJS app based on TBD
- Backend: MongoDB backend, for practice, not deployed atm
- SAM App: Serverless backend using DynamoDB based on AWS SAM
- CDK: CDK stacks for frontend (S3, CloudFront) and Code Pipelines

## Notes

### Repo Layout

- Having all parts in a single repo was conventient for this lab project
- In real live you may need to split them up
- Downside is that each push to any component would trigger redeploys to all the others
- E.g. changes to backend would also redeploy the frontend & invalidate the CDN cache

### GITHUB_TOKEN

- GITHUB_TOKEN must be set in local env
- Doesn't exist in the CodePipeline isn't needed at that point
- Still, since all stacks are instantiated, the token must exist (even an empty value will do)
- Better option might be to store the token in SecretsManager and always read it from there
