const log = require('../lib/logger')('answer_manager');

class AnswerManager {
  static create(cmd) {
    try {
      const answer = require(`./answer${cmd}`);
      return new answer;
    } catch (e) {
      log.debug(e);
      throw new Error('Invalid answer received.');
    }
  }
}

module.exports = AnswerManager;
