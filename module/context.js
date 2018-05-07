const Jenkins = require('../lib/jenkins');

class Context {
  constructor({update, config, store, userJenkinsCredentialMap}) {
    this.config = config;
    this.store = store;
    this.userJenkinsCredentialMap = userJenkinsCredentialMap;
    this.update = update;
    this.message = update.message;
    this.chat = update.message ? update.message.chat : null;
    this.callback_query = update.callback_query;
    this.user = (update.message || update.callback_query).from;
    this.jenkins = new Jenkins({url: config.jenkins.url, credential: userJenkinsCredentialMap.get(this.user ? this.user.id : '')});
  }
}

module.exports = Context;