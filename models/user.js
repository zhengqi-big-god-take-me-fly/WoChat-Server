'use strict';

var mongoose = require('mongoose');
var V = require('../utils/validator');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var contactSchema = new Schema({
    // _id: ObjectId,
    user_id: {type: ObjectId, required: true, ref: 'User'},
    remark: {type: String, required: false, validate: V.remark},
    block_level: {type: Number, default: 0, required: true, validate: V.blockLevel}
}, {
    versionKey: false
});

var userSchema = new Schema({
    // _id: ObjectId,
    username: { type: String, required: true, unique: true, validate: V.username },
    nickname: { type: String, required: false, validate: V.nickname },
    password: { type: String, required: true, validate: V.password },
    avatar: { type: String, required: false, validate: V.avatar },
    gender: { type: Number, required: false, validate: V.gender },
    region: { type: Number, required: false, validate: V.region },
    contacts: [contactSchema]
}, {
    versionKey: false
});

module.exports = mongoose.model('User', userSchema);
