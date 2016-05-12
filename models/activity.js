'use strict';

var mongoose = require('mongoose');
var V = require('../utils/validator');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var activitySchema = new Schema({
    // _id: ObjectId,
    owner: { type: ObjectId, required: true, validate: V.id },
    type: { type: Number, required: true, validate: V.messageType },
    text: { type: String, validate: V.messageContent },
    images: [
        { type: String, required: true }
    ],
    time: { type: Number, required: true, validate: V.time },
    likes: [{
        user: { type: ObjectId, required: true, validate: V.id },
        time: { type: Number, required: true, validate: V.time }
    }],
    comments: [{
        user: { type: ObjectId, required: true, validate: V.id },
        time: { type: Number, required: true, validate: V.time },
        text: { type: String, required: true, validate: V.messageContent },
        reply_to: { type: ObjectId, required: false, validate: V.id }
    }]
}, {
    versionKey: false
});

module.exports = mongoose.model('Activity', activitySchema);
