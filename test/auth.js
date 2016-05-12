var httpGet = require('./tools').httpGet;
var httpPost = require('./tools').httpPost;
var assert = require('assert');

var config = require('../utils/config');
var jwt = require('jsonwebtoken');

var User = require('../models/user');

module.exports = function () {
    describe('注册', function () {
        it('正常注册', function() {
            var postData1 = {
                username: 'tidyzq',
                password: '123456'
            };
            var p1 = httpPost({
                path: '/users',
                data: postData1
            })
            .then(function (res) {
               assert.equal(201, res.statusCode);
            });
            var postData2 = {
                username: 'perqin',
                password: '654321'
            };
            var p2 = httpPost({
                path: '/users',
                data: postData2
            })
            .then(function (res) {
                assert.equal(201, res.statusCode);
            });
            return Promise.all([p1, p2]);
        });
        it('空参数', function () {
            var postData = {};
            return httpPost({
                path: '/users',
                data: postData
            })
            .then(function (res) {
                assert.equal(400, res.statusCode);
            });
        });
        it('错误参数', function () {
            var postData = {
                username: '',
                password: '',
            };
            return httpPost({
                path: '/users',
                data: postData
            })
            .then(function (res) {
                assert.equal(400, res.statusCode);
            });
        });
        it('重复注册', function () {
            var postData = {
                username: 'tidyzq',
                password: '123'
            };
            return httpPost({
                path: '/users',
                data: postData
            })
            .then(function (res) {
               assert.equal(409, res.statusCode);
               return User.findOne({
                    username: 'tidyzq'
               }).exec();
            })
            .then(function (doc) {
                assert(doc);
                assert.equal(doc.username, 'tidyzq');
                assert.equal(doc.password, '123456');
            });
        });
    });
    describe('登录', function () {
        it('正常登陆', function () {
            var postData1 = {
                username: 'tidyzq',
                password: '123456'
            }
            var p1 = httpPost({
                path: '/auth/login',
                data: postData1
            })
            .then(function (res) {
                assert.equal(200, res.statusCode);
                var msg = JSON.parse(res.body);
                return new Promise(function (resolve, reject) {
                    jwt.verify(msg.jwt, config.secret, function (err, decoded) {
                        assert.ifError(err);
                        assert.ok(decoded.user_id);
                        assert.equal('tidyzq', decoded.username);
                        resolve();
                    });
                });
            });
            var postData2 = {
                username: 'perqin',
                password: '654321'
            }
            var p2 = httpPost({
                path: '/auth/login',
                data: postData2
            })
            .then(function (res) {
                assert.equal(200, res.statusCode);
                var msg = JSON.parse(res.body);
                return new Promise(function (resolve, reject) {
                    jwt.verify(msg.jwt, config.secret, function (err, decoded) {
                        assert.ifError(err);
                        assert.ok(decoded.user_id);
                        assert.equal('perqin', decoded.username);
                        resolve();
                    });
                });
            });
            return Promise.all([p1, p2]);
        });
        it('错误登陆', function () {
            var postData = {
                username: 'tidyzq',
                password: '123'
            }
            return httpPost({
                path: '/auth/login',
                data: postData
            })
            .then(function (res) {
                assert.equal(401, res.statusCode);
            });
        });
    });
}
