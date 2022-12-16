#!/bin/bash
ITERATION=3
BUILD_LOG_FILE=~/build.log
printf "\n\n\n\n\n Starting 9i7 AMI build, iteration $ITERATION\n" > $BUILD_LOG_FILE

# updates required by default linux
printfexport NVM_DIR="$HOME/.nvm" "\n\n\n\n\n Updating yum\n" >> $BUILD_LOG_FILE
sudo yum update -y >> $BUILD_LOG_FILE

# install git
printf "\n\n\n\n\n Installing git\n" >> $BUILD_LOG_FILE
sudo yum install git -y >> $BUILD_LOG_FILE

# install gcc - needed?
printf "\n\n\n\n\n Installing gcc\n" >> $BUILD_LOG_FILE
sudo yum install gcc -y >> $BUILD_LOG_FILE

# install node / npm
printf "\n\n\n\n\n Installing nvm, step 1\n" >> $BUILD_LOG_FILE
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm' >> ~/.bashrc
source ~/.bashrc
echo "cat bashrc:"  >> $BUILD_LOG_FILE
cat ~/.bashrc  >> $BUILD_LOG_FILE

printf "\n\n\n\n\n Installing nvm, step 2\n" >> $BUILD_LOG_FILE
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash >> $BUILD_LOG_FILE

printf "\n\n\n\n\n Installing nvm, step 3\n" >> $BUILD_LOG_FILE
. ~/.nvm/nvm.sh >> $BUILD_LOG_FILE

printf "\n\n\n\n\n Installing node\n" >> $BUILD_LOG_FILE
nvm install 16 >> $BUILD_LOG_FILE

# clone site
printf "\n\n\n\n\n Cloning project\n" >> $BUILD_LOG_FILE
git clone https://github.com/len-zobano/9i7-website.git >> $BUILD_LOG_FILE
cd 9i7-website  

# build site
printf "\n\n\n\n\n Building\n" >> $BUILD_LOG_FILE
npm install >> $BUILD_LOG_FILE
npm run build >> $BUILD_LOG_FILE
npm install -g serve

printf "\n\n\n\n\n Done initializing AMI, iteration $ITERATION\n"  >> $BUILD_LOG_FILE
