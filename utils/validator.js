'use strict';

var ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
    activityCommentText: activityCommentText,
    activityContentText: activityContentText,
    activityContentType: activityContentType,
    avatar: avatar,
    gender: gender,
    messageContentPlain: messageContentPlain,
    messageContentType: messageContentType,
    nickname: nickname,
    password: password,
    region: region,
    timestamp: timestamp,
    userId: userId,
    username: username
};

function activityCommentText(act) {
    return true;
}

function activityContentText(act) {
    return true;
}

function activityContentType(act) {
    return true;
}

function avatar(a) {
    return true;
}

function gender(g) {
    return true;
}

function messageContentPlain(mcp) {
    return true;
}

function messageContentType(mct) {
    return true;
}

function nickname(n) {
    return true;
}

function password(p) {
    return p && typeof p === 'string' && /^\w+$/.test(p);
}

function region(r) {
    return true;
}

function timestamp(t) {
    return true;
}

function userId(ui) {
    return ui && (ui instanceof ObjectId || (typeof ui === 'string' && /^[0-9a-f]{24}$/i.test(ui)));
}

function username(u) {
    return u && typeof u === 'string' && /^\w+$/.test(u);
}
