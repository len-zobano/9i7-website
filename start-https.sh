#!/bin/bash
export HTTPS=true
export SSL_CRT_FILE=./suitcase-teahouse.com/cert.pem
export SSL_KEY_FILE=./suitcase-teahouse.com/privkey.pem
export PORT=443
node ./node_modules/.bin/react-scripts start
