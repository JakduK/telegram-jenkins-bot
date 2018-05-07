const Path = require('path');
const Http = require('http');
const Https = require('https');
const Qs = require('querystring');
const Url = require('url');
const Parser = require('co-body');
const typeis = require('type-is');

class HttpClient {
  constructor(config) {
    const server = HttpClient._determineProtocol(config.url);
    this.protocol = server.protocol;
    this.host = server.host;
    this.port = server.port;
    this.pathPrefix = config.pathPrefix || '';
    this.credential = config.credential;
  }

  get(options) {
    return this._request(this._createRequestOptions(options));
  }

  post({path, headers, body, query}) {
    const bodySerialized = Qs.encode(body);
    const options = this._createRequestOptions({
      path,
      query,
      method: 'POST',
      headers: Object.assign({}, headers, {
        'content-type': 'application/x-www-form-urlencoded;charset=utf8',
        'content-length': Buffer.byteLength(bodySerialized)
      })
    });
    return this._request(options, bodySerialized);
  }

  postJson({path, headers, body, query}) {
    const bodySerialized = JSON.stringify(body) || '';
    const options = this._createRequestOptions({
      path,
      query,
      method: 'POST',
      headers: Object.assign({}, headers, {
        'content-type': 'application/json;charset=utf8',
        'content-length': Buffer.byteLength(bodySerialized)
      })
    });
    return this._request(options, bodySerialized);
  }

  _createRequestOptions(options) {
    const query = Qs.encode(options.query);
    let path = `${this.pathPrefix}${options.path || ''}`;
    path = path ? Path.normalize(path) : '';
    return Object.assign({}, options, {
      hostname: this.host,
      port: this.port,
      auth: this.credential,
      path: `${path}${query ? `?${query}` : ''}`
    });
  }

  _request(options, body) {
    return new Promise((resolve, reject) => {
      const req = this.protocol.request(options, async res => {
        res.responseText = await Parser.text({req: res});
        if (typeis(res, ['json'])) {
          res.responseJson = JSON.parse(res.responseText);
        }

        if (HttpClient.isSucceed(res.statusCode)) {
          resolve(res);
        } else {
          reject(res);
        }
      });

      if (body) {
        req.write(body);
      }
      req.on('error', reject);
      req.end();
    });
  }

  static isSucceed(statusCode) {
    return statusCode >= 200 && statusCode < 300;
  }

  static _determineProtocol(serverUrl) {
    const urlObj = Url.parse(serverUrl.startsWith('http') ? serverUrl : `http://${serverUrl}`);
    return {
      port: urlObj.port,
      host: urlObj.host,
      protocol: urlObj.protocol === 'https:' || urlObj.port === 443 ? Https : Http
    };
  }
}

module.exports = HttpClient;