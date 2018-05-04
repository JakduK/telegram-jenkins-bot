const log = require('../lib/logger')('command_manager');

class CommandManager {
  static create(cmd) {
    try {
      const command = require(`./command${cmd}`);
      return new command;
    } catch (e) {
      log.debug(e);
      throw new Error('Invalid command requested.');
    }
  }
}

module.exports = CommandManager;
