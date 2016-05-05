var express = require('express');
var debug = require('debug')('WoChat-Server:routes:auth');
var router = express.Router();

var validator = require('../utils/validator');
var config = require('../config');
var mongoose = require('mongoose');
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

// Sign Up
router.post('/login', function(req, res, next) {

    var username = req.body.username,
        password = req.body.password;

    findUser()
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findUser() {
        debug('createUser');
        return User.findOne({
            username: username,
            password: password
        }).exec()
        .then(function (doc) {
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(401, 'Invalid username or wrong password'));
        });
    }

    function sendResult(doc) {
        debug('sendResult');
        var payload = {
            user_id: doc._id
        };
        res.json({
            jwt: jwt.sign(payload, config.secret)
        });
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }

});


module.exports = router;
