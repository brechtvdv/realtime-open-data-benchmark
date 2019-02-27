const BaseClient = require('./base.js');
const EventSource = require('eventsource');
const config = require('./config.json');

class PubSubClient extends BaseClient {
    constructor() {
        super();
        this._EventSource = new EventSource(config.server + '/sse');
        this.EventSource.onmessage = this.handleOnMessage;
        this.EventSource.onerror = this.handleOnError;
    }

    /**
     * Handles the message stream data.
     * @param msg
     */
    handleOnMessage(msg) {
        console.debug('Message: ' + JSON.stringify(JSON.parse(msg.data), null, 4));
        this.saveUsage('received');
    }

    /**
     * In case of an error, this method will be called.
     * @param err
     */
    handleOnError(err) {
        // Keep track of reconnecting errors
        if(err.readyState === EventSource.CONNECTING) {
            console.info('Reconnecting to EventSource...');
            this.saveUsage('reconnecting');
        }
        else {
            console.error(`EventSource error: ${JSON.stringify(err, null, 4)}`);
        }
    }

    get EventSource() {
        return this._EventSource;
    }
}

module.exports = PubSubClient;