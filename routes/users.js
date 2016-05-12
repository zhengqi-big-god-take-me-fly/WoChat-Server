var express = require('express');
var debug = require('debug')('WoChat-Server:routes:users');
var router = express.Router();

var validator = require('../utils/validator');
var mongoose = require('mongoose');
var config = require('../utils/config');
var jwt = require('jsonwebtoken');
var socketEvent = require('../utils/socketEvent');

var User = require('../models/user');
var Message = require('../models/message');
var ChatGroup = require('../models/chat_group');

function Response(statusCode, message) {
    this.statusCode = statusCode;
    this.message = message;
}

function verifyToken(token, username) {
    debug('verifyToken:', token);
    return new Promise(function (resolve, reject) {
        jwt.verify(token, config.secret, function (err, decoded) {
            (!err && (username == undefined || decoded.username == username)) ? resolve(decoded) : reject(new Response(401, 'Invalid Token'));
        });
    });
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

// 注册
router.post('/', function(req, res, next) {

    var user = new User({
        username: req.body.username,
        nickname: req.body.nickname || req.body.username,
        password: req.body.password
    });

    createUser()
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function createUser() {
        debug('createUser: ', user);
        return user.save();
    }

    function sendResult() {
        debug('sendResult');
        res.status(201).end('success');
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }
});

// 获取用户信息
router.get(/^\/([^\/]+)$/, function(req, res, next) {

    var username = req.params[0];

    findUser()
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findUser() {
        debug('findUser:', username);
        return User.findOne({
            username: username
        })
        .select('_id username nickname avatar gender region')
        .then(function (doc) {
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(404, 'User not found'));
        });
    }

    function sendResult(doc) {
        debug('sendResult:', doc);
        res.json(doc);
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }
});

