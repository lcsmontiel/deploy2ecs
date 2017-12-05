var AWS = require('aws-sdk');

exports.handler = function(event, context,callback) {
    console.log("Starting...");
    var jobEvent = event["CodePipeline.job"];
    var paramsDecoded = jobEvent.data.actionConfiguration.configuration.UserParameters;
    var paramsEncoded = JSON.parse(paramsDecoded);
    AWS.config.update({region: paramsEncoded.region});
    var ecs = new AWS.ECS();
    var codepipeline = new AWS.CodePipeline();

    var params = {
        services: [
            paramsEncoded.service
        ],
        cluster: paramsEncoded.cluster
    };
    ecs.describeServices(params, function(err, data) {
        if (err){
            console.log(err, err.stack);
            putJobFailure(err.message);
        }else{
            var taskDefinition = data.services[0].taskDefinition.match(/\/(.*)/)[1];
            ecs.describeTaskDefinition({taskDefinition: taskDefinition}, function (err, data) {
                if (err){
                    console.log(err, err.stack);
                    putJobFailure(err);
                }else{
                    var newTaskDefinition = data.taskDefinition;
                    delete newTaskDefinition['taskDefinitionArn'];
                    delete newTaskDefinition['revision'];
                    delete newTaskDefinition['status'];
                    delete newTaskDefinition['requiresAttributes'];
                    delete newTaskDefinition['compatibilities'];
                    ecs.registerTaskDefinition(newTaskDefinition, function (err, data) {
                        if (err){
                            console.log(err, err.stack);
                            putJobFailure(err.message);
                        }else{
                            var newTaskDefinition = data.taskDefinition.taskDefinitionArn.match(/\/(.*)/)[1];
                            ecs.updateService({
                                cluster: paramsEncoded.cluster,
                                service: paramsEncoded.service,
                                taskDefinition: newTaskDefinition
                            },function(err,data){
                                if (err){
                                    console.log(err, err.stack);
                                    putJobFailure(err.message);
                                }else{
                                    console.log("New Task Definition: "+newTaskDefinition);
                                    putJobSuccess("New Task Definition: "+newTaskDefinition);
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    var putJobSuccess = function(message) {
        var params = {
            jobId: jobEvent.id
        };

        codepipeline.putJobSuccessResult(params, function(err, data) {
            if(err) {
                context.fail(err);
            } else {
                context.succeed(message);
            }
        });
    };

    var putJobFailure = function(message) {
        var params = {
            jobId: jobEvent.id,
            failureDetails: {
                message: JSON.stringify(message),
                type: 'JobFailed',
                externalExecutionId: context.invokeid
            }
        };

        codepipeline.putJobFailureResult(params, function(err, data) {
            context.fail(message);
        });
    };
};

