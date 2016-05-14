'use strict';

var mongoose = require('mongoose');
var V = require('../utils/validator');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var messageSchema = new Schema({
    // _id: ObjectId,
    sender: { type: ObjectId, required: true, ref: 'User', validate: V.id },
    receiver: { type: ObjectId, required: true, validate: V.id },
    to_group: { type: Boolean, required: true },
    time: { type: Number, required: true, validate: V.time },
    type: { type: Number, required: true, validate: V.messageType },
    content: { type: String, required: true, validate: V.messageContent },
    unread: [
        { type: ObjectId, required: true, ref: 'User' }
    ]
}, {
    versionKey: false
});

var Message =  module.exports = mongoose.model('Message', messageSchema);
