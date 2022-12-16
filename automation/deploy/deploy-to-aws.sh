#!/bin/bash
echo 'start deploy to aws'
KEY_NAME=9i7-website-key

# If AMI doesn't exist,

    # Create AMI, install react, pull repo, shut down, save AMI
    
    # Create key to SSH into the instance
    if [[ ! -f 9i7-website-key.pem ]]
    then
        #generate key pair
        aws ec2 create-key-pair \
        --key-name $KEY_NAME \
        --output text \
        --region us-east-2 \
        > key-pair-response
        #strip the key and save it
        sed -e 's/.*-----BEGIN/-----BEGIN/g' -e 's/KEY-----.*$/KEY-----/g' key-pair-response > $KEY_NAME.pem
        chmod 400 $KEY_NAME.pem
        #remove the temporary file
        rm key-pair-response
    fi

    # Copy user data into temporary file
    INITIALIZE_AMI_FILE="initialize-ami-"$(echo $RANDOM)".sh"
    cp initialize-ami.sh $INITIALIZE_AMI_FILE

    # Create blank instance
    aws ec2 run-instances \
        --image-id ami-0beaa649c482330f7 \
        --count 1 \
        --instance-type t2.micro \
        --region us-east-2 \
        --key-name $KEY_NAME \
        --user-data "file://./"$INITIALIZE_AMI_FILE \
        > \
        run-instance-response.json

    # Get ID of created instance
    AMI_INSTANCE_ID=$(node get-instance-id.js)
    echo "instance id: $AMI_INSTANCE_ID"

    # Delete temporary ser data file
    # rm $INITIALIZE_AMI_FILE

    # Confirm that initialization is complete

    # Save AMI

# Create new EC2 instance from AMI

    # Get AMI ID

# Test to make sure instance is running

# Point networking to new deploy

# If old instance exists, shut it down
echo 'end deploy to aws'