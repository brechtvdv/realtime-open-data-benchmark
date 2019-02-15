const express = require('express');
const process = require('process');
const Influx = require('influx');
const EventsManager = require('./events_manager.js');
const config = require('./config.json');

class Server {
    /**
     * Constructs a Server object.
     * The constructors starts the Express server, configures the routes and sets up the Influx DB.
     */
    constructor() {
        this._currentEvents = {};
        this._eventsManager = new EventsManager();
        this._app = express();
        this._influx = new Influx.InfluxDB({
            host: config.influx.host,
            database: config.influx.database,
            schema: [
                {
                    measurement: 'usage',
                    fields: {
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
                    measurement: 'generated_events',
                    fields: {
                        size: Influx.FieldType.INTEGER,
                        provenTimestamp: Influx.FieldType.STRING,
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
            .then(() => {
                // Launch server
                let server = this.app.listen(config.server.port, () => {
                    let host = server.address().address;
                    let port = server.address().port;

                    console.log("Server is listening at http://%s:%s", host, port);
                });
                // Start event generation
                setInterval(this.generateNewEvents, config.eventGenerationInterval, this);
            })
            .catch((err) => {
                console.error(`Error creating Influx database! ${err.stack}`);
            })

        // Handle usage logging
        this.app.use((req, res, next) => {
            // Connection opened
            this.saveUsage('open');

            // Connection closed
            res.on('close', () => {
                this.saveUsage('close');
            });

            // Find the next resource that matches with the URL
            next();
        });

        // Polling resource
        this.app.get('/poll', (req, res) => {
            res.json(this.currentEvents);
        });

        // Server-Sent-Events resource
        this.app.get('/sse', (req, res) => {
            res.send('SSE');
        });
    }

    /**
     * Save resource usage of the server to Influx DB.
     * @param event: reason
     */
    saveUsage(event) {
        console.info('EVENT: ' + event);
        console.info('CPU: ' + JSON.stringify(process.cpuUsage()));
        console.info('MEM: ' + JSON.stringify(process.memoryUsage()));

        this.influx.writePoints([
            {
                measurement: 'usage',
                tags: {
                    event: event
                },
                fields: {
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
    }

    /**
     * Save the generated event meta data to Influx DB.
     * @param event: reason
     * @param size: event data size in bytes
     * @param provenTimestamp: JS Date object when the event data has been generated
     */
    saveGenerationEvent(event, size, provenTimestamp) {
        console.info('EVENT: ' + event);
        console.info('SIZE: ' + size);
        console.info('PROVEN TIMESTAMP: ' + provenTimestamp.toISOString());

        this.influx.writePoints([
            {
                measurement: 'generated_events',
                tags: {
                    event: event
                },
                fields: {
                    size: size,
                    provenTimestamp: provenTimestamp.toISOString()
                },
            }
        ]).catch((err) => {
            console.error(`Error while saving data to InfluxDB! ${err.stack}`)
        })
    }

    /**
     * Generate new events with the configured parameters from config.json.
     * @returns {Promise<void>}
     */
    async generateNewEvents(self) {
        // Generate events
        let max = config.indexOffsetRange.max;
        let min = config.indexOffsetRange.min;
        let indexOffset = Math.round(Math.random() * (max - min) + min);
        let e = await self.eventsManager.generate(config.targetSize, indexOffset);
        let size = e['size'];
        let provenTimestamp = e['provenTimestamp'];

        // Update the current event list
        self.currentEvents = e['data'];

        // Log with Influx DB
        self.saveGenerationEvent('generation', size, provenTimestamp);
    }

    // Getters & Setters
    get app() {
        return this._app;
    }

    get influx() {
        return this._influx;
    }

    get eventsManager() {
        return this._eventsManager;
    }

    get currentEvents() {
        return this._currentEvents;
    }

    set currentEvents(e) {
        this._currentEvents = e;
    }
}

let s = new Server();