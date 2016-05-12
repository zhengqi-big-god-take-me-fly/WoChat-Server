'use strict';

var mongoose = require('mongoose');
var V = require('../utils/validator');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var contactSchema = new Schema({
    contact: { type: ObjectId, required: true, ref: 'User', validate: V.id },
    remark: { type: String, required: false, validate: V.remark },
    block_level: { type: Number, default: 0, required: true, validate: V.blockLevel }
}, {
    _id: false,
    versionKey: false
});

var chatGroupSchema = new Schema({
    chat_group: { type: ObjectId, required: true, ref: 'ChatGroup', validate: V.id },
    block_level: { type: Number, default: 0, required: true, validate: V.blockLevel }
}, {
    _id: false,
    versionKey: false
});

var activitySchema = new Schema({
    activity: { type: ObjectId, required: true, ref: 'Activity', validate: V.id }
}, {
    _id: false,
    versionKey: false
});

var userSchema = new Schema({
    // _id: ObjectId,
    username: { type: String, required: true, unique: true, index: true, validate: V.username },
    nickname: { type: String, required: true, validate: V.nickname },
    password: { type: String, required: true, validate: V.password },
    avatar: { type: String, default: 'http://avatar.com/avatar.png', required: true, validate: V.avatar },
    gender: { type: Number, default: 0, required: true, validate: V.gender },
    region: { type: Number, default: 0, required: true, validate: V.region },
    contacts: [contactSchema],
    chat_groups: [chatGroupSchema],
    activities: [activitySchema]
}, {
    versionKey: false
});

module.exports = mongoose.model('User', userSchema);
