var httpGet = require('./tools').httpGet;
var httpPost = require('./tools').httpPost;
var httpPut = require('./tools').httpPut;
var httpDelete = require('./tools').httpDelete;
var socketConnect = require('./tools').socketConnect;
var socketWriter = require('./tools').socketWriter;
var jwt = require('jsonwebtoken');
var debug = require('debug')('WoChat-Server:test:chatGroup');
var assert = require('assert');

var token1, token2;
var userId1, userId2;
var groupId1, groupId2;

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
                var decoded = jwt.decode(data.jwt);
                userId1 = decoded.user_id;
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
                var decoded = jwt.decode(data.jwt);
                userId2 = decoded.user_id;
            });
        });
    });
    describe('新建群组', function () {
        it('正常新建', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group',
                data: {
                    groupname: 'foobar'
                }
            }).then(function (res) {
                assert(201, res.statusCode);
                var group = JSON.parse(res.body);
                assert(group.hasOwnProperty('groupname'));
                assert(group.hasOwnProperty('_id'));
                assert(group.hasOwnProperty('members'));
                assert.equal(1, group.members.length);
                groupId1 = group._id;
            });
        });
    });
    describe('获取群组信息', function () {
        it('正常获取', function () {
            return httpGet({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + groupId1
            }).then(function (res) {
                assert(200, res.statusCode);
                var group = JSON.parse(res.body);
                assert(group.hasOwnProperty('groupname'));
                assert(group.hasOwnProperty('_id'));
                assert.ifError(group.hasOwnProperty('members'));
            });
        });
    });
    describe('修改群组信息', function () {
        it('正常修改', function () {
            return httpPut({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + groupId1,
                data: {
                    groupname: 'new foo bar'
                }
            }).then(function (res) {
                assert(200, res.statusCode);
                return httpGet({
                    headers: {
                        Authorization: token1
                    },
                    path: '/chat_group/' + groupId1
                }).then(function (res) {
                    assert(200, res.statusCode);
                    var group = JSON.parse(res.body);
                    assert.equal('new foo bar', group.groupname);
                });
            })
        });
    });
    describe('获取群组成员', function () {
        it('正常获取', function () {
            return httpGet({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + groupId1 + '/members'
            }).then(function (res) {
                assert(200, res.statusCode);
                var group = JSON.parse(res.body);
                assert(group.hasOwnProperty('_id'));
                assert(group.hasOwnProperty('members'));
                assert.equal(1, group.members.length);
                assert.equal('tidyzq', group.members[0].member.username);
            });
        });
    });
    describe('获取群聊信息', function () {
        it('正常获取', function () {
            return httpGet({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/chat_groups'
            }).then(function (res) {
                assert(200, res.statusCode);
                var groups = JSON.parse(res.body).chat_groups;
                assert.equal(1, groups.length);
                assert.equal('new foo bar', groups[0].chat_group.groupname);
            });
        });
    });
    describe('修改群聊信息', function () {
        it('正常修改', function () {
            return httpPut({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/chat_groups/' + groupId1,
                data: {
                    block_level: 1
                }
            }).then(function (res) {
                assert.equal(200, res.statusCode);
                return httpGet({
                    headers: {
                        Authorization: token1
                    },
                    path: '/users/tidyzq/chat_groups'
                }).then(function (res) {
                    assert(200, res.statusCode);
                    var groups = JSON.parse(res.body).chat_groups;
                    assert.equal(1, groups[0].block_level);
                });
            });
        });
    });
    describe('添加群组成员', function () {
        it('正常添加', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + groupId1 + '/members',
                data: {
                    members: [userId2]
                }
            }).then(function (res) {
                assert(201, res.statusCode);
                return httpGet({
                    headers: {
                        Authorization: token1
                    },
                    path: '/chat_group/' + groupId1 + '/members'
                }).then(function (res) {
                    assert(200, res.statusCode);
                    var group = JSON.parse(res.body);
                    assert.equal(2, group.members.length);
                    assert(group.members.some(function (item) {
                        return item.member.username == 'perqin';
                    }));
                    return httpGet({
                        headers: {
                            Authorization: token2
                        },
                        path: '/users/perqin/chat_groups'
                    }).then(function (res) {
                        assert(200, res.statusCode);
                        var groups = JSON.parse(res.body).chat_groups;
                        assert.equal(1, groups.length);
                        assert.equal('new foo bar', groups[0].chat_group.groupname);
                    });
                });
            });
        });
    });
    describe('修改群组成员信息', function () {
        it('正常修改', function () {
            return httpPut({
                headers: {
                    Authorization: token2
                },
                path: '/chat_group/' + groupId1 + '/members/perqin',
                data: {
                    group_nick: 'teacher chang'
                }
            }).then(function (res) {
                assert.equal(200, res.statusCode);
                return httpGet({
                    headers: {
                        Authorization: token1
                    },
                    path: '/chat_group/' + groupId1 + '/members'
                }).then(function (res) {
                    assert(200, res.statusCode);
                    var group = JSON.parse(res.body);
                    assert(group.hasOwnProperty('_id'));
                    assert(group.hasOwnProperty('members'));
                    assert(group.members.some(function (item) {
                        return item.member.username == 'perqin' && item.group_nick == 'teacher chang';
                    }));
                });
            });
        });
    });
    describe('发消息给群组', function () {
        it('正常发送', function () {
            return new Promise(function (resolve, reject) {
                socketConnect(function (connection, packet) {
                    // debug(packet);
                    if ('info' == packet.type) {
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
                            path: '/chat_group/' + groupId1 + '/messages',
                            data: {
                                type: 0,
                                content: 'nothing'
                            }
                        }).then(function (res) {
                            assert.equal(201, res.statusCode);
                        });
                    } else if ('msg' == packet.type) {
                        assert.equal(1, packet.data.length);
                        assert.equal(userId1, packet.data[0].sender);
                        assert.equal(groupId1, packet.data[0].receiver);
                        assert.equal(0, packet.data[0].type);
                        assert.equal('nothing', packet.data[0].content);
                        socketWriter(connection, {
                            type: 'msgrcpt',
                            data: [packet.data[0]._id]
                        });
                        connection.end();
                        resolve();
                    }
                });
            });
        });
    });
    describe('退出群聊', function () {
        it('正常退出', function () {
            return httpDelete({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/chat_groups/' + groupId1
            }).then(function (res) {
                assert.equal(200, res.statusCode);
                var p1 = httpGet({
                    headers: {
                        Authorization: token1
                    },
                    path: '/users/tidyzq/chat_groups'
                }).then(function (res) {
                    assert(200, res.statusCode);
                    var groups = JSON.parse(res.body).chat_groups;
                    assert(groups.every(function (item) {
                        return item.chat_group._id != groupId1;
                    }));
                });
                var p2 = httpGet({
                    headers: {
                        Authorization: token2
                    },
                    path: '/chat_group/' + groupId1 + '/members'
                }).then(function (res) {
                    assert(200, res.statusCode);
                    var group = JSON.parse(res.body);
                    assert(group.members.every(function (item) {
                        return item.member.username != 'tidyzq';
                    }));
                });
                return Promise.all([p1, p2]);
            });
        });
    });
};
