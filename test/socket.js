var httpGet = require('./tools').httpGet;
var httpPost = require('./tools').httpPost;
var socketConnect = require('./tools').socketConnect;
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
            return new Promise(function (resolve, reject) {
                socketConnect(function (connection, packet) {
                    assert.equal('info', packet.type);
                    assert.equal('Hello\n', packet.data);
                    connection.end();
                    resolve();
                });
            });
        });
        it('token登陆', function () {
            return new Promise(function (resolve, reject) {
                socketConnect(function (connection, packet) {
                    if ('info' == packet.type) {
                        assert.equal('Hello\n', packet.data);
                        socketWriter(connection, {
                            type: 'auth',
                            data: {
                                token: token1
                            }
                        });
                    } else if ('authrst' == packet.type) {
                        assert.equal(0, packet.data.code);
                        connection.end();
                        resolve();
                    }
                });
            });
        });
        it('用户名密码登陆', function () {
            return new Promise(function (resolve, reject) {
                socketConnect(function (connection, packet) {
                    if ('info' == packet.type) {
                        assert.equal('Hello\n', packet.data);
                        socketWriter(connection, {
                            type: 'auth',
                            data: {
                                username: 'tidyzq',
                                password: '123456'
                            }
                        });
                    } else if ('authrst' == packet.type) {
                        assert.equal(0, packet.data.code);
                        connection.end();
                        resolve();
                    }
                });
            });
        });
        it('错误信息登陆', function () {
            return new Promise(function (resolve, reject) {
                socketConnect(function (connection, packet) {
                    if ('info' == packet.type) {
                        assert.equal('Hello\n', packet.data);
                        socketWriter(connection, {
                            type: 'auth',
                            data: {
                                username: 'tidyzq'
                            }
                        });
                    } else if ('authrst' == packet.type) {
                        assert.equal(1, packet.data.code);
                        connection.end();
                        resolve();
                    }
                });
            });
        });
        it('重复登陆', function () {
            return new Promise(function (resolve, reject) {
                socketConnect(function (connection, packet) {
                    if ('info' == packet.type) {
                        assert.equal('Hello\n', packet.data);
                        socketWriter(connection, {
                            type: 'auth',
                            data: {
                                token: token1
                            }
                        });
                    } else if ('authrst' == packet.type) {
                        if (packet.data.code == 0) {
                            socketWriter(connection, {
                                type: 'auth',
                                data: {
                                    token: token1
                                }
                            });
                        } else if (packet.data.code == 2) {
                            connection.end();
                            resolve();
                        }
                    }
                });
            });
        });
    });
    describe('socket信息', function () {
        it('未读消息', function () {
            return new Promise(function (resolve, reject) {
                socketConnect(function (connection, packet) {
                    if ('info' == packet.type) {
                        assert.equal('Hello\n', packet.data);
                        socketWriter(connection, {
                            type: 'auth',
                            data: {
                                token: token2
                            }
                        });
                    } else if ('authrst' == packet.type) {
                        assert.equal(0, packet.data.code);
                    } else if ('msg' == packet.type) {
                        assert.equal(2, packet.data.length);
                        socketWriter(connection, {
                            type: 'msgrcpt',
                            data: [
                                packet.data[0]._id,
                                packet.data[1]._id
                            ]
                        });
                        connection.end();
                        resolve();
                    }
                });
            });
        });
        it('新消息', function () {
            return new Promise(function (resolve, reject) {
                socketConnect(function (connection, packet) {
                    if ('info' == packet.type) {
                        assert.equal('Hello\n', packet.data);
                        socketWriter(connection, {
                            type: 'auth',
                            data: {
                                token: token2
                            }
                        });
                    } else if ('authrst' == packet.type) {
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
                    } else if ('msg' == packet.type) {
                        assert.equal(1, packet.data.length);
                        assert.equal('teacher chang is sb', packet.data[0].content);
                        socketWriter(connection, {
                            type: 'msgrcpt',
                            data: [
                                packet.data[0]._id,
                            ]
                        });
                        connection.end();
                        resolve();
                    }
                });
            });
        });
    });
};
