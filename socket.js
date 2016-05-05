var net = require('net');
var rid = require('./utils/rid');
var debug = require('debug')('WoChat-Server:socket');
var Client = require('./models/client');

var server, socketPort;
var clients = {};
var guestClients = {};

module.exports = {
    createServer: createServer,
    getClient: getClient,
    getGuestClient: getGuestClient
};

function createServer(port) {
    socketPort = port;
    server = net.createServer();
    server.listen(socketPort);
    server.on('listening', onListening);
    server.on('error', onError);
    server.on('connection', onConnection)
}

function getClient(cid) {
    return clients[cid];
}

function getGuestClient(gcid) {
    return guestClients[gcid];
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

function onConnection(sock) {
    var id = rid.get(24);
    // Process sock object
    sock['clientId'] = null;
    sock['guestClientId'] = id;
    sock.on('data', socketDataRouter);
    sock.on('close', socketCloseHandler);
    // TODO
    guestClients[id] = new Client(sock, getIdSender(id));
}

function socketDataRouter(data) {
    // Stub
}

function socketCloseHandler() {
    // Stub
}

function removeGuestClient(gcid) {
    if (gcid) {
        var client = guestClients[gcid];
        if (client) {
            var sock = client['sock'];
            if (sock && (sock.writable || sock.readable)) {
                sock.destroy();
            }
            guestClients[gcid] = null;
        }
    }
}

function getIdSender(id) {
    var json = JSON.stringify({
        type: 'socket_id',
        data: {
            socket_id: id
        }
    });
    var times = 0;
    var sender = setInterval(function () {
        ++times;
        if (times > 10) {
            clearInterval(sender);
            removeGuestClient(id);
            return;
        }
        writeToGuestClient(id, json);
    }, 3 * 1000);
    return sender;
}

function writeToClient(cid, data) {
    if (cid && clients[cid]) {
        socketWriter(clients[cid]['sock'], data);
    }
}

function writeToGuestClient(gcid, data) {
    if (gcid && guestClients[gcid]) {
        socketWriter(guestClients[gcid]['sock'], data);
    }
}

/**
 * Write data to a socket
 * @param s Socket object
 * @param d Buffer object to be written
 */

function socketWriter(s, d) {
    if (s && d) {
        s.write(d);
    }
}
