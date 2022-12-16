#!/bin/bash
ITERATION=6
BUILD_LOG_FILE=~/build.log
printf "\n\n\n\n\n Starting 9i7 AMI build, iteration $ITERATION\n" > $BUILD_LOG_FILE
HOME="/root"
cd $HOME

# updates required by default linux
printfexport NVM_DIR="$HOME/.nvm" "\n\n\n\n\n Updating yum\n" >> $BUILD_LOG_FILE 2>&1
sudo yum update -y >> $BUILD_LOG_FILE 2>&1 

# install git
printf "\n\n\n\n\n Installing git\n" >> $BUILD_LOG_FILE 2>&1
sudo yum install git -y >> $BUILD_LOG_FILE 2>&1

# install gcc - needed?
printf "\n\n\n\n\n Installing gcc\n" >> $BUILD_LOG_FILE 2>&1
sudo yum install gcc -y >> $BUILD_LOG_FILE 2>&1

# install node / npm
printf "\n\n\n\n\n Installing nvm, step 1\n" >> $BUILD_LOG_FILE 2>&1
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm' >> ~/.bashrc
echo "source bashrc:"  >> $BUILD_LOG_FILE 2>&1
source ~/.bashrc  >> $BUILD_LOG_FILE 2>&1
echo "cat bashrc:"  >> $BUILD_LOG_FILE 2>&1
cat ~/.bashrc  >> $BUILD_LOG_FILE 2>&1
mkdir $NVM_DIR >> $BUILD_LOG_FILE 2>&1

printf "\n\n\n\n\n Installing nvm, step 2\n" >> $BUILD_LOG_FILE 2>&1
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash >> $BUILD_LOG_FILE 2>&1

printf "\n\n\n\n\n Installing nvm, step 3\n" >> $BUILD_LOG_FILE 2>&1
. ~/.nvm/nvm.sh >> $BUILD_LOG_FILE 2>&1

printf "\n\n\n\n\n Installing node\n" >> $BUILD_LOG_FILE 2>&1
nvm install 16 >> $BUILD_LOG_FILE 2>&1

# clone site
printf "\n\n\n\n\n Cloning project\n" >> $BUILD_LOG_FILE 2>&1
git clone https://github.com/len-zobano/9i7-website.git >> $BUILD_LOG_FILE 2>&1
cd 9i7-website  

# build site
printf "\n\n\n\n\n Building\n" >> $BUILD_LOG_FILE 2>&1
npm install >> $BUILD_LOG_FILE 2>&1
npm run build >> $BUILD_LOG_FILE 2>&1
npm install -g serve

printf "\n\n\n\n\n Done initializing AMI, iteration $ITERATION\n"  >> $BUILD_LOG_FILE 2>&1
