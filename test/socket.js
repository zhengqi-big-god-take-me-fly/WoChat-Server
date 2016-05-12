var httpGet = require('./tools').httpGet;
var httpPost = require('./tools').httpPost;
var socketWriter = require('./tools').socketWriter;
var assert = require('assert');
var SocketBuffer = require('../utils/socketBuffer');
var debug = require('debug')('WoChat-Server:test:socket');
var net = require('net');
var jwt = require('jsonwebtoken');

var token1, token2;

module.exports = function () {
    describe('获取用户token', function () {
        it('用户1', function () {
            return httpPost({
                path: '/auth/login',
                data: {
                    username: 'tidyzq',
                    password: '123456'
                }
            }).then(function (res) {
                assert(200, res.statusCode);
                var data = JSON.parse(res.body);
                assert(data.jwt);
                token1 = data.jwt;
                // var decoded = jwt.decode(data.jwt);
                // assert(decoded.user_id);
                // userId1 = decoded.user_id;
            });
        });
        it('用户2', function () {
            return httpPost({
                path: '/auth/login',
                data: {
                    username: 'perqin',
                    password: '654321'
                }
            }).then(function (res) {
                assert(200, res.statusCode);
                var data = JSON.parse(res.body);
                assert(data.jwt);
                token2 = data.jwt;
                // var decoded = jwt.decode(data.jwt);
                // assert(decoded.user_id);
                // userId2 = decoded.user_id;
            });
        });
    });
    describe('socket连接', function () {
        it('连接', function () {
            var p1 = new Promise(function (resolve, reject) {
                var client = net.createConnection({ port: 3001 });
                var socketBuffer = new SocketBuffer();
                socketBuffer.on('packet', function (packet) {
                    // debug(packet);
                    client.end();
                });
                client.on('data', function (data) {
                    socketBuffer.addBuffer(data);
                });
                client.on('end', function () {
                    resolve();
                });
            });
            var p2 = new Promise(function (resolve, reject) {
                var client = net.createConnection({ port: 3001 });
                var socketBuffer = new SocketBuffer();
                socketBuffer.on('packet', function (packet) {
                    // debug(packet);
                    client.end();
                });
                client.on('data', function (data) {
                    socketBuffer.addBuffer(data);
                });
                client.on('end', function () {
                    resolve();
                });
            });
            return Promise.all([p1, p2]);
        });
        it('token登陆', function () {
            return new Promise(function (resolve, reject) {
                var client = net.createConnection({ port: 3001 }, function () {
                    socketWriter(client, {
                        type: 'auth',
                        data: {
                            token: token1
                        }
                    });
                    var socketBuffer = new SocketBuffer();
                    socketBuffer.on('packet', function (packet) {
                        // debug(packet);
                        if (packet.type == 'authrst' && packet.data.code == 0) {
                            client.end();
                        }
                    });
                    client.on('data', function (data) {
                        socketBuffer.addBuffer(data);
                    });
                    client.on('end', function () {
                        resolve();
                    });
                });
            });
        });
        it('用户名密码登陆', function () {
            return new Promise(function (resolve, reject) {
                var client = net.createConnection({ port: 3001 }, function () {
                    socketWriter(client, {
                        type: 'auth',
                        data: {
                            username: 'perqin',
                            password: '654321'
                        }
                    });
                    var socketBuffer = new SocketBuffer();
                    socketBuffer.on('packet', function (packet) {
                        // debug(packet);
                        if (packet.type == 'authrst') {
                            assert.equal(0, packet.data.code);
                            client.end();
                        }
                    });
                    client.on('data', function (data) {
                        socketBuffer.addBuffer(data);
                    });
                    client.on('end', function () {
                        resolve();
                    });
                });
            });
        });
        it('错误信息登陆', function () {
            return new Promise(function (resolve, reject) {
                var client = net.createConnection({ port: 3001 }, function () {
                    socketWriter(client, {
                        type: 'auth',
                        data: {
                            token: 'perqin'
                        }
                    });
                    var socketBuffer = new SocketBuffer();
                    socketBuffer.on('packet', function (packet) {
                        // debug(packet);
                        if (packet.type == 'authrst') {
                            assert.equal(1, packet.data.code);
                            client.end();
                        }
                    });
                    client.on('data', function (data) {
                        socketBuffer.addBuffer(data);
                    });
                    client.on('end', function () {
                        resolve();
                    });
                });
            });
        });
        it('重复登陆', function () {
            return new Promise(function (resolve, reject) {
                var client = net.createConnection({ port: 3001 }, function () {
                    var socketBuffer = new SocketBuffer();
                    socketBuffer.on('packet', function (packet) {
                        // debug(packet);
                        if (packet.type == 'authrst') {
                            if (packet.data.code == 0) {
                                socketWriter(client, {
                                    type: 'auth',
                                    data: {
                                        token: token1
                                    }
                                });
                            } else if (packet.data.code == 2) {
                                client.end();
                            }
                        }
                    });
                    client.on('data', function (data) {
                        socketBuffer.addBuffer(data);
                    });
                    client.on('end', function () {
                        resolve();
                    });
                    socketWriter(client, {
                        type: 'auth',
                        data: {
                            token: token1
                        }
                    });
                });
            });
        });
    });
    describe('socket信息', function () {
        it('未读消息', function () {
            return new Promise(function (resolve, reject) {
                var client = net.createConnection({ port: 3001 }, function () {
                    socketWriter(client, {
                        type: 'auth',
                        data: {
                            token: token2
                        }
                    });
                    var socketBuffer = new SocketBuffer();
                    socketBuffer.on('packet', function (packet) {
                        // debug(packet);
                        if (packet.type == 'msg') {
                            assert.equal(2, packet.data.length);
                            socketWriter(client, {
                                type: 'msgrcpt',
                                data: [
                                    packet.data[0]._id,
                                    packet.data[1]._id
                                ]
                            });
                            client.end();
                        }
                    });
                    client.on('data', function (data) {
                        socketBuffer.addBuffer(data);
                    });
                    client.on('end', function () {
                        resolve();
                    });
                });
            });
        });
        it('新消息', function () {
            return new Promise(function (resolve, reject) {
                var client = net.createConnection({ port: 3001 }, function () {
                    socketWriter(client, {
                        type: 'auth',
                        data: {
                            token: token2
                        }
                    });
                    var socketBuffer = new SocketBuffer();
                    socketBuffer.on('packet', function (packet) {
                        debug(packet);
                        if (packet.type == 'authrst') {
                            assert.equal(0, packet.data.code);
                            httpPost({
                                headers: {
                                    Authorization: token1
                                },
                                path: '/users/perqin/message',
                                data: {
                                    type: 0,
                                    content: 'teacher chang is sb'
                                }
                            })
                            .then(function (res) {
                                assert.equal(201, res.statusCode);
                            });
                        } else if (packet.type == 'msg') {
                            assert.equal(1, packet.data.length);
                            assert.equal('teacher chang is sb', packet.data[0].content);
                            socketWriter(client, {
                                type: 'msgrcpt',
                                data: [
                                    packet.data[0]._id,
                                ]
                            });
                            client.end();
                        }
                    });
                    client.on('data', function (data) {
                        socketBuffer.addBuffer(data);
                    });
                    client.on('end', function () {
                        resolve();
                    });
                });
            })
        });
    });
};
