function telegram(config) {
  const httpclient = require('./httpclient')({
    url: config.url,
    pathPrefix: `/bot${config.token}`
  });

  return {
    sendMessage(chat_id, message) {
      return httpclient.postJson({
        path: '/sendMessage', 
        body: Object.assign({chat_id}, message)
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

module.exports = telegram;