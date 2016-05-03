'use strict';

var mongoose = require('mongoose');
var V = require('../utils/validator');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var userSchema = new Schema({
    // _id: ObjectId,
    username: { type: String, required: true, unique: true, validate: V.username },
    nickname: { type: String, required: true, validate: V.nickname },
    password: { type: String, required: true, validate: V.password },
    avatar: { type: String, /* TODO: default */ required: true, validate: V.avatar },
    gender: { type: Number, default: 0, required: true, validate: V.gender },
    region: { type: Number, /* TODO: default */ required: true, validate: V.region },
    contacts_id: [ObjectId]
}, {
    versionKey: false
});

module.exports = mongoose.model('User', userSchema);
