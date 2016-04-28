'use strict';

/**
 default
 get
 index
 required
 SchemaType
 select
 set
 sparse
 text
 unique
 validate

 ref: http://mongoosejs.com/docs/api.html#schematype-js
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var userSchema = new Schema({
    // _id: ObjectId,
    username: { type: String, unique: true },
    nickname: String,
    avatar: String,
    gender: Number,
    region: Number,
    contacts_id: [ObjectId]
}, {
    versionKey: false
});

module.exports = mongoose.model('User', userSchema);
