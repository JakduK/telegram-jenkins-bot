module.exports = telegram;

const _ = require('lodash');

function telegram(config) {
  const httpclient = require('./httpclient')({
    url: config.url,
    pathPrefix: `/bot${config.token}`
  });

  return {
    sendMessage(chat_id, message) {
      return httpclient.postJson({
        path: '/sendMessage', 
        body: Object.assign({chat_id}, _.isObject(message) ? message : {text: message, parse_mode: 'Markdown'})
      });
    },
    getUpdates(offset) {
      return httpclient.postJson({
        path: '/getUpdates', 
        body: {
          offset
        }
      });
    }
  }
}
