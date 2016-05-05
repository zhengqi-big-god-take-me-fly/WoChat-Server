'use strict';

module.exports = Client;

function Client(sock, idSender) {
    // sock['ofClient'] = this;
    this['sock'] = sock;
    this['idSender'] = idSender;
    // TODO
}
