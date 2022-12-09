#!/bin/bash

# If AMI doesn't exist,

    # Create AMI, install react, pull repo, shut down, save AMI

    # Create blank instance
    aws ec2 run-instances --image-id ami-0beaa649c482330f7 --count 1 --instance-type t2.micro --region us-east-2 > run-instance-response.json

    # Get ID of created instance


    # Run initialize-ami script on instance

    # Confirm that initialization is complete

    # Save AMI

# Create new EC2 instance from AMI

    # Get AMI ID

# Test to make sure instance is running

# Point networking to new deploy

# If old instance exists, shut it down