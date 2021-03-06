var Promise = require('native-or-bluebird');
var common_1 = require('./common');
var index_1 = require('./plugins/index');
var get_headers_1 = require('get-headers');
function open(request) {
    return new Promise(function (resolve, reject) {
        var url = request.fullUrl();
        var method = request.method;
        var responseType = request.options.responseType;
        if (window.location.protocol === 'https:' && /^http\:/.test(url)) {
            return reject(request.error("The request to \"" + url + "\" was blocked", 'EBLOCKED'));
        }
        var xhr = request.raw = new XMLHttpRequest();
        xhr.onload = function () {
            return resolve({
                status: xhr.status === 1223 ? 204 : xhr.status,
                headers: get_headers_1.parse(xhr.getAllResponseHeaders()),
                body: responseType ? xhr.response : xhr.responseText,
                url: xhr.responseURL
            });
        };
        xhr.onabort = function () {
            return reject(request.error('Request aborted', 'EABORT'));
        };
        xhr.onerror = function () {
            return reject(request.error("Unable to connect to \"" + request.fullUrl() + "\"", 'EUNAVAILABLE'));
        };
        xhr.onprogress = function (e) {
            if (e.lengthComputable) {
                request.downloadLength = e.total;
            }
            request.downloadedBytes = e.loaded;
        };
        if (method === 'GET' || method === 'HEAD' || !xhr.upload) {
            request.uploadLength = 0;
            request.uploadedBytes = 0;
        }
        else {
            xhr.upload.onprogress = function (e) {
                if (e.lengthComputable) {
                    request.uploadLength = e.total;
                }
                request.uploadedBytes = e.loaded;
            };
        }
        try {
            xhr.open(method, url);
        }
        catch (e) {
            return reject(request.error("Refused to connect to \"" + url + "\"", 'ECSP', e));
        }
        if (request.options.withCredentials) {
            xhr.withCredentials = true;
        }
        if (responseType) {
            try {
                xhr.responseType = responseType;
            }
            finally {
                if (xhr.responseType !== responseType) {
                    throw request.error("Unsupported response type: " + responseType, 'ERESPONSETYPE');
                }
            }
        }
        Object.keys(request.headers).forEach(function (header) {
            xhr.setRequestHeader(request.name(header), request.get(header));
        });
        xhr.send(request.body);
    });
}
function abort(request) {
    request.raw.abort();
}
module.exports = common_1.defaults({
    transport: { open: open, abort: abort, use: index_1.defaults }
});
//# sourceMappingURL=browser.js.map