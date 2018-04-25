function telegram(config) {
  const httpclient = require('./httpclient')({
    url: config.url,
    pathPrefix: `/bot${config.token}`
  });

  return {
    sendMessage(chat_id, text) {
      return httpclient.postJson('/sendMessage', {
        chat_id,
        text,
        parse_mode: 'Markdown'
      });
    },
    getUpdates(offset) {
      return httpclient.postJson('/getUpdates', {
        offset
      });
    }
  }
}

module.exports = telegram;