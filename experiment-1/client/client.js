const process = require('process');
const PollingClient = require('./polling.js');
const PubSubClient = require('./pubsub.js');
const config = require('./config.json');
const podName = process.env.POD_NAME? process.env.POD_NAME: config.defaultPodName;

// Process arguments
if(process.argv.length === 3) {
    // Check arguments
    let mode = process.argv[2];
    let client;
    if(mode !== 'polling' && mode !== 'pubsub') {
        console.error('Unknown mode. Usage: node client.js <mode>');
        process.exit(1);
    }

    // Create the right client depending on the arguments
    if(mode == 'polling') {
        client = new PollingClient();
    }
    else if(mode == 'pubsub') {
        client = new PubSubClient();
    }
    console.info(`Operating as ${mode} client`);
}
else {
    console.error('Incorrect number of arguments. Usage: node client.js <mode>');
    process.exit(1);
}