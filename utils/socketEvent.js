var EventEmitter = require('events');
var util = require('util');

var clients = {};

function Client(id) {
    clients[id] = this;
    EventEmitter.call(this);
}

util.inherits(Client, EventEmitter);

Client.emit = function (id, event, parameters) {
    if (clients.hasOwnProperty(id)) {
        Client.prototype.emit.apply(clients[id], Array.prototype.slice.call(arguments, 1));
    }
}

Client.remove = function (id) {
    if (clients.hasOwnProperty(id)) {
        delete clients[id];
    }
}

module.exports = Client;
