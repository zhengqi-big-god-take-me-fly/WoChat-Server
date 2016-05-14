var net = require('net');
var debug = require('debug')('WoChat-Server:socket');
var SEClient = require('./utils/socketEvent');
var SocketBuffer = require('./utils/socketBuffer');
var onAuth = require('./socket_routes/auth');
var onMessageReceipt = require('./socket_routes/message_receipt');

// var connections = {};

module.exports = {
    createServer: createServer
};

function createServer(port) {
    socketPort = port;
    server = net.createServer();
    server.listen(socketPort);
    server.on('listening', onListening);
    server.on('error', onError);
    server.on('connection', onConnection)
}

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'socketPort ' + addr.port;
    debug('Listening on ' + bind);
}

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof socketPort === 'string'
        ? 'Pipe ' + socketPort
        : 'Port ' + socketPort;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

net.Socket.prototype.setClient = function (id) {
    var clientId = id.toString();
    // connections[clientId] = this;
    this.clientId = clientId;
    var client = new SEClient(clientId);
    var connection = this;
    client.on('message', function (msgs) {
        socketWriter(connection, {
            type: 'msg',
            data: msgs
        });
    });
}

net.Socket.prototype.removeClient = function () {
    if (this.clientId) {
        var clientId = this.clientId;
        // delete connections[clientId];
        SEClient.remove(clientId);
    }
}

function onConnection(connection) {
    connection.setEncoding('utf8');
    connection.setTimeout(2 * 60 * 1000); // 2 min
    connection.setNoDelay(true);

    socketWriter(connection, {
        type: 'info',
        data: 'Hello\n'
    });

    connection.on('end', function () {
        connection.removeClient();
        debug('socket of client ' + connection.clientId + ' closed');
    });

    var socketBuffer = new SocketBuffer();
    socketBuffer.on('packet', onData);

    connection.on('data', function (data) {
        socketBuffer.addBuffer(data);
    });

    connection.on('timeout', function () {
        connection.end();
    });

    connection.on('error', function () {
        debug('error: ', error);
        connection.end();
    });

    function onData (packet) {
        debug('receive packet: ', packet);
        switch (packet.type) {
            // case 'info':
                // onInfo(packet.data, connection);
                // break;
            case 'auth':
                onAuth(packet.data, connection);
                break;
            case 'msgrcpt':
                onMessageReceipt(packet.data, connection);
                break;
        }
    }

}

function socketWriter(s, d) {
    debug('sending: ', d);
    if (s && s.write && d) {
        var str;
        if (typeof d === 'object') {
            str = JSON.stringify(d);
        } else {
            str = d;
        }
        str += '/n/n';
        s.write(str);
    }
}
