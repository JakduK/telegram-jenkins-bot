const Jenkins = require('../lib/jenkins');

class Context {
  constructor({update, config, store, userJenkinsCredentialMap}) {
    this.config = config;
    this.store = store;
    this.userJenkinsCredentialMap = userJenkinsCredentialMap;
    this.update = update;
    this.message = update.message || update.edited_message;
    this.message.edited = !!update.edited_message;
    this.chat = this.message ? this.message.chat : null;
    this.user = this.message.from;
    this.jenkins = new Jenkins({
      url: this.config.jenkins.url,
      credential: this.userJenkinsCredentialMap.get(this.user ? this.user.id : '')
    });
  }
}

module.exports = Context;