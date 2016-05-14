var httpGet = require('./tools').httpGet;
var httpPost = require('./tools').httpPost;
var httpPut = require('./tools').httpPut;
var httpDelete = require('./tools').httpDelete;
var socketConnect = require('./tools').socketConnect;
var socketWriter = require('./tools').socketWriter;
var jwt = require('jsonwebtoken');
var debug = require('debug')('WoChat-Server:test:chatGroup');
var assert = require('assert');

var token1, token2, token3;
var userId1, userId2, userId3;
var groupId1, groupId2;

module.exports = function () {
    before('获取用户token', function () {
        var p1 = httpPost({
            path: '/auth/login',
            data: {
                username: 'tidyzq',
                password: '123456'
            }
        }).then(function (res) {
            assert.equal(200, res.statusCode);
            var data = JSON.parse(res.body);
            assert(data.jwt);
            token1 = data.jwt;
            var decoded = jwt.decode(data.jwt);
            userId1 = decoded.user_id;
        });
        var p2 = httpPost({
            path: '/auth/login',
            data: {
                username: 'perqin',
                password: '654321'
            }
        }).then(function (res) {
            assert.equal(200, res.statusCode);
            var data = JSON.parse(res.body);
            assert(data.jwt);
            token2 = data.jwt;
            var decoded = jwt.decode(data.jwt);
            userId2 = decoded.user_id;
        });
        var p3 = httpPost({
            path: '/auth/login',
            data: {
                username: 'souler',
                password: '111111'
            }
        }).then(function (res) {
            assert.equal(200, res.statusCode);
            var data = JSON.parse(res.body);
            assert(data.jwt);
            token3 = data.jwt;
            var decoded = jwt.decode(data.jwt);
            userId3 = decoded.user_id;
        });
        return Promise.all([p1, p2, p3]);
    });
    before('清空message', function () {
        return new Promise(function (resolve, reject) {
            socketConnect(function (connection, packet) {
                if ('info' == packet.type) {
                    socketWriter(connection, {
                        type: 'auth',
                        data: {
                            token: token3
                        }
                    });
                } else if ('authrst' == packet.type) {
                    assert.equal(0, packet.data.code);
                } else if ('msg' == packet.type) {
                    socketWriter(connection, {
                        type: 'msgrcpt',
                        data: packet.data.map(function (msg) { return msg._id; })
                    });
                    connection.end();
                    resolve();
                }
            });
        });
    });
    describe('新建群组', function () {
        it('正常新建', function () {
            var p1 = httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group',
                data: {
                    groupname: 'foobar'
                }
            }).then(function (res) {
                assert.equal(201, res.statusCode);
                var group = JSON.parse(res.body);
                assert(group.hasOwnProperty('groupname'));
                assert(group.hasOwnProperty('_id'));
                assert(group.hasOwnProperty('members'));
                assert.equal(1, group.members.length);
                groupId1 = group._id;
            });
            var p2 = httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group',
                data: {
                    groupname: 'man god take me fly'
                }
            }).then(function (res) {
                assert.equal(201, res.statusCode);
                var group = JSON.parse(res.body);
                assert(group.hasOwnProperty('groupname'));
                assert(group.hasOwnProperty('_id'));
                assert(group.hasOwnProperty('members'));
                assert.equal(1, group.members.length);
                groupId2 = group._id;
            });
            return Promise.all([p1, p2]);
        });
        it('无token', function () {
            return httpPost({
                path: '/chat_group',
                data: {
                    groupname: 'foobar'
                }
            }).then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误参数', function () {
            var p1 = httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group',
                data: {
                    groupname: {}
                }
            }).then(function (res) {
                assert.equal(400, res.statusCode);
            });
            var p2 = httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group',
                data: {}
            }).then(function (res) {
                assert.equal(400, res.statusCode);
            });
            return Promise.all([p1, p2]);
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
                assert.equal(200, res.statusCode);
                var group = JSON.parse(res.body);
                assert(group.hasOwnProperty('groupname'));
                assert(group.hasOwnProperty('_id'));
                assert.ifError(group.hasOwnProperty('members'));
            });
        });
        it('无token', function () {
            return httpGet({
                path: '/chat_group/' + groupId1
            }).then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误群id', function () {
            return httpGet({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + 'groupId1'
            }).then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
        it('非成员', function () {
            return httpGet({
                headers: {
                    Authorization: token3
                },
                path: '/chat_group/' + groupId1
            }).then(function (res) {
                assert.equal(401, res.statusCode);
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
                assert.equal(200, res.statusCode);
                return httpGet({
                    headers: {
                        Authorization: token1
                    },
                    path: '/chat_group/' + groupId1
                }).then(function (res) {
                    assert.equal(200, res.statusCode);
                    var group = JSON.parse(res.body);
                    assert.equal('new foo bar', group.groupname);
                });
            });
        });
        it('无token', function () {
            return httpPut({
                path: '/chat_group/' + groupId1,
                data: {
                    groupname: 'new foo bar'
                }
            }).then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误参数', function () {
            var p1 = httpPut({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + groupId1,
                data: {
                    groupname: {}
                }
            }).then(function (res) {
                assert.equal(400, res.statusCode);
            });
            var p2 = httpPut({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + groupId1,
                data: {}
            }).then(function (res) {
                assert.equal(400, res.statusCode);
            });
            return Promise.all([p1, p2]);
        });
        it('错误群组名', function () {
            return httpPut({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + 'groupId1',
                data: {
                    groupname: '123'
                }
            }).then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
        it('非成员', function () {
            return httpPut({
                headers: {
                    Authorization: token3
                },
                path: '/chat_group/' + groupId1,
                data: {
                    groupname: '123'
                }
            }).then(function (res) {
                assert.equal(401, res.statusCode);
            });
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
                assert.equal(200, res.statusCode);
                var group = JSON.parse(res.body);
                assert(group.hasOwnProperty('_id'));
                assert(group.hasOwnProperty('members'));
                assert.equal(1, group.members.length);
                assert.equal('tidyzq', group.members[0].member.username);
            });
        });
        it('无token', function () {
            return httpGet({
                path: '/chat_group/' + groupId1 + '/members'
            }).then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误群id', function () {
            return httpGet({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + 'groupId1' + '/members'
            }).then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
        it('非成员', function () {
            return httpGet({
                headers: {
                    Authorization: token3
                },
                path: '/chat_group/' + groupId1 + '/members'
            }).then(function (res) {
                assert.equal(401, res.statusCode);
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
                assert.equal(200, res.statusCode);
                var groups = JSON.parse(res.body).chat_groups;
                assert.equal(2, groups.length);
                assert(groups.every(function (item) {
                    return (item.chat_group.groupname == 'new foo bar' || item.chat_group.groupname == 'man god take me fly')
                        && item.chat_group.hasOwnProperty('_id')
                        && !item.chat_group.hasOwnProperty('members');
                }));
            });
        });
        it('无token', function () {
            return httpGet({
                path: '/users/tidyzq/chat_groups'
            }).then(function (res) {
                assert.equal(401, res.statusCode);
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
                    assert.equal(200, res.statusCode);
                    var groups = JSON.parse(res.body).chat_groups;
                    assert(groups.some(function (item) {
                        return item.chat_group._id == groupId1 && item.block_level == 1;
                    }));
                });
            });
        });
        it('无token', function () {
            return httpPut({
                path: '/users/tidyzq/chat_groups/' + groupId1,
                data: {
                    block_level: 1
                }
            }).then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误参数', function () {
            return httpPut({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/chat_groups/' + groupId1,
                data: {
                    block_level: {}
                }
            }).then(function (res) {
                assert.equal(400, res.statusCode);
            });
        });
        it('错误群id', function () {
            var p1 = httpPut({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/chat_groups/' + 'groupId1',
                data: {
                    block_level: 1
                }
            }).then(function (res) {
                assert.equal(404, res.statusCode);
            });
            var p2 = httpPut({
                headers: {
                    Authorization: token2
                },
                path: '/users/perqin/chat_groups/' + groupId1,
                data: {
                    block_level: 1
                }
            }).then(function (res) {
                assert.equal(404, res.statusCode);
            });
            return Promise.all([p1, p2]);
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
                assert.equal(201, res.statusCode);
                return httpGet({
                    headers: {
                        Authorization: token1
                    },
                    path: '/chat_group/' + groupId1 + '/members'
                }).then(function (res) {
                    assert.equal(200, res.statusCode);
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
                        assert.equal(200, res.statusCode);
                        var groups = JSON.parse(res.body).chat_groups;
                        assert.equal(1, groups.length);
                        assert.equal('new foo bar', groups[0].chat_group.groupname);
                    });
                });
            });
        });
        it('列表添加', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + groupId2 + '/members',
                data: {
                    members: [userId2, userId3]
                }
            }).then(function (res) {
                assert.equal(201, res.statusCode);
                var p1 = httpGet({
                    headers: {
                        Authorization: token1
                    },
                    path: '/chat_group/' + groupId2 + '/members'
                }).then(function (res) {
                    assert.equal(200, res.statusCode);
                    var group = JSON.parse(res.body);
                    assert.equal(3, group.members.length);
                    assert(group.members.every(function (item) {
                        return item.member.username == 'perqin' || item.member.username == 'souler' || item.member.username == 'tidyzq';
                    }));
                });
                var p2 = httpGet({
                    headers: {
                        Authorization: token2
                    },
                    path: '/users/perqin/chat_groups'
                }).then(function (res) {
                    assert.equal(200, res.statusCode);
                    var groups = JSON.parse(res.body).chat_groups;
                    assert.equal(2, groups.length);
                    assert(groups.some(function (item) {
                        return item.chat_group.groupname == 'man god take me fly';
                    }));
                });
                var p3 = httpGet({
                    headers: {
                        Authorization: token3
                    },
                    path: '/users/souler/chat_groups'
                }).then(function (res) {
                    assert.equal(200, res.statusCode);
                    var groups = JSON.parse(res.body).chat_groups;
                    assert.equal(1, groups.length);
                    assert(groups.some(function (item) {
                        return item.chat_group.groupname == 'man god take me fly';
                    }));
                });
                return Promise.all([p1, p2, p3]);
            });
        })
        it('无token', function () {
            return httpPost({
                path: '/chat_group/' + groupId1 + '/members',
                data: {
                    members: [userId3]
                }
            }).then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误用户', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + groupId1 + '/members',
                data: {
                    members: ['123123123']
                }
            }).then(function (res) {
                assert.equal(400, res.statusCode);
            });
        })
        it('非好友', function () {
            return httpPost({
                headers: {
                    Authorization: token2
                },
                path: '/chat_group/' + groupId1 + '/members',
                data: {
                    members: [userId3]
                }
            }).then(function (res) {
                assert.equal(400, res.statusCode);
            });
        });
        it('错误群id', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + 'groupId1' + '/members',
                data: {
                    members: [userId3]
                }
            }).then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
        it('已是群成员', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + groupId1 + '/members',
                data: {
                    members: [userId2]
                }
            }).then(function (res) {
                assert.equal(409, res.statusCode);
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
                    assert.equal(200, res.statusCode);
                    var group = JSON.parse(res.body);
                    assert(group.hasOwnProperty('_id'));
                    assert(group.hasOwnProperty('members'));
                    assert(group.members.some(function (item) {
                        return item.member.username == 'perqin' && item.group_nick == 'teacher chang';
                    }));
                });
            });
        });
        it('无token', function () {
            return httpPut({
                path: '/chat_group/' + groupId1 + '/members/perqin',
                data: {
                    group_nick: 'teacher chang'
                }
            }).then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误参数', function () {
            return httpPut({
                headers: {
                    Authorization: token2
                },
                path: '/chat_group/' + groupId1 + '/members/perqin',
                data: {
                    group_nick: {}
                }
            }).then(function (res) {
                assert.equal(400, res.statusCode);
            });
        });
        it('错误群id', function () {
            return httpPut({
                headers: {
                    Authorization: token2
                },
                path: '/chat_group/' + 'groupId1' + '/members/perqin',
                data: {
                    group_nick: 'teacher chang'
                }
            }).then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
        it('非成员', function () {
            return httpPut({
                headers: {
                    Authorization: token3
                },
                path: '/chat_group/' + groupId1 + '/members/souler',
                data: {
                    group_nick: 'man god'
                }
            }).then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
    });
    describe('发消息给群组', function () {
        it('正常发送', function () {
            var p1 = new Promise(function (resolve, reject) {
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
            var p2 = httpPost({
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
            return Promise.all([p1, p2]);
        });
        it('无token', function () {
            return httpPost({
                path: '/chat_group/' + groupId1 + '/messages',
                data: {
                    type: 0,
                    content: 'nothing'
                }
            }).then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误参数', function () {
            var p1 = httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + groupId1 + '/messages',
                data: {
                    type: 'hello',
                    content: {}
                }
            }).then(function (res) {
                assert.equal(400, res.statusCode);
            });
            var p2 = httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + groupId1 + '/messages',
                data: {
                    type: 0
                }
            }).then(function (res) {
                assert.equal(400, res.statusCode);
            });
            return Promise.all([p1, p2]);
        });
        it('错误群id', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/chat_group/' + 'groupId1' + '/messages',
                data: {
                    type: 0,
                    content: 'nothing'
                }
            }).then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
        it('非成员', function () {
            return httpPost({
                headers: {
                    Authorization: token3
                },
                path: '/chat_group/' + groupId1 + '/messages',
                data: {
                    type: 0,
                    content: 'nothing'
                }
            }).then(function (res) {
                assert.equal(401, res.statusCode);
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
                    assert.equal(200, res.statusCode);
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
                    assert.equal(200, res.statusCode);
                    var group = JSON.parse(res.body);
                    assert(group.members.every(function (item) {
                        return item.member.username != 'tidyzq';
                    }));
                });
                return Promise.all([p1, p2]);
            });
        });
        it('无token', function () {
            return httpDelete({
                path: '/users/tidyzq/chat_groups/' + groupId1
            }).then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误群id', function () {
            return httpDelete({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/chat_groups/' + 'groupId1'
            }).then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
        it('非成员', function () {
            return httpDelete({
                headers: {
                    Authorization: token3
                },
                path: '/users/tidyzq/chat_groups/' + groupId1
            }).then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('另一个接口', function () {
            return httpDelete({
                headers: {
                    Authorization: token2
                },
                path: '/chat_group/' + groupId1 + '/members/perqin'
            }).then(function (res) {
                assert.equal(200, res.statusCode);
                var p1 = httpGet({
                    headers: {
                        Authorization: token2
                    },
                    path: '/users/perqin/chat_groups'
                }).then(function (res) {
                    assert.equal(200, res.statusCode);
                    var groups = JSON.parse(res.body).chat_groups;
                    assert(groups.every(function (item) {
                        return item.chat_group._id != groupId1;
                    }));
                });
                var p2 = httpGet({
                    headers: {
                        Authorization: token2
                    },
                    path: '/chat_group/' + groupId1
                }).then(function (res) {
                    assert.equal(404, res.statusCode);
                });
                return Promise.all([p1, p2]);
            });
        });
    });
};
