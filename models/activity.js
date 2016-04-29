'use strict';

var mongoose = require('mongoose');
var V = require('../utils/validator');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var activitySchema = new Schema({
    // _id: ObjectId,
    content: {
        type: { type: Number, required: true, validate: V.activityContentType },
        text: { type: String, validate: V.activityContentText },
        images: Array[String]
    },
    time: { type: Number, required: true, validate: V.timestamp },
    likes: Array[{
        user_id: { type: ObjectId, required: true, validate: V.userId },
        time: { type: Number, required: true, validate: V.timestamp }
    }],
    comments: Array[{
        user_id: { type: ObjectId, required: true, validate: V.userId },
        time: { type: Number, required: true, validate: V.timestamp },
        text: { type: String, validate: V.activityCommentText },
        reply_to_id: { type: ObjectId, required: true, validate: V.userId }
    }]
}, {
    versionKey: false
});

module.exports = mongoose.model('Activity', activitySchema);
