const Influx = require('influx');
const process = require('process');
const osUtils = require('os-utils');
const config = require('./config.json');

class BaseClient {
    constructor() {
        this._influx = new Influx.InfluxDB({
            host: config.influx.host,
            database: config.influx.database,
            schema: [
                {
                    measurement: 'usage_client',
                    fields: {
                        cpuPercentage: Influx.FieldType.FLOAT,
                        cpuUser: Influx.FieldType.INTEGER,
                        cpuSystem: Influx.FieldType.INTEGER,
                        ramRss: Influx.FieldType.INTEGER,
                        ramHeapTotal: Influx.FieldType.INTEGER,
                        ramHeapUsed: Influx.FieldType.INTEGER,
                        ramExternal: Influx.FieldType.INTEGER
                    },
                    tags: [
                        'event'
                    ]
                },
                {
                    measurement: 'received_events_client',
                    fields: {
                        size: Influx.FieldType.INTEGER,
                        provenTimestamp: Influx.FieldType.STRING,
                        receivedAtTimestamp: Influx.FieldType.STRING,
                        requestedAtTimestamp: Influx.FieldType.STRING
                    },
                    tags: [
                        'event'
                    ]
                }
            ]
        });

        // Setup Influx DB
        this.influx.getDatabaseNames()
            .then((names) => {
                if (!names.includes(config.influx.database)) {
                    return this.influx.createDatabase(config.influx.database);
                }
            })
            .catch((err) => {
                console.error(`Error creating Influx database! ${err.stack}`);
            })

        // Initial usage
        this.saveUsage('setup');
    }

    /**
     * Saves the CPU and RAM usage to the Influx DB instance.
     * @param event
     */
    saveUsage(event) {
        let cpuUsagePercentage = 0.0;
        osUtils.cpuUsage(((usage) => {
            cpuUsagePercentage = usage;
            console.info('EVENT: ' + event);
            console.info('CPU (time ms): ' + JSON.stringify(process.cpuUsage()));
	        console.info('CPU (%): ' + usage);
            console.info('MEM: ' + JSON.stringify(process.memoryUsage()));

            this.influx.writePoints([
                {
                    measurement: 'usage_client',
                    tags: {
                        event: event
                    },
                    fields: {
                        cpuPercentage: cpuUsagePercentage,
                        cpuUser: process.cpuUsage()['user'],
                        cpuSystem: process.cpuUsage()['system'],
                        ramRss: process.memoryUsage()['rss'],
                        ramHeapTotal: process.memoryUsage()['heapTotal'],
                        ramHeapUsed: process.memoryUsage()['heapUsed'],
                        ramExternal: process.memoryUsage()['external']
                    },
                }
            ]).catch((err) => {
                console.error(`Error while saving data to InfluxDB! ${err.stack}`)
            })
        }).bind(this));
    }

    /**
     * Saves the received event meta data to the Influx DB instance.
     * @param event
     * @param size
     * @param provenTimestamp
     * @param receivedAtTimestamp
     * @param requestedAtTimestamp
     */
    saveReceivedEvent(event, size, provenTimestamp, receivedAtTimestamp, requestedAtTimestamp) {
        this.influx.writePoints([
            {
                measurement: 'received_events_client',
                tags: {
                    event: event
                },
                fields: {
                    size: size,
                    provenTimestamp: provenTimestamp.toISOString(),
                    receivedAtTimestamp: receivedAtTimestamp.toISOString(),
                    requestedAtTimestamp: requestedAtTimestamp.toISOString()
                },
            }
        ]).catch((err) => {
            console.error(`Error while saving data to InfluxDB! ${err.stack}`)
        })
    }

    get influx() {
        return this._influx;
    }
}

module.exports = BaseClient;
