var http_1 = require('http');
var https_1 = require('https');
var agent = require('infinity-agent');
var through2 = require('through2');
var urlLib = require('url');
var extend = require('xtend');
var get_headers_1 = require('get-headers');
var Promise = require('native-or-bluebird');
var arrify = require('arrify');
var common_1 = require('./common');
var index_1 = require('./plugins/index');
var REDIRECT_TYPE;
(function (REDIRECT_TYPE) {
    REDIRECT_TYPE[REDIRECT_TYPE["FOLLOW_WITH_GET"] = 0] = "FOLLOW_WITH_GET";
    REDIRECT_TYPE[REDIRECT_TYPE["FOLLOW_WITH_CONFIRMATION"] = 1] = "FOLLOW_WITH_CONFIRMATION";
})(REDIRECT_TYPE || (REDIRECT_TYPE = {}));
var REDIRECT_STATUS = {
    '300': REDIRECT_TYPE.FOLLOW_WITH_GET,
    '301': REDIRECT_TYPE.FOLLOW_WITH_GET,
    '302': REDIRECT_TYPE.FOLLOW_WITH_GET,
    '303': REDIRECT_TYPE.FOLLOW_WITH_GET,
    '305': REDIRECT_TYPE.FOLLOW_WITH_GET,
    '307': REDIRECT_TYPE.FOLLOW_WITH_CONFIRMATION,
    '308': REDIRECT_TYPE.FOLLOW_WITH_CONFIRMATION
};
function getCookieJar(request) {
    return new Promise(function (resolve, reject) {
        if (!request.options.jar) {
            return resolve();
        }
        request.options.jar.getCookies(request.url, function (err, cookies) {
            if (err) {
                return reject(err);
            }
            if (cookies.length) {
                request.append('Cookie', cookies.join('; '));
            }
            return resolve();
        });
    });
}
function setCookieJar(message, request) {
    return new Promise(function (resolve, reject) {
        if (!request.options.jar) {
            return resolve();
        }
        var cookies = arrify(message.headers['set-cookie']);
        if (!cookies.length) {
            return resolve();
        }
        var setCookies = cookies.map(function (cookie) {
            return new Promise(function (resolve, reject) {
                request.options.jar.setCookie(cookie, request.url, function (err) {
                    return err ? reject(err) : resolve();
                });
            });
        });
        return resolve(Promise.all(setCookies));
    });
}
function open(request) {
    return new Promise(function (resolve, reject) {
        var maxRedirects = num(request.options.maxRedirects, 5);
        var followRedirects = request.options.followRedirects !== false;
        var requestCount = 0;
        var confirmRedirect = typeof request.options.followRedirects === 'function' ?
            request.options.followRedirects : falsey;
        var requestProxy = through2(function (chunk, enc, cb) {
            request.uploadedBytes = request.uploadedBytes + chunk.length;
            this.push(chunk);
            cb();
        }, function (cb) {
            request.uploadedBytes = request.uploadLength;
            cb();
        });
        var responseProxy = through2(function (chunk, enc, cb) {
            request.downloadedBytes = request.downloadedBytes + chunk.length;
            this.push(chunk);
            cb();
        }, function (cb) {
            request.downloadedBytes = request.downloadLength;
            cb();
        });
        function get(url, opts, body) {
            return getCookieJar(request)
                .then(function () {
                if (requestCount++ > maxRedirects) {
                    reject(request.error("Exceeded maximum of " + maxRedirects + " redirects", 'EMAXREDIRECTS'));
                    return;
                }
                var arg = extend(urlLib.parse(url), opts);
                var isHttp = arg.protocol !== 'https:';
                var engine = isHttp ? http_1.request : https_1.request;
                arg.agent = request.options.agent || (isHttp ? agent.http.globalAgent : agent.https.globalAgent);
                arg.rejectUnauthorized = request.options.rejectUnauthorized !== false;
                arg.headers = request.get();
                var req = engine(arg);
                req.once('response', function (res) {
                    var status = res.statusCode;
                    var redirect = REDIRECT_STATUS[status];
                    setCookieJar(res, request)
                        .then(function () {
                        if (followRedirects && redirect != null && res.headers.location) {
                            var newUrl = urlLib.resolve(url, res.headers.location);
                            res.resume();
                            if (redirect === REDIRECT_TYPE.FOLLOW_WITH_GET) {
                                get(newUrl, { method: 'GET' });
                                return;
                            }
                            if (redirect === REDIRECT_TYPE.FOLLOW_WITH_CONFIRMATION) {
                                if (arg.method === 'GET' || arg.method === 'HEAD') {
                                    get(newUrl, opts, body);
                                    return;
                                }
                                if (confirmRedirect(req, res)) {
                                    get(newUrl, opts, body);
                                    return;
                                }
                            }
                        }
                        request.downloadLength = num(res.headers['content-length'], 0);
                        res.pipe(responseProxy);
                        return resolve({
                            body: responseProxy,
                            status: status,
                            headers: get_headers_1.http(res),
                            url: url
                        });
                    })
                        .catch(function (e) {
                        console.log(e);
                        throw e;
                    });
                });
                req.once('abort', function () {
                    return reject(request.error('Request aborted', 'EABORT'));
                });
                req.once('error', function (error) {
                    return reject(request.error("Unable to connect to \"" + url + "\"", 'EUNAVAILABLE', error));
                });
                requestProxy.once('error', reject);
                request.raw = req;
                request.uploadLength = num(req.getHeader('content-length'), 0);
                requestProxy.pipe(req);
                if (body) {
                    if (typeof body.pipe === 'function') {
                        body.pipe(requestProxy);
                    }
                    else {
                        requestProxy.end(body);
                    }
                }
                else {
                    requestProxy.end();
                }
            });
        }
        get(request.fullUrl(), {
            method: request.method
        }, request.body);
    });
}
function abort(request) {
    request.raw.abort();
}
function num(value, fallback) {
    if (value == null) {
        return fallback;
    }
    return isNaN(value) ? fallback : Number(value);
}
function falsey() {
    return false;
}
module.exports = common_1.defaults({
    transport: { open: open, abort: abort, use: index_1.defaults }
});
//# sourceMappingURL=index.js.map