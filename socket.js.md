var net = require('net');
var debug = require('debug')('WoChat-Server:socket');

var server, socketPort;

module.exports = {
    createServer: createServer
};

function createServer(port) {
    socketPort = port;
    server = net.createServer();
    server.listen(socketPort);
    server.on('listening', onListening);
    server.on('error', onError);
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