'use strict';

var ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
    avatar: avatar,
    gender: gender,
    messageContent: messageContent,
    messageType: messageType,
    nickname: nickname,
    password: password,
    region: region,
    time: time,
    id: id,
    username: username,
    remark: remark,
    blockLevel: blockLevel
};

function avatar(a) {
    return typeof a === 'string';
}

function gender(g) {
    return Number.isInteger(g) && g >= 0;
}

function messageContent(mc) {
    return typeof mc === 'string';
}

function messageType(mt) {
    return Number.isInteger(mt) && mt >= 0;
}

function nickname(n) {
    return typeof n === 'string';
}

function password(p) {
    return p && typeof p === 'string' && /^\w+$/.test(p);
}

function region(r) {
    return Number.isInteger(r) && r >= 0;
}

function time(t) {
    return Number.isInteger(t) && t >= 0;
}

function id(ui) {
    return ui && (ui instanceof ObjectId || (typeof ui === 'string' && /^[0-9a-f]{24}$/i.test(ui)));
}

function username(u) {
    return u && typeof u === 'string' && /^\w+$/.test(u);
}

function remark(rm) {
    return typeof rm === 'string';
}

function blockLevel(bl) {
    return Number.isInteger(bl) && bl >= 0 && bl <= 3;
}
