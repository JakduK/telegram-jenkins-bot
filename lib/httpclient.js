const http = require('http');
const https = require('https');
const qs = require('querystring');
const url = require('url');
const parser = require('co-body');
const typeis = require('type-is');

function httpclient(config) {
  const server = determineProtocol(config.url);
  const protocol = server.protocol;
  const pathPrefix = config.pathPrefix || '';
  const host = server.host;
  const port = server.port;

  function createRequestOptions(options) {
    return Object.assign({}, options, {
      hostname: host,
      port: port,
      auth: config.credential,      
      path: `${pathPrefix}${options.path || ''}?${qs.encode(options.query)}`
    });
  }

  return {
    postJson({path, body, query}) {
      return new Promise(resolve => {
        const bodySerialized = JSON.stringify(body);
        const options = createRequestOptions({
          path,
          query,
          method: 'POST',
          headers: {
            'content-type': 'application/json;charset=utf8',
            'content-length': Buffer.byteLength(bodySerialized)
          }
        });
        const req = protocol.request(options, responseCallback.bind(null, resolve));
        req.write(bodySerialized);
        req.end();
      });
    },
    getJson({path, query}) {
      return new Promise(resolve => {
        protocol.request(createRequestOptions({path, query}), responseCallback.bind(null, resolve)).end();
      });
    },
    get({path, query}) {
      return new Promise(resolve => {
        protocol.request(createRequestOptions({path, query}), responseCallback.bind(null, resolve)).end();
      });
    }
  };
}

async function responseCallback(resolve, res) {
  if (typeis(res, ['json'])) {
    resolve(await parser.json({ req: res }));
  } else if (typeis(res, ['urlencoded'])) {
    resolve(await parser.form({ req: res }));
  } else if (typeis(res, ['text'])) {
    resolve(await parser.text({ req: res }));
  } else {
    // invalid
    var type = res.headers['content-type'] || '';
    var message = type ? 'Unsupported content-type: ' + type : 'Missing content-type';
    var err = new Error(message);
    err.status = 415;
    resolve(err);
  }
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