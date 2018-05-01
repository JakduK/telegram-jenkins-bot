module.exports = factory;

function factory(api, config) {
  return function (cmd) {
    try {
      return require(`./runner/${cmd}`)(api, config);
    } catch (e) {

    }
  };
}
