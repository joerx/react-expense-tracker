# Expense Tracker Application

Based on React expense tracker app on YouTube with some additional components added by me. Object was to play around with the various components of AWS CodePipeline for serverless apps. AWS resources are provisioned through CDK.

## Components

## Notes

### Repo Layout

- Having all parts in a single repo was conventient for this lab project
- In real live you may need to split them up
- Downside is that each push to any component would trigger redeploys to all the others
- E.g. changes to backend would also redeploy the frontend & invalidate the CDN cache
