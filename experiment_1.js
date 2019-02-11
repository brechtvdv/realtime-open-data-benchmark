// Example CLI command:
// kubectl run rt --image=172.17.0.1:5000/realtime-test-X --env="INFLUX_HOST=172.17.0.1" --replicas=3

const Influx = require('influxdb-nodejs');

const INFLUX_HOST = process.env.INFLUX_HOST ? process.env.INFLUX_HOST : 'localhost';
const INFLUX_DATABASE = process.env.INFLUX_DATABASE ? process.env.INFLUX_DATABASE : 'metrics';

const client = new Influx(`http://${INFLUX_HOST}:8086/${INFLUX_DATABASE}`);

/*# The series name must be a string. Add dependent fields/tags
        # in curly brackets.
        series_name = 'requests'

        # Defines all the fields in this time series.
        fields = ['requests']

        # Defines all the tags for the series.
        tags = ['server_name', 'experiment']*/

const podName = process.env.POD_NAME ? process.env.POD_NAME : 'host1';

const fieldSchema = {
  requests: 'i'
};
const tagSchema = {
  host: '*'
};
client.schema('requests', fieldSchema, tagSchema, {
  // default is false
  stripUnknown: true,
});

client.write('requests')
  .tag({ 
	host: podName
  })
  .field({
    requests: 1,
  })
  .queue();

client.syncWrite()
  .then(() => console.info('sync write queue success'))
  .catch(err => console.error(`sync write queue fail, err:${err.message}`));

//process.exit()