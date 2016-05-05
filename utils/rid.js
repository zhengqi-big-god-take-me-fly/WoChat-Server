'use strict';

var mongoose = require('mongoose');
var md5 = require('md5');
var ObjectId = mongoose.Types.ObjectId;

module.exports = {
    get: get
};

function get(length) {
    // FIXME: @param 'length' cannot be bigger than 32
    var oid = new ObjectId();
    return md5(oid.toHexString()).slice(0, length);
}
