'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var messageSchema = new Schema({
    // _id: ObjectId,
    sender_id: ObjectId,
    receiver_id: ObjectId,
    time: Number,
    content: {
        type: Number,
        plain: String
    }
});

var Message =  module.exports = mongoose.model('Message', messageSchema);
