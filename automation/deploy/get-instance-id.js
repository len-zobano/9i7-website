const { Console } = require('console');
const fs = require('fs');
let runInstanceResponse = JSON.parse(fs.readFileSync('run-instance-response.json'));
console.log(runInstanceResponse.Instances[0].InstanceId);