// 修改用户信息
router.put(/^\/([^\/]+)$/, function(req, res, next) {

    var username    = req.params[0],
        token       = req.get('Authorization'),
        oldPassword = req.body.old_password;
    var update = {};
    if (req.body.hasOwnProperty('nickname')) update.nickname = req.body.nickname;
    if (req.body.hasOwnProperty('password')) update.password = req.body.password;
    if (req.body.hasOwnProperty('avatar')) update.avatar = req.body.avatar;
    if (req.body.hasOwnProperty('gender')) update.gender = req.body.gender;
    if (req.body.hasOwnProperty('region')) update.region = req.body.region;

    verifyToken(token, username)
    .then(findUser)
    .then(verifyOldPassword)
    .then(performUpdate)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findUser() {
        debug('findUser:', username);
        return User.findOne({
            username: username
        })
        .select('_id password')
        .then(function (doc) {
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(404, 'User not found'));
        });
    }

    function verifyOldPassword(doc) {
        debug('verifyOldPassword:', oldPassword);
        return doc.password == oldPassword ? Promise.resolve(doc._id) : Promise.reject(new Response(401, 'Wrong old password'));
    }

    function performUpdate() {
        debug('performUpdate:', update);
        return User.findOneAndUpdate({ username: username }, { $set: update }, { runValidators: true }).exec();
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

// 获取联系人信息
router.get(/^\/([^\/]+)\/contacts$/, function(req, res, next) {

    var username = req.params[0],
        token = req.get('Authorization');

    verifyToken(token, username)
    .then(findUser)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findUser() {
        debug('findUser:', username);
        return User.findOne({
            username: username
        }).populate({
            path: 'contacts.contact',
            select: '_id username nickname avatar'
        })
        .select('contacts')
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

// 修改联系人信息
router.put(/^\/([^\/]+)\/contacts\/([^\/]+)$/, function(req, res, next) {

    var username = req.params[0],
        contactName = req.params[1],
        token = req.get('Authorization');

    var update = {};
    if (req.body.hasOwnProperty('remark')) update['contacts.$.remark'] = req.body.remark;
    if (req.body.hasOwnProperty('block_level')) update['contacts.$.block_level'] = req.body.block_level;

    verifyToken(token, username)
    .then(findContact)
    .then(changeContact)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findContact() {
        debug('findContact:', contactName);
        return User.findOne({
            username: contactName
        }).select('_id')
        .then(function (doc) {
            return doc ? Promise.resolve(doc._id) : Promise.reject(new Response(404, 'Contact not found'));
        });
    }

    function changeContact(contactId) {
        debug('changeContact:', username, contactId);
        return User.findOneAndUpdate({
            username: username,
            'contacts.contact': contactId
        }, {
            $set: update
        }, { runValidators: true }).exec()
        .then(function (doc) {
            return doc ? Promise.resolve() : Promise.reject(new Response(404, 'User not found'));
        });
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

// 删除联系人信息
router.delete(/^\/([^\/]+)\/contacts\/([^\/]+)$/, function(req, res, next) {

    var username = req.params[0],
        contactName = req.params[1],
        token = req.get('Authorization');

    verifyToken(token, username)
    .then(deleteFromContact)
    .then(deleteFromUser)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function deleteFromContact(decoded) {
        debug('deleteFromContact:', username);
        return User.findOneAndUpdate({
            username: contactName,
            'contacts.contact': decoded.user_id
        }, {
            $pull: {
                contacts: {
                    contact: decoded.user_id
                }
            }
        }).select('_id')
        .then(function (doc) {
            return doc ? Promise.resolve(doc._id) : Promise.reject(new Response(404, 'Contact not found'));
        });
    }

    function deleteFromUser(contactId) {
        debug('deleteFromUser:', username, contactId);
        return User.findOneAndUpdate({
            username: username,
            'contacts.contact': contactId
        }, {
            $pull: {
                contacts: {
                    contact: contactId
                }
            }
        }).select('_id')
        .then(function (doc) {
            return doc ? Promise.resolve() : Promise.reject(new Response(404, 'Contact not found'));
        });
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

// 获取群聊信息
router.get(/^\/([^\/]+)\/chat_groups$/, function(req, res, next) {

    var username = req.params[0],
        token = req.get('Authorization');

    verifyToken(token, username)
    .then(findUser)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findUser() {
        debug('findUser:', username);
        return User.findOne({
            username: username
        }).populate({
            path: 'chat_groups',
            populate: {
                path: 'members',
                select: '_id username nickname avatar'
            }
        }).select('chat_groups')
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

// 修改群聊信息
router.put(/^\/([^\/]+)\/chat_groups\/([^\/]+)$/, function(req, res, next) {

    var username = req.params[0],
        groupId = req.params[1],
        token = req.get('Authorization');

    var update = {};
    if (req.body.hasOwnProperty('block_level')) update['chat_groups.$.block_level'] = req.body.hasOwnProperty.block_level;

    verifyToken(token, username)
    .then(changeGroup)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function changeGroup() {
        debug('changeGroup:', groupId);
        return User.findOneAndUpdate({
            username: username,
            'chat_groups.chat_group': groupId
        }, {
            $set: update
        }).populate({
            path: 'chat_groups',
            populate: {
                path: 'members',
                select: '_id username nickname avatar'
            }
        }, { runValidators: true }).exec()
        .then(function (doc) {
            return doc ? Promise.resolve() : Promise.reject(new Response(404, 'User or chat group not found'));
        });
    }

    function sendResult(doc) {
        debug('sendResult');
        res.end('Success');
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }
});

// 退出群聊
router.delete(/^\/([^\/]+)\/chat_groups\/([^\/]+)$/, function(req, res, next) {

    var username = req.params[0],
        groupId = req.params[1],
        token = req.get('Authorization');

    verifyToken(token, username)
    .then(deleteFromChatGroup)
    .then(deleteFromUser)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function deleteFromChatGroup(decoded) {
        debug('deleteFromUser:', username);
        return ChatGroup.findOneAndUpdate({
            _id: groupId,
            'members.member': decoded.user_id
        }, {
            $pull: {
                members: {
                    member: decoded.user_id
                }
            }
        }).select('_id')
        .then(function (doc) {
            return doc ? Promise.resolve() : Promise.reject(new Response(404, 'User or chat group not found'));
        });
    }

    function deleteFromUser() {
        debug('deleteFromUser:', groupId);
        return User.findOneAndUpdate({
            username: username,
            'chat_groups.chat_group': groupId
        }, {
            $pull: {
                chat_groups: {
                    chat_group: groupId
                }
            }
        }).exec()
        .then(function (doc) {
            return doc ? Promise.resolve() : Promise.reject(new Response(404, 'User or chat group not found'));
        });
    }

    function sendResult(doc) {
        debug('sendResult');
        res.end('Success');
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }
});

// 发送邀请
router.post(/^\/([^\/]+)\/invitation$/, function(req, res, next) {

    var contactName = req.params[0],
        token = req.get('Authorization'),
        message = req.body.message;

    var senderId, receiverId, inviteToken;

    verifyToken(token)
    .then(verifyUsers)
    .then(generateToken)
    .then(sendMessage)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function verifyUsers(decoded) {
        debug('verifyUsers:', decoded.username, contactName);
        senderId = decoded.user_id;
        return new Promise(function (resolve, reject) {
            decoded.username != contactName ? resolve() : reject(new Response(401, 'Can not invite yourself'));
        })
        .then(function () {
            return User.findOne({
                username: contactName
            }).select('_id contacts');
        })
        .then(function (doc) {
            if (doc) {
                receiverId = doc._id;
                return Promise.resolve(doc);
            } else {
                return Promise.reject(new Response(404, 'Contact not found'));
            }
        })
        .then(function (doc) {
            return doc.contacts && doc.contacts.every(function (item) {
                return item.contact != senderId;
            }) ? Promise.resolve() : Promise.reject(new Response(409, 'This user is already your contact'));
        });
    }

    function generateToken() {
        debug('generateToken');
        var payload = {
            sender: senderId,
            receiver: receiverId,
            message: message
        };
        inviteToken = jwt.sign(payload, config.secret);
        return Promise.resolve();
    }

    function sendMessage() {
        var message = new Message({
            sender: senderId,
            receiver: receiverId,
            to_group: false,
            time: Date.now(),
            type: 2,
            content: inviteToken,
            unread: [receiverId]
        });
        debug('sendMessage:', message);
        return message.save().then(function (message) {
            delete message.unread;
            socketEvent(receiverId, 'message', message);
        });
    }

    function sendResult() {
        debug('sendResult');
        res.status(201).json({
            inviteToken: inviteToken
        });
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }
});

// 接受邀请
router.put(/^\/([^\/]+)\/invitation$/, function(req, res, next) {

    var username = req.params[0],
        token = req.get('Authorization'),
        invitation = req.body.invitation;

    var senderId, receiverId;

    verifyToken(token, username)
    .then(verifyInvitation)
    .then(addToSender)
    .then(addToReceiver)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function verifyInvitation(authToken) {
        debug('verifyInvitation:', invitation);
        return new Promise(function (resolve, reject) {
            jwt.verify(invitation, config.secret, function (err, decoded) {
                if (!err && authToken.user_id == decoded.receiver) {
                    senderId = decoded.sender;
                    receiverId = decoded.receiver;
                    resolve();
                } else {
                    reject(new Response(400, 'Invalid invitation'));
                }
            });
        });
    }

    function addToSender() {
        debug('addToSender:', senderId);
        return User.findOneAndUpdate({
            _id: senderId
        }, {
            $push: {
                contacts: {
                    contact: receiverId
                }
            }
        }).exec()
        .then(function (doc) {
            return doc ? Promise.resolve() : Promise.reject(new Response(404, 'Sender not found'));
        });
    }

    function addToReceiver() {
        debug('addToReceiver:', receiverId);
        return User.findOneAndUpdate({
            _id: receiverId
        }, {
            $push: {
                contacts: {
                    contact: senderId
                }
            }
        }).exec()
        .then(function (doc) {
            return doc ? Promise.resolve() : Promise.reject(new Response(404, 'Receiver not found'));
        });
    }

    function sendResult() {
        debug('sendResult');
        res.status(200).end('Success');
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }
});

// 发送消息给用户
router.post(/^\/([^\/]+)\/message$/, function(req, res, next) {

    var contactName = req.params[0],
        token = req.get('Authorization'),
        type = req.body.type,
        content = req.body.content;

    var senderId, receiverId;

    verifyToken(token)
    .then(findContact)
    .then(sendMessage)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findContact(decoded) {
        debug('findContact:', contactName);
        senderId = decoded.user_id;
        return User.findOne({
            username: contactName
        }).select('_id contacts')
        .then(function (doc) {
            if (doc) {
                receiverId = doc._id;
                return doc.contacts.some(function (item) {
                    return item.contact == senderId;
                }) ? Promise.resolve() : Promise.reject(401, 'Not contact');
            } else {
                return Promise.reject(new Response(404, 'User not found'));
            }
        });
    }

    function sendMessage() {
        var message = new Message({
            sender: senderId,
            receiver: receiverId,
            to_group: false,
            type: type,
            time: Date.now(),
            content: content,
            unread: [receiverId]
        });
        debug('sendMessage:', message);
        return message.save()
        .then(function (message) {
            message.unread = undefined;
            socketEvent.emit(receiverId, 'message', [message]);
            return Promise.resolve(message);
        });
    }

    function sendResult(message) {
        debug('sendResult:', message);
        res.status(201).json(message);
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }
});

module.exports = router;
