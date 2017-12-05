# Deploy2ECS - Deploy a container to AWS Elastic Container Service

Deploy2ECS is a Lambda Function to be executed into a step of AWS Codepipeline to update the Elastic Container Service

## Installation
Execute the following steps
```bash
git clone https://github.com/lcsmontiel/deploy2ecs.git
npm install && zip -r deploy2ecs.zip *
```

Then upload the the deploy2ecs.zip to creation of a Lambda Function and configure it with a role which can Describe, Update task definition and service.

## Configure the CodePipeline
Configure Codepipeline to execute the lambda configured below and put the following json in User Parameters

```json
{
    "region": "us-east-1",
    "cluster": "cluster-name",
    "service": "service-name"
}
```
If successfully Deploy2ecs will register a new task definition with the parameters of the previous task definition and update it to the configured service.