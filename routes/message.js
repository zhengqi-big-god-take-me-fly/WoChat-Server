var express = require('express');
var debug = require('debug')('WoChat-Server:routes:message');
var router = express.Router();

var validator = require('../utils/validator');
var config = require('../utils/config');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');

var User = require('../models/user');
var Message = require('../models/message');
var socketEvent = require('../utils/socketEvent');

function Response(statusCode, message) {
    this.statusCode = statusCode;
    this.message = message;
}

function handleError(error) {
    debug('handleError');
    debug('Error:', error.message);
    if (error instanceof mongoose.Error || error instanceof Error) {
        var statusCode = 500,
            message = 'Server Error';
        switch(error.name) {
            case 'ValidationError': // invalid paraments
                statusCode = 400;
                message = 'Field ';
                for (var field in error.errors) {
                    message += field + ' ';
                }
                message += 'invalid';
                break;
            case 'MongoError':
                if (error.code == 11000) { // conflict
                    statusCode = 409;
                    message = '';
                    var reg = /"\w+"/g;
                    for (var match = reg.exec(error.message); match; match = reg.exec(error.message)) {
                        message += match[0] + ' ';
                    }
                    message += 'already exists';
                }
                break;
            case 'CastError':
                statusCode = 400;
                message = 'invalid value "' + error.value + '" for ' + error.kind;
                break;
        }
        return Promise.reject(new Response(statusCode, message));
    } else {
        return Promise.reject(error);
    }
}

socketEvent.server.on('unsend', function (id, event, message) {
    debug(message + ' to id ' + id + ' unsend');
    Message.create(message);
});

// Sign Up
router.post('/', function(req, res, next) {

    var msg = req.body,
        token = req.get('Authorization');

    verifyToken()
    .then(checkContacts)
    .then(sendMessage)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function verifyToken() {
        debug('verifyToken');
        return new Promise(function (resolve, reject) {
            jwt.verify(token, config.secret, function (err, decoded) {
                (!err && decoded.user_id == msg.sender_id) ? resolve() : reject(new Response(401, 'Invalid Token'));
            });
        });
    }

    function checkContacts() {
        debug('checkContacts');
        return User.findOne({
            _id: msg.receiver_id
        }).select('contacts')
        .then(function (receiver) {
            if (receiver) {
                return receiver.contacts.some(isContact) ? Promise.resolve() : Promise.reject(401, 'Not Contacts');
            } else {
                return Promise.reject(new Response(400, 'Receiver Not Found'))
            }
        });

        function isContact(contact) {
            return contact.user_id == msg.sender_id;
        }
    }

    function sendMessage() {
        debug('sendMessage');
        socketEvent.Client.emit(msg.receiver_id, 'message', msg);
    }

    function sendResult(doc) {
        debug('sendResult');
        res.json(doc);
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }

});


module.exports = router;
