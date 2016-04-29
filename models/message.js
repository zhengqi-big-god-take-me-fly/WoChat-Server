'use strict';

var mongoose = require('mongoose');
var V = require('../utils/validator');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var messageSchema = new Schema({
    // _id: ObjectId,
    sender_id: { type: ObjectId, required: true, validate: V.userId },
    receiver_id: { type: ObjectId, required: true, validate: V.userId },
    time: { type: Number, required: true, validate: V.timestamp },
    content: {
        type: { type: Number, required: true, validate: V.messageContentType },
        plain: { type: String, required: true, validate: V.messageContentPlain }
    }
}, {
    versionKey: false
});

var Message =  module.exports = mongoose.model('Message', messageSchema);
