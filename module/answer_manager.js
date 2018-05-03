module.exports = {
  create(context) {
    const user = await context.api.store.findUser(message.from.id);
    const answer = require(`.${user.last_command}`);
    return answer(api, config)(message);
  }
};
