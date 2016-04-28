var express = require('express');
var router = express.Router();
// var mongoose = require('mongoose');
// var User = require('../models/user');

router.get('/', function(req, res, next) {
    res.send('gg');
});
//
// router.post('/', function (req, res, next) {
//     var username = req.body['username'];
//     var password = req.body['password'];
//     var result = {};
//     User.create({
//         username: username,
//         password: password
//     }).then(function (docs) {
//         // TODO: Test if docs is empty of length
//     }).catch(function (error) {
//         // TODO: Set fail HTTP status code
//         result['error_code'] = 1;
//         result['error_msg'] = 'Create user failed!';
//     }).then(function () {
//         res.send(JSON.stringify(result));
//     });
// });

module.exports = router;
