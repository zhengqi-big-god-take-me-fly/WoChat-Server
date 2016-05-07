var express = require('express');
var debug = require('debug')('WoChat-Server:routes:users');
var router = express.Router();

var validator = require('../utils/validator');
var mongoose = require('mongoose');
var config = require('../utils/config');
var jwt = require('jsonwebtoken');

var User = require('../models/user');

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
            case 'CastError': // invalid format
                statusCode = 400;
                message = 'invalid value "' + error.value + '" for ' + error.kind;
                break;
        }
        return Promise.reject(new Response(statusCode, message));
    } else {
        return Promise.reject(error);
    }
}

// Sign Up
router.post('/', function(req, res, next) {

    var user = new User({
        username: req.body.username,
        password: req.body.password
    });

    createUser()
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function createUser() {
        debug('createUser');
        return user.save();
    }

    function sendResult() {
        debug('sendResult');
        res.end('success');
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }

});

// Get User Info
router.get(/^\/([^\/]+)$/, function(req, res, next) {

    var userId       = req.params[0],
        withContacts = req.query.with_contacts,
        token        = req.get('Authorization');

    verifyToken()
    .then(findUser)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function verifyToken() {
        debug('verifyToken');
        return new Promise(function (resolve, reject) {
            jwt.verify(token, config.secret, function (err, decoded) {
                (!err && decoded.user_id == userId) ? resolve() : reject(new Response(401, 'Invalid Token'));
            });
        });
    }

    function findUser() {
        debug('findUser');
        return User.findOne({
            _id: userId
        }).select('-password' + (withContacts ? '' : ' -contacts'))
        .then(function (doc) {
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(404, 'User not found'));
        });
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

// Get User Contacts
router.get(/^\/([^\/]+)\/contacts$/, function(req, res, next) {

    var userId = req.params[0],
        token = req.get('Authorization');

    verifyToken()
    .then(findContacts)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function verifyToken() {
        debug('verifyToken');
        return new Promise(function (resolve, reject) {
            jwt.verify(token, config.secret, function (err, decoded) {
                (!err && decoded.user_id == userId) ? resolve() : reject(new Response(401, 'Invalid Token'));
            });
        });
    }

    function findContacts() {
        debug('findContacts');
        return User.findOne({
            _id: userId
        }).select('contacts')
        .then(function (doc) {
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(404, 'User not found'));
        });
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

// Add Contact
router.post(/^\/([^\/]+)\/contacts$/, function(req, res, next) {

    var userId = req.params[0],
        token = req.get('Authorization'),
        contactId = req.body.user_id;

    verifyToken()
    .then(findUser)
    .then(addContact)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function verifyToken() {
        debug('verifyToken');
        return new Promise(function (resolve, reject) {
            jwt.verify(token, config.secret, function (err, decoded) {
                (!err && decoded.user_id == userId) ? resolve() : reject(new Response(401, 'Invalid Token'));
            });
        });
    }

    function findUser() {
        debug('findUser');
        return User.findOne({
            _id: contactId
        }).then(function (doc) {
            return doc ? Promise.resolve() : Promise.reject(new Response(404, 'User not found'));
        });
    }

    function addContact() {
        debug('addContact');
        return User.findOneAndUpdate({
            _id: userId
        }, {
            $push: {
                user_id: contactId
            }
        }).exec()
    }

    function sendResult() {
        debug('sendResult');
        res.end('Success');
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }

});

module.exports = router;
