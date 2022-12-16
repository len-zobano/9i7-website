#!/bin/bash
ITERATION=1
printf "\n\n\n\n\n Starting 9i7 AMI build, iteration $ITERATION\n"

# updates required by default linux
printf "\n\n\n\n\n Updating yum\n" > ~/build-log
sudo yum update -y >> ~/build-log

# install git
printf "\n\n\n\n\n Installing git\n" >> ~/build-log
sudo yum install git -y >> ~/build-log

# install gcc - needed?
printf "\n\n\n\n\n Installing gcc\n" >> ~/build-log
sudo yum install gcc -y >> ~/build-log

# install node / npm
printf "\n\n\n\n\n Installing nvm, step 1\n" >> ~/build-log
touch ~/.bashrc
echo "cat bashrc:"
cat ~/.bashrc
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash >> ~/build-log

printf "\n\n\n\n\n Installing nvm, step 2\n" >> ~/build-log
. ~/.nvm/nvm.sh >> ~/build-log

printf "\n\n\n\n\n Installing node\n" >> ~/build-log
nvm install 16 >> ~/build-log

# clone site
printf "\n\n\n\n\n Cloning project\n" >> ~/build-log
git clone https://github.com/len-zobano/9i7-website.git >> ~/build-log
cd 9i7-website  

# build site
printf "\n\n\n\n\n Building\n" >> ~/build-log
npm install >> ~/build-log
npm run build >> ~/build-log
npm install -g serve

printf "\n\n\n\n\n Done initializing AMI, iteration $ITERATION\n"
