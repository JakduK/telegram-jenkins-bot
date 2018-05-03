module.exports = factory;

function factory(api, config) {
  async function run(message, password) {
    const tgUser = message.from;
    const user = await api.store.findUser(tgUser.id);
    
    if (user) {
      user.passed = true;
      return user;
    }
    
    if (config.password !== password) {
      return;
    }
    
    await api.store.addUser(tgUser.id, getUserName(tgUser));
    return await api.store.findUser(tgUser.id);
  }

  function toTgMessage(user) {
    return {
      text: user ? user.passed ? '이미 인증하셨습니다.' : '인증완료.🎯' : '땡! 틀렸습니다.😜'
    };
  }

  run.passAuth = true;
  run.toTgMessage = toTgMessage;
  return run;
}

function getUserName(user) {
  return `${user.username || `${user.first_name||''} ${user.last_name||''}`}`;
}