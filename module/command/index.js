module.exports = factory;

const log = require('../../lib/logger')('command factory');

function factory(api, config) {
  const instance = function (cmd) {
    try {
      let command;
      if (/^\/\d+$/.test(cmd)) {
        command = require(`./answer`)(cmd);
      } else {
        command = require(`./runner/${cmd}`);
      }
      return command(api, config);
    } catch (e) {
      throw new Error('Invalid command requested.');
    }
  };

  return instance;
}
