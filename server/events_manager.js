const fs = require('fs');
const util = require('util');
const SKELETON_FILE = 'skeleton.jsonld';
const EVENTS_FILE = 'events.jsonld';
readFile = util.promisify(fs.readFile);

class EventsManager {
    constructor() {
        console.log('Creating Events_manager instance');
    }
    /**
     * Generate fake events with a given target size (in kB).
     * @param targetSize
     * @returns {Promise<void>}
     */
    async generate(targetSize) {
        let skeleton = await readFile(SKELETON_FILE, { encoding: 'utf8' });
        skeleton = JSON.parse(skeleton);
        let events = await readFile(EVENTS_FILE, { encoding: 'utf8' });
        events = JSON.parse(events);
        skeleton['prov:generatedAtTime'] = new Date();
        // Meet the targetSize requirement TODO
        skeleton['@graph'] = events;
        return skeleton;
    }
}

module.exports = EventsManager;