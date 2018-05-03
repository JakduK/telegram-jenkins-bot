const log = require('../lib/logger')('command_manager');
const answerManager = require(`./module/answer_manager`);

module.exports = {
  create(cmd) {
    try {
      let command;
      if (/^\/\d+$/.test(cmd)) {
        command = answerManager.create(cmd);
      } else {
        command = require(`./command${cmd}`);
      }
      return new command;
    } catch (e) {
      log.debug(e);
      throw new Error('Invalid command requested.');
    }
  }
};
