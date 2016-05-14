var debug = require('debug')('WoChat-Server:socket_routes:message_receipt');
var Message = require('../models/message');
var validator = require('../utils/validator');

function socketWriter(s, d) {
    debug('sending: ', d);
    if (s && s.write && d) {
        if (typeof d === 'object') {
            s.write(JSON.stringify(d));
        } else {
            s.write(d);
        }
    }
}

module.exports = function (data, connection) {

    isLogin()
    .then(checkData)
    .then(removeMessage)
    .catch(handleError)
    .catch(sendError)
    .catch(debug)

    function isLogin() {
        return connection.clientId ? Promise.resolve() : Promise.reject('not signed in');
    }

    function checkData() {
        return (data && data instanceof Array && data.every(validator.id)) ? Promise.resolve() : Promise.reject('wrong data');
    }

    function removeMessage() {
        return Message.find({
            _id: {
                $in: data
            }
        }).exec()
        .then(function (docs) {
            debug('found docs:', docs);
            var promises = [];
            docs.forEach(function (doc) {
                // debug(doc);
                // debug(doc.__proto__);
                doc.unread.pull(connection.clientId);
                if (doc.unread.length == 0) {
                    debug('deleting:', doc);
                    promises.push(doc.remove());
                } else {
                    promises.push(doc.save());
                }
            });
            return Promise.all(promises);
        });
    }

    function handleError(error) {
        debug('error: ', error);
        return Promise.reject(error);
    }

    function sendError(error) {
        socketWriter(connection, {
            type: 'info',
            data: error
        });
    }
}
