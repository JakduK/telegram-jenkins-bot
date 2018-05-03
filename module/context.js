module.exports = factory.bind(factory);

function factory(api, config) {
  this.create = createContext.bind(null, api, config);
  return this;
}

function createContext(api, config, update) {
  return new context(api, config, update);
}

function context(api, config, update) {
  this.update = update;
  this.message = update.message;
  this.chat = update.message ? update.message.chat : null;
  this.callback_query = update.callback_query;
  this.user = (update.message || update.callback_query).from;
}
