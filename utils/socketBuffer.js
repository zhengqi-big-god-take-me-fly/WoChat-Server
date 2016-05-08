var EventEmitter = require('events');
var util = require('util');

function SocketBuffer() {
    this.message = '';
}

util.inherits(SocketBuffer, EventEmitter);

SocketBuffer.prototype.addBuffer = function (buffer) {
    var data = buffer.toString('utf8');
    this.message += data;
    try {
        var rst = JSON.parse(this.message);
        this.emit('packet', rst);
        this.message = '';
    } catch (err) {
        if (!(err instanceof SyntaxError)) {
            throw err;
        }
    }
}

module.exports = SocketBuffer;
