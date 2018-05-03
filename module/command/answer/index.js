module.exports = answerFactory;

function answerFactory(cmd) {
  return function (api, config) {
    const router = answerRouter.bind(null, cmd, api, config);
    router.isAnswer = true;
    return router;
  };
}

async function answerRouter(cmd, api, config, message) {
  const user = await api.store.findUser(message.from.id);
  const answer = require(`.${user.last_command}`);
  return answer(api, config)(message);
}