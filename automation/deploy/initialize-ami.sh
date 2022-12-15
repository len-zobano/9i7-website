#!/bin/bash

# updates required by default linux
sudo yum update -y

# install git
sudo yum install git -y

# install gcc - needed?
# sudo yum install gcc -y

# install node / npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 16

# clone site
https://github.com/len-zobano/9i7-website.git
cd 9i7-website

# build site
npm install
npm run build