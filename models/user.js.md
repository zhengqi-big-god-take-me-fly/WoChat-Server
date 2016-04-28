'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var userSchema = new Schema({
    // _id: ObjectId,
    username: String,
    nickname: String,
    avatar: String,
    gender: Number,
    region: Number,
    // Test
    type: String,
    contacts_id: [ObjectId]
}, {
    versionKey: false
});

module.exports = mongoose.model('User', userSchema);
