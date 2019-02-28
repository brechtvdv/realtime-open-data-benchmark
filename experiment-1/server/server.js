const express = require('express');
const process = require('process');
const Influx = require('influx');
const osUtils = require('os-utils');
const EventsManager = require('./events_manager.js');
const config = require('./config.json');
const util = require('util');

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
                    measurement: 'usage_server',
                    fields: {
                        cpuPercentage: Influx.FieldType.FLOAT,
                        cpuUser: Influx.FieldType.INTEGER,
                        cpuSystem: Influx.FieldType.INTEGER,
                        ramRss: Influx.FieldType.INTEGER,
                        ramHeapTotal: Influx.FieldType.INTEGER,
                        ramHeapUsed: Influx.FieldType.INTEGER,
                        ramExternal: Influx.FieldType.INTEGER,
                        amountOfClients: Influx.FieldType.INTEGER
                    },
                    tags: [
                        'event'
                    ]
                },
                {
                    measurement: 'generated_events_server',
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
        this._listeners = [];

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
            // CORS
            res.setHeader('Access-Control-Allow-Origin', '*');

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
            if(config.caching.enabled) {
                res.setHeader('Cache-Control', 'max-age=' + config.caching.maxAge);
            }
            res.json(this.currentEvents);
        });

        // Server-Sent-Events resource
        this.app.get('/sse', (req, res) => {
            // SSE stream requested
            if(req.headers.accept.indexOf('text/event-stream') > -1) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Expires', 0);
                res.setHeader('Connection', 'keep-alive');

                // Add client to listeners
                this.listeners.push(res);
                this.saveUsage('open');
                res.on('close', () =>  {
                    this.listeners.splice(this.listeners.indexOf(res), 1);
                    this.saveUsage('close');
                });
            }
            // If the client wants something else than SSE, return a HTTP 400 error
            else {
                res.writeHead(400, {});
                res.end('SSE failure, check your request please.');
            }
        });

        // Populate events
        this.generateNewEvents(this);

        // Init usage
        this.saveUsage('setup');
    }

    /**
     * Save resource usage of the server to Influx DB.
     * @param event: reason
     */
    saveUsage(event) {
        let cpuUsagePercentage = 0.0
        osUtils.cpuUsage(((usage) => {
            console.info('EVENT: ' + event);
            console.info('CPU (time ms): ' + JSON.stringify(process.cpuUsage()));
	        console.info('CPU (%): ' + usage);
            console.info('MEM: ' + JSON.stringify(process.memoryUsage()));
            cpuUsagePercentage = usage;
            this.influx.writePoints([
                {
                    measurement: 'usage_server',
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
                        ramExternal: process.memoryUsage()['external'],
                        amountOfClients: this.listeners.length
                    },
                }
            ]).catch((err) => {
                console.error(`Error while saving data to InfluxDB! ${err.stack}`)
            })
        }).bind(this));

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
                measurement: 'generated_events_server',
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

        // Update the current event list for HTTP polling
        self.currentEvents = e['data'];

        // Update each listener
        self.listeners.forEach((client) => {
            client.write("data: " + JSON.stringify(e['data']) + '\n\n');
        });

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

    get listeners() {
        return this._listeners;
    }

    set listeners(l) {
        this._listeners = l;
    }
}

let s = new Server();
