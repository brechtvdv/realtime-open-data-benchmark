const fs = require('fs');
const util = require('util');
const jsonSize = require('json-size');
const SKELETON_FILE = 'skeleton.jsonld';
const EVENTS_FILE = 'events.jsonld';
readFile = util.promisify(fs.readFile);

class EventsManager {
    /**
     * Generate fake events with a given target size (in bytes).
     * The index offset allows you to go loop further
     * @param targetSize
     * @param indexOffset = 0
     * @returns {Promise<{data, size}>}
     */
    async generate(targetSize, indexOffset = 0) {
        console.debug('Generating events with target size: ' + targetSize + ' bytes and index offset: ' + indexOffset);

        // Read and parse the skeleton
        let skeleton = await readFile(SKELETON_FILE, { encoding: 'utf8' });
        skeleton = JSON.parse(skeleton);

        // Read and parse the events
        let events = await readFile(EVENTS_FILE, { encoding: 'utf8' });
        events = JSON.parse(events);

        // Update the generatedAtTime time to the skeleton
        let provenTimestamp = new Date();
        skeleton['prov:generatedAtTime'] = provenTimestamp;

        // Generate events
        let dataSize = jsonSize(skeleton);
        if(dataSize > targetSize) {
            console.warn('Skeleton is already bigger than the targetSize, graph will be empty!');
        }
        let eventCounter = indexOffset;
        while(dataSize <= targetSize) {
            // Get the current event and update the dataSize counter
            let e = events[eventCounter];
            dataSize += jsonSize(e);

            // Add the event to the graph
            skeleton['@graph'].push(e);

            // Go to the next event
            eventCounter++;
            if(eventCounter >= events.length) {
                eventCounter = 0;
                console.warn('Overflow in events, reusing previous events');
            }
        }
        console.debug('Generated events with size: ' + dataSize + ' bytes');

        return {
            data: skeleton,
            size: dataSize,
            provenTimestamp: provenTimestamp
        };
    }
}

module.exports = EventsManager;