var debug = require('debug')('WoChat-Server:socket_routes:auth');
var Message = require('../models/message');
var User = require('../models/user');
var socketEvent = require('../utils/socketEvent');
var jwt = require('jsonwebtoken');
var config = require('../utils/config');

var authResult = {
    success: {
        type: 'authrst',
        data: {
            code: 0,
            message: 'success'
        }
    },
    wrong_parameter: {
        type: 'authrst',
        data: {
            code: 1,
            message: 'need token or username and password'
        }
    },
    wrong_token: {
        type: 'authrst',
        data: {
            code: 1,
            message: 'invalid token'
        }
    },
    wrong_password: {
        type: 'authrst',
        data: {
            code: 1,
            message: 'wrong username or password'
        }
    },
    already_signed: {
        type: 'authrst',
        data: {
            code: 2,
            message: 'already signed in'
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

function onAuth(data, connection) {

    var token = data.token,
        username = data.username,
        password = data.password;

    isUnSignedIn()
    .then(verify)
    .then(signIn)
    .then(checkUnsendMsg)
    .catch(sendError);

    function isUnSignedIn() {
        debug('isUnSignedIn');
        return connection.hasOwnProperty('clientId') ? Promise.reject(authResult.already_signed) : Promise.resolve();
    }

    function verify() {
        debug('verify');
        debug('token: ' + token);
        debug('username: ' + username);
        debug('password: ' + password);
        if (token) {
            return new Promise(function (resolve, reject) {
                jwt.verify(token, config.secret, function (err, decoded) {
                    err ? reject(authResult.wrong_token) : resolve(decoded.user_id);
                });
            });
        } else if (username && password) {
            return User.findOne({
                username: username
            }).select('password')
            .then(function (user) {
                return (user && user.password == password) ? Promise.resolve(user._id) : Promise.reject(authResult.wrong_password);
            });
        } else {
            return Promise.reject(authResult.wrong_parameter);
        }
    }

    function signIn(clientId) {
        debug('signIn(' + clientId + ')');
        connection.setClient(clientId);
        socketWriter(connection, authResult.success);
        return Promise.resolve(clientId);
    }

    function checkUnsendMsg(clientId) {
        debug('checkUnsendMsg(' + clientId + ')');
        return Message.find({
            $or: [{
                receiver: clientId
            },{
                unread: clientId
            }]
        }).select('-unread')
        .then(function (msgs) {
            debug('unsend: ' + msgs);
            if (msgs && msgs.length != 0) {
                socketWriter(connection, {
                    type: 'msg',
                    data: msgs
                });
            }
            return Promise.resolve();
        });
    }

    function sendError(error) {
        debug('sendError(' + error + ')');
        socketWriter(connection, error);
    }
}

module.exports = onAuth;
