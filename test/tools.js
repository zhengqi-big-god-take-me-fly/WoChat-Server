var http = require('http');
var querystring = require('querystring');

function httpGet(options) {
    var path = (options.path && typeof options.path === 'string') ? options.path : '/';
    var qString = (options.query && typeof options.query === 'string') ? options.query : querystring.stringify(options.query);
    var headers = (typeof options.headers === 'object' && options.headers) ? options.headers : {};
    var options = {
        hostname: 'localhost',
        port: 3000,
        path: path + (qString == '' ? '' : ('?' + qString)),
        headers: headers
    };
    // debug(options);
    return new Promise(function (resolve, reject) {
        http.get(options, function (res) {
            res.setEncoding('utf8');
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            }).on('end', function () {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body.join()
                });
            });
        }).on('error', function (err) {
            debug('http get error', err);
            reject();
        });
    });
}

function httpPost(options) {
    var path = (options.path && typeof options.path === 'string') ? options.path : '/';
    var qString = (options.query && typeof options.query === 'string') ? options.query : querystring.stringify(options.query);
    var dString = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
    var headers = (options.headers && typeof options.headers === 'object') ? options.headers : {};
    headers['Content-Length'] = dString.length;
    headers['Content-Type'] = 'application/json';
    var options = {
        hostname: 'localhost',
        port: 3000,
        path: path + (qString == '' ? '' : ('?' + qString)),
        method: 'POST',
        headers: headers
    };
    return new Promise(function (resolve, reject) {
        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            }).on('end', function () {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body.join()
                });
            });
        }).on('error', function (err) {
            debug('http post error', err);
            reject();
        });
        req.write(dString);
        req.end();
    });
}

function httpPut(options) {
    var path = (options.path && typeof options.path === 'string') ? options.path : '/';
    var qString = (options.query && typeof options.query === 'string') ? options.query : querystring.stringify(options.query);
    var dString = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
    var headers = (options.headers && typeof options.headers === 'object') ? options.headers : {};
    headers['Content-Length'] = dString.length;
    headers['Content-Type'] = 'application/json';
    var options = {
        hostname: 'localhost',
        port: 3000,
        path: path + (qString == '' ? '' : ('?' + qString)),
        method: 'PUT',
        headers: headers
    };
    return new Promise(function (resolve, reject) {
        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            }).on('end', function () {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body.join()
                });
            });
        }).on('error', function (err) {
            debug('http post error', err);
            reject();
        });
        req.write(dString);
        req.end();
    });
}

function httpDelete(options) {
    var path = (options.path && typeof options.path === 'string') ? options.path : '/';
    var qString = (options.query && typeof options.query === 'string') ? options.query : querystring.stringify(options.query);
    // var dString = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
    var headers = (options.headers && typeof options.headers === 'object') ? options.headers : {};
    // headers['Content-Length'] = dString.length;
    headers['Content-Type'] = 'application/json';
    var options = {
        hostname: 'localhost',
        port: 3000,
        path: path + (qString == '' ? '' : ('?' + qString)),
        method: 'DELETE',
        headers: headers
    };
    return new Promise(function (resolve, reject) {
        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            }).on('end', function () {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body.join()
                });
            });
        }).on('error', function (err) {
            debug('http post error', err);
            reject();
        });
        // req.write(dString);
        req.end();
    });
}

function socketWriter(s, d) {
    if (s && d) {
        if (typeof d === 'object') {
            s.write(JSON.stringify(d));
        } else {
            s.write(d);
        }
    }
}

module.exports = {
    httpGet: httpGet,
    httpPost: httpPost,
    httpPut: httpPut,
    httpDelete: httpDelete,
    socketWriter: socketWriter
};
