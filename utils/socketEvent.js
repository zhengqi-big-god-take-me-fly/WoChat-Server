var EventEmitter = require('events');
var util = require('util');

var clients = {};

function Client(id) {
    clients[id] = this;
    EventEmitter.call(this);
}

util.inherits(Client, EventEmitter);
// Message.prototype = EventEmitter;

function Server() {
    EventEmitter.call(this);
}

util.inherits(Server, EventEmitter);

var server = new Server();

Client.emit = function (id, event, parameters) {
    if (clients.hasOwnProperty(id)) {
        Client.prototype.emit.apply(clients[id], Array.prototype.slice.call(arguments, 1));
        Server.prototype.emit.apply(server, (['sended']).concat(arguments));
    } else {
        Server.prototype.emit.apply(server, (['unsend']).concat(arguments));
    }
}

Client.remove = function (id) {
    if (clients.hasOwnProperty(id)) {
        delete clients[id];
    }
}

module.exports = {
    Client: Client,
    server: server
};
