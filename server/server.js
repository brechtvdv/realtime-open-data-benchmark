const express = require('express');
const process = require('process');
const Influx = require('influx');
const EventsManager = require('./events_manager.js');
const events = new EventsManager();
const app = express();
const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'pubsub_vs_polling',
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
let currentEvents = {};

/**
 * Save resource usage of the server to Influx DB.
 * @param event
 */
function saveUsage(event) {
    console.info('EVENT: ' + event);
    console.info('CPU: ' + JSON.stringify(process.cpuUsage()));
    console.info('MEM: ' + JSON.stringify(process.memoryUsage()));

    influx.writePoints([
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
 * @param event
 * @param size
 * @param provenTimestamp
 */
function saveGenerationEvent(event, size, provenTimestamp) {
    console.info('EVENT: ' + event);
    console.info('SIZE: ' + size);
    console.info('PROVEN TIMESTAMP: ' + provenTimestamp.toISOString());

    influx.writePoints([
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

async function generateNewEvents() {
    // Read index offset range and target size from file TODO
    let high = 20;
    let low = 0;
    let indexOffset = Math.round(Math.random() * (high - low) + low);
    let targetSize = 5000;
    let e = await events.generate(targetSize, indexOffset);
    let size = e['size'];
    let provenTimestamp = e['provenTimestamp'];
    currentEvents = e['data'];
    saveGenerationEvent('generation', size, provenTimestamp);
}

// Handle usage logging
app.use((req, res, next) => {
    // Connection opened
    saveUsage('open');

    // Connection closed
    res.on('close', () => {
        saveUsage('close');
    });

    // Find the next resource that matches with the URL
    next();
});

// Polling resource
app.get('/poll', (req, res) => {
    res.json(currentEvents);
});

// Server-Sent-Events resource
app.get('/sse', (req, res) => {
    res.send('SSE');
});

// Setup Influx DB
influx.getDatabaseNames()
    .then((names) => {
        if (!names.includes('pubsub_vs_polling')) {
            return influx.createDatabase('pubsub_vs_polling');
        }
    })
    .then(() => {
        // Launch server
        let server = app.listen(4444, function () {
            let host = server.address().address;
            let port = server.address().port;

            console.log("Server is listening at http://%s:%s", host, port);
        });
        // Read interval generation from file TODO
        setInterval(generateNewEvents, 1000);
    })
    .catch((err) => {
        console.error(`Error creating Influx database!`);
    })

