class Context {
  constructor(update) {
    this.update = update;
    this.message = update.message;
    this.chat = update.message ? update.message.chat : null;
    this.callback_query = update.callback_query;
    this.user = (update.message || update.callback_query).from;
  }
}

module.exports = Context;