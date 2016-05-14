var express = require('express');
var debug = require('debug')('WoChat-Server:routes:chat_group');
var router = express.Router();

var validator = require('../utils/validator');
var mongoose = require('mongoose');
var config = require('../utils/config');
var jwt = require('jsonwebtoken');
var socketEvent = require('../utils/socketEvent');

var User = require('../models/user');
var Message = require('../models/message');
var ChatGroup = require('../models/chatGroup');

function Response(statusCode, message) {
    this.statusCode = statusCode;
    this.message = message;
}

function verifyToken(token, username) {
    debug('verifyToken:', token);
    return new Promise(function (resolve, reject) {
        jwt.verify(token, config.secret, function (err, decoded) {
            (!err && decoded.user_id && decoded.username && (username == undefined || decoded.username == username)) ? resolve(decoded) : reject(new Response(401, 'Invalid Token'));
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

// 新建群组
router.post('/', function(req, res, next) {

    var token = req.get('Authorization'),
        groupname = req.body.groupname;

    var userId, chatGroup;

    verifyToken(token)
    .then(createGroup)
    .then(addGroupToUser)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function createGroup(decoded) {
        userId = decoded.user_id;
        chatGroup = new ChatGroup({
            groupname: groupname
        });
        chatGroup.members.push({
            member: userId
        });
        debug('createGroup:', chatGroup);
        return chatGroup.save();
    }

    function addGroupToUser(chatGroup) {
        debug('addGroupToUser:', chatGroup._id);
        return User.findOneAndUpdate({
            _id: userId
        }, {
            $push: {
                chat_groups: {
                    chat_group: chatGroup._id
                }
            }
        }).exec();
    }

    function sendResult() {
        debug('sendResult:', chatGroup);
        res.status(201).json(chatGroup);
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }
});

// 获取群组信息
router.get(/^\/([^\/]+)$/, function(req, res, next) {

    var groupId = req.params[0],
        token = req.get('Authorization');

    var userId;

    verifyToken(token)
    .then(findGroup)
    .then(verifyMember)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findGroup(decoded) {
        userId = decoded.user_id;
        debug('findGroup:', groupId);
        return ChatGroup.findOne({
            _id: groupId
        }).select('groupname members')
        .then(function (doc) {
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(404, 'Chat group not found'));
        });
    }

    function verifyMember(doc) {
        debug('verifyMember', doc.members);
        return doc.members.some(function (item) {
            return item.member == userId;
        }) ? Promise.resolve(doc) : Promise.reject(new Response(401, 'Not member'));
    }

    function sendResult(chatGroup) {
        chatGroup.members = undefined;
        debug('sendResult:', chatGroup);
        res.status(200).json(chatGroup);
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }
});

// 修改群组信息
router.put(/^\/([^\/]+)$/, function(req, res, next) {

    var groupId = req.params[0],
        token = req.get('Authorization'),
        groupname = req.body.groupname;

    var userId;

    verifyToken(token)
    .then(findGroup)
    .then(verifyMember)
    .then(changeGroup)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findGroup(decoded) {
        userId = decoded.user_id;
        debug('findGroup:', groupId);
        return ChatGroup.findOne({
            _id: groupId,
        }).exec()
        .then(function (doc) {
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(404, 'Chat group not found'));
        });
    }

    function verifyMember(doc) {
        debug('verifyMember:', doc.members);
        return doc.members.some(function (item) {
            return item.member == userId;
        }) ? Promise.resolve(doc) : Promise.reject(new Response(401, 'Not member'));
    }

    function changeGroup(doc) {
        debug('changeGroup:', doc);
        doc.groupname = groupname;
        return doc.save();
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

// 获取群组成员
router.get(/^\/([^\/]+)\/members$/, function(req, res, next) {

    var groupId = req.params[0],
        token = req.get('Authorization');

    var userId;

    verifyToken(token)
    .then(findGroup)
    .then(verifyMember)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findGroup(decoded) {
        userId = decoded.user_id;
        debug('findGroup:', groupId);
        return ChatGroup.findOne({
            _id: groupId
        }).populate({
            path: 'members.member',
            select: '_id username nickname avatar'
        })
        .select('members')
        .then(function (doc) {
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(404, 'Chat group not found'));
        });
    }

    function verifyMember(doc) {
        debug('verifyMember', doc.members);
        return doc.members.some(function (item) {
            return item.member._id == userId;
        }) ? Promise.resolve(doc) : Promise.reject(new Response(401, 'Not member'));
    }

    function sendResult(chatGroup) {
        debug('sendResult:', chatGroup);
        res.status(200).json(chatGroup);
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }
});

// 添加群组成员
router.post(/^\/([^\/]+)\/members$/, function(req, res, next) {

    var groupId = req.params[0],
        token = req.get('Authorization');
        members = req.body.members;

    var userId, username, group;

    verifyToken(token)
    .then(findGroup)
    .then(verifyMember)
    .then(findUser)
    .then(verifyContact)
    .then(addToGroup)
    .then(addToUser)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findGroup(decoded) {
        userId = decoded.user_id;
        username = decoded.username;
        debug('findGroup:', groupId);
        return ChatGroup.findOne({
            _id: groupId
        }).exec()
        .then(function (doc) {
            group = doc;
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(404, 'Chat group not found'));
        });
    }

    function verifyMember(doc) {
        debug('verifyMember', doc.members);
        return doc.members.some(function (item) {
            return item.member == userId;
        }) ? Promise.resolve(doc) : Promise.reject(new Response(401, 'Not member'));
    }

    function findUser() {
        debug('findUser:', username);
        return User.findOne({
            _id: userId
        }).select('contacts')
        .then(function (doc) {
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(404, 'User not found'));
        });
    }

    function verifyContact(doc) {
        debug('verifyContact:', doc);
        return members instanceof Array && members.every(function (addId) {
            return doc.contacts.find(function (item) {
                return item.contact == addId;
            }) != undefined;
        }) ? Promise.resolve() : Promise.reject(new Response(400, 'Not contact'));
    }

    function addToGroup() {
        debug('addToGroup:', members);
        members.forEach(function (addId) {
            group.members.push({
                member: addId
            });
        });
        return group.save();
    }

    function addToUser() {
        debug('addToUser:', group._id);
        return User.update({
            _id: {
                $in: members
            }
        }, {
            $push: {
                chat_groups: {
                    chat_group: group._id
                }
            }
        }).exec();
    }

    function sendResult() {
        debug('sendResult');
        res.status(201).end('Success');
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }
});

// 修改群组成员信息
router.put(/^\/([^\/]+)\/members\/([^\/]+)$/, function(req, res, next) {

    var groupId = req.params[0],
        username = req.params[1],
        token = req.get('Authorization');

    var update = {};
    if (req.body.hasOwnProperty('group_nick')) update['members.$.group_nick'] = req.body.group_nick;

    var userId;

    verifyToken(token, username)
    .then(findGroup)
    .then(verifyMember)
    .then(updateGroup)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findGroup(decoded) {
        userId = decoded.user_id;
        debug('findGroup:', groupId);
        return ChatGroup.findOne({
            _id: groupId
        }).select('members')
        .then(function (doc) {
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(404, 'Chat group not found'));
        });
    }

    function verifyMember(doc) {
        debug('verifyMember', doc.members);
        return doc.members.some(function (item) {
            return item.member == userId;
        }) ? Promise.resolve() : Promise.reject(new Response(401, 'Not member'));
    }

    function updateGroup() {
        return ChatGroup.findOneAndUpdate({
            _id: groupId,
            'members.member': userId
        }, {
            $set: update
        }, { runValidators: true }).exec();
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

// 退出群聊
router.delete(/^\/([^\/]+)\/members\/([^\/]+)$/, function(req, res, next) {

    var username = req.params[1],
        groupId = req.params[0],
        token = req.get('Authorization');

    var userId;

    verifyToken(token, username)
    .then(findGroup)
    .then(verifyMember)
    .then(deleteFromChatGroup)
    .then(deleteFromUser)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findGroup(decoded) {
        userId = decoded.user_id;
        debug('findGroup:', groupId);
        return ChatGroup.findOne({
            _id: groupId
        }).exec()
        .then(function (doc) {
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(404, 'Chat group not found'));
        });
    }

    function verifyMember(doc) {
        debug('verifyMember', doc.members);
        return doc.members.some(function (item) {
            return item.member == userId;
        }) ? Promise.resolve(doc) : Promise.reject(new Response(401, 'Not member'));
    }

    function deleteFromChatGroup(doc) {
        debug('deleteFromChatGroup:', username);
        doc.members.pull({
            member: userId
        });
        if (doc.members.length == 0) {
            debug('deleting:', doc);
            return doc.remove();
        } else {
            return doc.save();
        }
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

    function sendResult() {
        debug('sendResult');
        res.status(200).end('Success');
    }

    function sendError(error) {
        debug('sendError: ', error);
        res.status(error.statusCode).end(error.message);
    }
});

// 发送消息给群组
router.post(/^\/([^\/]+)\/messages$/, function(req, res, next) {

    var groupId = req.params[0],
        username = req.params[1],
        token = req.get('Authorization'),
        type = req.body.type,
        content = req.body.content;

    var userId, members = [];

    verifyToken(token, username)
    .then(findGroup)
    .then(verifyMember)
    .then(generateMessage)
    .then(sendMessage)
    .then(sendResult)
    .catch(handleError)
    .catch(sendError)
    .catch(debug);

    function findGroup(decoded) {
        userId = decoded.user_id;
        debug('findGroup:', groupId);
        return ChatGroup.findOne({
            _id: groupId
        }).select('members')
        .then(function (doc) {
            return doc ? Promise.resolve(doc) : Promise.reject(new Response(404, 'Chat group not found'));
        });
    }

    function verifyMember(doc) {
        debug('verifyMember', doc.members);
        var flag = false;
        doc.members.forEach(function (item) {
            if (item.member == userId) {
                flag = true;
            } else {
                members.push(item.member);
            }
        });
        return flag ? Promise.resolve(doc) : Promise.reject(new Response(401, 'Not member'));
    }

    function generateMessage(doc) {
        debug('generateMessage:', type, content, members);
        var message = new Message({
            sender: userId,
            receiver: doc._id,
            to_group: true,
            time: Date.now(),
            type: type,
            content: content,
            unread: members
        });
        return message.save();
    }

    function sendMessage(message) {
        message.unread = undefined;
        debug('sendMessage:', message);
        members.forEach(function (member) {
            socketEvent.emit(member, 'message', [message]);
        });
        return Promise.resolve(message);
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
