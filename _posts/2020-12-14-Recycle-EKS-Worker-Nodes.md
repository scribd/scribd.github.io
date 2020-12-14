---
layout: post
title:  "Recycle EKS worker nodes"
author: Kuntalb
tags:
- eks worker node
- kubernets
- lambda
- step function
team: Core Platform
---

## Introduction

Few months ago, we came across a problem we need to upgrade our kubernetes version in AWS EKS without having a downtime. Getting the control plane upgraded without having a downtime was a easier task, manual but easy. The challenges lies in getting the physical worker node updated. We had to complete the following tasks manually,

1. Create a new worker node with latest configuration
2. Put the old node in standby mode.
3. Taint the old node to unschedulable 
4. Then wait for all our existing pods to die gracefully. we have some really long running pods some of them took 20 hours or more to actually finish.
5. Then detach and kill the old node.

While doing that we were thinking how about having an automated module, which will do all these work by just a button click. So we come up with a [terraform module](https://github.com/scribd/terraform-aws-recycle-eks) which will do all these jobs for us.

## What Problem does it Solve

1. Periodic recycling of old worker nodes. In fact we can create a lifecycle hook while creating the node and integrate the lifecycle hook with this module. That way the whole periodic recycling will be fully automated via the lifecycle hook and zero downtime via this module, no need for manual intervention at all.
2. Minimal manual interventions while recycling a worker node.
3. This can be integrated with SNS/Cloudwatch events, so that in the middle of the night if there is a CPU spike this Step-function can step up and create a new node while allowing the old node to die gracefully. That way all new tasks coming in can be catered in the new node reducing pressure on the existing node while we investigate the root cause and continue to be in service. There are plenty more use cases like this.
4. This can make upgrading/patching of kubernetes and eks worker nodes much easier
5. Also this module has a custom label selector as an input, that will help the user to only wait for the pods that matters. Rest everything this module will ignore while waiting for the pods to gracefully finish

##Components

### Terraform
Terraform has always been our choice of tool for managing infrastructure, and using terraform for this module also gives us the opportunity to integrate this module with all other existing infra seemlessly.

### Lambdas and Step Function
[Orchestrating Amazon Kubernetes Service (EKS)](https://medium.com/@alejandro.millan.frias/managing-kubernetes-from-aws-lambda-7922c3546249) from [AWS Lambda and Amazon EKS Node Drainer](https://github.com/aws-samples/amazon-k8s-node-drainer) has already set a precedence that Lambdas can be a great tool to manage kubernetes infrastructure as well as EKS clusters. but lambdas have one limitation though that they are very short lived. If we run all steps through a single lambda function, it will eventually timeout while waiting for all existing pods to complete. So we need to split up the workflow into multiple lambdas and manage their lifecycles through a workflow manager.  Here comes [Step-function](https://aws.amazon.com/step-functions/?step-functions.sort-by=item.additionalFields.postDateTime&step-functions.sort-order=desc). Using step-function not only solves the problem of lambda time-outs but also provides us an opportunity to extend this module to be triggered automatically based on events.

## Design

1. Create a [step-function](https://github.com/scribd/terraform-aws-recycle-eks/blob/main/step-function.json) that will consist of 4 lambdas. This step function will handle the transfer of inputs across the lambda functions.
2. The [first lambda](https://github.com/scribd/terraform-aws-recycle-eks/blob/main/lambdas/putNodesToStandby.py) takes an instance id as an input, to put it in standby state. Using autoscaling api to automatically add a new instance to the group while putting the old instance to standby state. The old instance will get into "Standby" state only when the new instance is in fully "Inservice" state
3. Taint this "Standby" node in EKS using K8S API in [lambda](https://github.com/scribd/terraform-aws-recycle-eks/blob/main/lambdas/taintNodes.py) to prevent new pods from getting scheduled into this node
4. Periodically use K8S API check for status of “stateful” pods on that node based on the label selector provided. Another [Lambda](https://github.com/scribd/terraform-aws-recycle-eks/blob/main/lambdas/checkNodesForRunningPods.py) will do that
5. Once all stateful pods have completed on the node, i.e number of running pod reached 0, shut down that standby instance using AWS SDK via [lambda](https://github.com/scribd/terraform-aws-recycle-eks/blob/main/lambdas/detachAndTerminateNode.py).
6. We are not terminating the node, only shutting it down, just in case. In future releases, we will be start terminating the nodes

## Sample Execution
![](/post-images/2020-12-recycle-eks-worker/Step-Function-sample-output.png)
<font size="3"><center><i>Sample Execution output of the Step Function </i></center></font>

## Future Enhancements

1. Right now, in the first lambda we are putting a 300 sec sellp just to ensure that the new node is in IN Service mode before putting the old node to StandBy mode. We have to ensure this programatically rather than an arbitrary 300 sec sleep
2. Refactor the code to use as a common module for getting the access token.
3. Better logging and exception handling
4. Make use of namespace input while selecting the pods. Currently it checks for pods in all namespaces.
5. Find a terraform way to edit configmap/aws-auth, this step is still manual to make this module work.

