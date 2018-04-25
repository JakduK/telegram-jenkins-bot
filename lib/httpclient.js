const http = require('http');
const https = require('https');
const qs = require('querystring');
const url = require('url');
const parse = require('co-body');

function httpclient(config) {
  const server = determineProtocol(config.url);
  const protocol = server.protocol;
  const pathPrefix = config.pathPrefix || '';
  const host = `${config.credential ? config.credential + '@' : ''}${server.host}`;
  const port = server.port;

  function createRequestOptions(options) {
    return Object.assign({}, options, {
      hostname: host,
      port: port,
      path: `${pathPrefix}${options.path}?${qs.encode(options.query)}`
    });
  }

  return {
    postJson(path, body, query) {
      return new Promise(resolve => {
        const bodySerialized = JSON.stringify(body);
        const options = createRequestOptions({
          path,
          query,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=utf8',
            'Content-Length': Buffer.byteLength(bodySerialized)
          }
        });
        const req = protocol.request(options, async res => {
          const data = await parse.json({req: res});
          resolve(data);
        });
        req.write(bodySerialized);
        req.end();
      });
    },
    getJson(path, query) {
      return new Promise(resolve => {
        const req = protocol.request({path, query}, async res => {
          const data = await parse.json({req: res});
          resolve(data);
        });
        req.end();
      });
    },
    get(path, query) {
      return new Promise(resolve => {
        const req = server.protocol.request({path, query}, async res => {
          const data = await parse({req: res});
          resolve(data);
        });
        req.end();
      });
    }
  };
}

function determineProtocol(serverUrl) {
  const urlObj = url.parse(serverUrl.startsWith('http') ? serverUrl : `http://${serverUrl}`);
  return {
    port: urlObj.port,
    host: urlObj.host,
    protocol: urlObj.protocol === 'https:' || urlObj.port === 443 ? https : http
  };
}

module.exports = httpclient;