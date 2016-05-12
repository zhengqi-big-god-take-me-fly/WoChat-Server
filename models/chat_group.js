'use strict';

var mongoose = require('mongoose');
var V = require('../utils/validator');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var ChatGroupSchema = new Schema({
    // _id: ObjectId,
    groupname: { type: String, required: true, validate: V.username },
    members: [{
        member: { type: ObjectId, required: true, ref: 'User', validate: V.id },
        group_nick: { type: String, required: false, validate: V.remark }
    }]
}, {
    versionKey: false
});

module.exports = mongoose.model('ChatGroup', ChatGroupSchema);
