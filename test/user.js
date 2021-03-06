var httpGet = require('./tools').httpGet;
var httpPost = require('./tools').httpPost;
var httpPut = require('./tools').httpPut;
var httpDelete = require('./tools').httpDelete;
var debug = require('debug')('WoChat-Server:test:user');
var assert = require('assert');
var jwt = require('jsonwebtoken');

var token1, token2, token3;
var inviteToken;

module.exports = function () {
    describe('注册用户', function () {
        it('用户3', function () {
            return httpPost({
                path: '/users',
                data: {
                    username: 'souler',
                    password: '111111'
                }
            })
            .then(function (res) {
                assert.equal(201, res.statusCode);
            });
        });
    });
    describe('获取用户token', function () {
        it('用户1', function () {
            return httpPost({
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
                assert.equal(200, res.statusCode);
                var data = JSON.parse(res.body);
                assert(data.jwt);
                token2 = data.jwt;
            });
        });
        it('用户3', function () {
            return httpPost({
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
            });
        });
    });
    describe('获取用户信息', function () {
        it('正常获取', function () {
            return httpGet({
                path: '/users/tidyzq'
            })
            .then(function (res) {
                assert.equal(200, res.statusCode);
                var user = JSON.parse(res.body);
                assert.ok(user);
                assert.ok(user.username);
                assert.ok(user.nickname);
                assert.ok(user.avatar);
                assert.ok(user.gender != undefined);
                assert.ok(user.region != undefined);
                assert.ifError(user.password);
                assert.ifError(user.contacts);
                assert.ifError(user.chat_groups);
                assert.ifError(user.activities);
            });
        });
        it('获取错误username', function () {
            return httpGet({
                path: '/users/hahaha'
            })
            .then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
    });
    describe('修改用户信息', function () {
        it('正常修改', function () {
            return httpPut({
                headers: {
                    Authorization: token2
                },
                path: '/users/perqin',
                data: {
                    region: 1,
                    old_password: '654321'
                }
            })
            .then(function (res) {
                assert.equal(200, res.statusCode);
                return httpGet({
                    path: '/users/perqin'
                })
                .then(function (res) {
                    assert.equal(200, res.statusCode);
                    var user = JSON.parse(res.body);
                    assert.equal(1, user.region);
                });
            });
        });
        it('数据不符合规范', function () {
            return httpPut({
                headers: {
                    Authorization: token2
                },
                path: '/users/perqin',
                data: {
                    region: 0.1,
                    old_password: '654321'
                }
            })
            .then(function (res) {
                assert.equal(400, res.statusCode);
            });
        });
        it('无token', function () {
            return httpPut({
                path: '/users/perqin',
                data: {
                    region: 0,
                    old_password: '654321'
                }
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('无旧密码', function () {
            return httpPut({
                headers: {
                    Authorization: token2
                },
                path: '/users/perqin',
                data: {
                    region: 0
                }
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误username', function () {
            return httpPut({
                headers: {
                    Authorization: token2
                },
                path: '/users/hahah',
                data: {
                    region: 0,
                    old_password: '654321'
                }
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
    });
    describe('发送邀请', function () {
        it('正常发送', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/users/perqin/invitation',
                data: {
                    message: 'hello'
                }
            })
            .then(function (res) {
                assert.equal(201, res.statusCode);
                inviteToken = JSON.parse(res.body).inviteToken;
                assert(inviteToken);
                var decoded = jwt.decode(inviteToken);
                assert(decoded.sender);
                assert(decoded.receiver);
                assert.equal('hello', decoded.message);
            });
        });
        it('无token', function () {
            return httpPost({
                path: '/users/perqin/invitation',
                data: {
                    message: 'hello'
                }
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        })
        it('错误用户', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/users/perqinnnn/invitation',
                data: {
                    message: 'hello'
                }
            })
            .then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
    });
    describe('接受邀请', function () {
        it('正常接受', function () {
            return httpPut({
                headers: {
                    Authorization: token2
                },
                path: '/users/perqin/invitation',
                data: {
                    invitation: inviteToken
                }
            })
            .then(function (res) {
                assert.equal(200, res.statusCode);
            });
        });
        it('无token', function () {
            return httpPut({
                path: '/users/perqin/invitation',
                data: {
                    invitation: inviteToken
                }
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('无邀请token', function () {
            return httpPut({
                headers: {
                    Authorization: token2
                },
                path: '/users/perqin/invitation',
                data: {}
            })
            .then(function (res) {
                assert.equal(400, res.statusCode);
            });
        });
        it('错误用户', function () {
            return httpPut({
                headers: {
                    Authorization: token2
                },
                path: '/users/perqinnnn/invitation',
                data: {
                    invitation: inviteToken
                }
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('重复接受邀请', function () {
            return httpPut({
                headers: {
                    Authorization: token2
                },
                path: '/users/perqin/invitation',
                data: {
                    invitation: inviteToken
                }
            })
            .then(function (res) {
                assert.equal(409, res.statusCode);
            });
        });
    });
    describe('发送邀请', function () {
        it('已经是好友', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/users/perqin/invitation',
                data: {
                    message: 'hello'
                }
            })
            .then(function (res) {
                assert.equal(409, res.statusCode);
            });
        });
    });
    describe('获取联系人信息', function () {
        it('正常获取', function () {
            var p1 = httpGet({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/contacts'
            })
            .then(function (res) {
                assert.equal(200, res.statusCode);
                var user = JSON.parse(res.body);
                assert.ok(user.contacts);
                assert(user.contacts.every(function (item) {
                    return item.contact.hasOwnProperty('_id')
                    && item.contact.hasOwnProperty('username')
                    && item.contact.hasOwnProperty('nickname')
                    && item.contact.hasOwnProperty('avatar')
                    && item.hasOwnProperty('block_level');
                }));
                assert(user.contacts.some(function (item) {
                    return item.contact.username == 'perqin';
                }));
            });
            var p2 = httpGet({
                headers: {
                    Authorization: token2
                },
                path: '/users/perqin/contacts'
            })
            .then(function (res) {
                assert.equal(200, res.statusCode);
                var user = JSON.parse(res.body);
                assert.ok(user.contacts);
                assert(user.contacts.every(function (item) {
                    return item.contact.hasOwnProperty('_id')
                    && item.contact.hasOwnProperty('username')
                    && item.contact.hasOwnProperty('nickname')
                    && item.contact.hasOwnProperty('avatar')
                    && item.hasOwnProperty('block_level');
                }));
                assert(user.contacts.some(function (item) {
                    return item.contact.username == 'tidyzq';
                }));
            });
            return Promise.all([p1, p2]);
        });
        it('无token获取', function () {
            return httpGet({
                path: '/users/tidyzq/contacts'
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误用户获取', function () {
            return httpGet({
                headers: {
                    Authorization: token2
                },
                path: '/users/perqinn/contacts'
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
    });
    describe('修改联系人信息', function () {
        it('正常修改', function () {
            return httpPut({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/contacts/perqin',
                data: {
                    remark: 'teacher chang',
                    block_level: 1
                }
            })
            .then(function (res) {
                assert.equal(200, res.statusCode);
                return httpGet({
                    headers: {
                        Authorization: token1
                    },
                    path: '/users/tidyzq/contacts'
                })
                .then(function (res) {
                    assert.equal(200, res.statusCode);
                    var user = JSON.parse(res.body);
                    assert.ok(user.contacts);
                    assert(user.contacts.some(function (item) {
                        return item.contact.username == 'perqin' && item.remark == 'teacher chang' && item.block_level == 1;
                    }));
                });
            });
        });
        it('无token', function () {
            return httpPut({
                path: '/users/tidyzq/contacts/perqin',
                data: {
                    remark: 'teacher chang',
                    block_level: 1
                }
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误联系人', function () {
            return httpPut({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/contacts/souler',
                data: {
                    remark: 'man god',
                    block_level: 1
                }
            })
            .then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
        it('参数不符合规范', function () {
            return httpPut({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/contacts/perqin',
                data: {
                    remark: 123,
                    block_level: 1.23
                }
            })
            .then(function (res) {
                assert.equal(400, res.statusCode);
            });
        });
    });
    describe('发送消息给用户', function () {
        it('正常发送', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/users/perqin/message',
                data: {
                    type: 0,
                    content: 'hello sb teacher chang'
                }
            })
            .then(function (res) {
                assert.equal(201, res.statusCode);
                // debug(res.body);
                var message = JSON.parse(res.body);
                assert(message.sender);
                assert(message.receiver);
                assert.equal(message.to_group, false);
                assert.equal(message.type, 0);
                assert.equal(message.content, 'hello sb teacher chang');
                assert(message.time);
                assert.ifError(message.unread);
            });
        });
        it('无token', function () {
            return httpPost({
                path: '/users/perqin/message',
                data: {
                    type: 0,
                    content: 'hello sb teacher chang'
                }
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('参数错误', function () {
            var p1 = httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/users/perqin/message',
                data: {
                    type: 'hello',
                    content: 'hello sb teacher chang'
                }
            })
            .then(function (res) {
                assert.equal(400, res.statusCode);
            });
            var p2 = httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/users/perqin/message',
                data: {
                    type: 0
                }
            })
            .then(function (res) {
                assert.equal(400, res.statusCode);
            });
            return Promise.all([p1, p2]);
        });
        it('非好友', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/users/souler/message',
                data: {
                    type: 0,
                    content: 'hello mam god'
                }
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('错误用户名', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/users/perqinnn/message',
                data: {
                    type: 0,
                    content: 'hello sb teacher chang'
                }
            })
            .then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
    });
    describe('删除联系人', function () {
        it('正常删除', function () {
            return httpDelete({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/contacts/perqin'
            })
            .then(function (res) {
                assert.equal(200, res.statusCode);
                var p1 = httpGet({
                    headers: {
                        Authorization: token1
                    },
                    path: '/users/tidyzq/contacts'
                })
                .then(function (res) {
                    assert.equal(200, res.statusCode);
                    var user = JSON.parse(res.body);
                    assert.ok(user.contacts);
                    assert(user.contacts.every(function (item) {
                        return item.contact.username != 'perqin';
                    }));
                });
                var p2 = httpGet({
                    headers: {
                        Authorization: token2
                    },
                    path: '/users/perqin/contacts'
                })
                .then(function (res) {
                    assert.equal(200, res.statusCode);
                    var user = JSON.parse(res.body);
                    assert.ok(user.contacts);
                    assert(user.contacts.every(function (item) {
                        return item.contact.username != 'tidyzq';
                    }));
                });
                return Promise.all([p1, p2]);
            });
        });
        it('无token', function () {
            return httpDelete({
                path: '/users/tidyzq/contacts/perqin'
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
        it('非好友', function () {
            return httpDelete({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/contacts/souler'
            })
            .then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
        it('错误用户名', function () {
            return httpDelete({
                headers: {
                    Authorization: token1
                },
                path: '/users/tidyzq/contacts/perqinnn'
            })
            .then(function (res) {
                assert.equal(404, res.statusCode);
            });
        });
    });
    describe('添加好友关系', function () {
        it('用户1和用户2', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/users/perqin/invitation',
                data: {
                    message: 'hello'
                }
            })
            .then(function (res) {
                assert.equal(201, res.statusCode);
                var inviteToken = JSON.parse(res.body).inviteToken;
                assert(inviteToken);
                return httpPut({
                    headers: {
                        Authorization: token2
                    },
                    path: '/users/perqin/invitation',
                    data: {
                        invitation: inviteToken
                    }
                })
                .then(function (res) {
                    assert.equal(200, res.statusCode);
                });
            });
        });
        it('用户1和用户3', function () {
            return httpPost({
                headers: {
                    Authorization: token1
                },
                path: '/users/souler/invitation',
                data: {
                    message: 'hello'
                }
            })
            .then(function (res) {
                assert.equal(201, res.statusCode);
                var inviteToken = JSON.parse(res.body).inviteToken;
                assert(inviteToken);
                return httpPut({
                    headers: {
                        Authorization: token3
                    },
                    path: '/users/souler/invitation',
                    data: {
                        invitation: inviteToken
                    }
                })
                .then(function (res) {
                    assert.equal(200, res.statusCode);
                });
            });
        });
    });
};
