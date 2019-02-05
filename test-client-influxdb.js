const Influx = require('influxdb-nodejs');
const client = new Influx(`http://${process.env.INFLUX_HOST}:8086/${process.env.INFLUX_DATABASE}`);

/*# The series name must be a string. Add dependent fields/tags
        # in curly brackets.
        series_name = 'requests'

        # Defines all the fields in this time series.
        fields = ['requests']

        # Defines all the tags for the series.
        tags = ['server_name', 'experiment']*/

const fieldSchema = {
  requests: 'i'
};
const tagSchema = {
  /*spdy: ['speedy', 'fast', 'slow'],
  method: '*',
  // http stats code: 10x, 20x, 30x, 40x, 50x
  type: ['1', '2', '3', '4', '5'],*/
};
client.schema('requests', fieldSchema, tagSchema, {
  // default is false
  stripUnknown: true,
});

client.write('requests')
  .tag({  
  })
  .field({
    requests: 1,
  })
  .then(() => console.info('write point success'))
  .catch(console.error);