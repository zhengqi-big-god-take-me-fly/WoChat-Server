'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var activitySchema = new Schema({
    // _id: ObjectId,
    content: {
        type: { type: Number },
        text: String,
        images: Array[String]
    },
    time: Number,
    likes: Array[{
        user_id: ObjectId,
        time: Number
    }],
    comments: Array[{
        user_id: ObjectId,
        time: Number,
        text: String,
        reply_to_id: ObjectId
    }]
}, {
    versionKey: false
});

module.exports = mongoose.model('Activity', activitySchema);
