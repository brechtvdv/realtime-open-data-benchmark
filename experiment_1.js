const Influx = require('influxdb-nodejs');
//const client = new Influx(`http://influxdb.test10.wall2-ilabt-iminds-be.wall1.ilabt.iminds.be:8086/metrics`);

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