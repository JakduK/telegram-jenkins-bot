const _ = require('lodash');
const HttpClient = require('./httpclient');

class Telegram {
  constructor(config) {
    this.httpclient = new HttpClient({
      url: 'https://api.telegram.org',
      pathPrefix: `/bot${config.token}`
    });
  }

  async getMe() {
    const res = await this._request({path: '/getMe'});
    return res.responseJson;
  }

  async sendMessage(chat_id, message) {
    const res = await this._request({
      path: '/sendMessage',
      body: Object.assign({chat_id}, _.isObject(message) ? message : {text: message, parse_mode: 'Markdown'})
    });
    return res.responseJson;
  }

  async getUpdates(offset) {
    const res = await this._request({
      path: '/getUpdates',
      body: {
        offset
      }
    });
    return res.responseJson;
  }

  async _request(reqOptions) {
    try {
      return await this.httpclient.postJson(reqOptions);
    } catch (err) {
      err._by = 'telegram';
      throw err;
    }
  }
}

module.exports = Telegram;