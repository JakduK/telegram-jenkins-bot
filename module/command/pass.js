class Pass {
  constructor() {
    this.permitAll = true;
  }

  async run(context, password) {
    const user = await context.api.store.findUser(context.user.id);

    if (user) {
      user.passed = true;
      return user;
    }

    if (context.config.password !== password) {
      return;
    }

    await context.api.store.addUser(context.user.id, _getUserName(context.user));
    return await context.api.store.findUser(context.user.id);
  }

  async toTgMessage(context, user) {
    return {
      text: user ? user.passed ? '이미 인증하셨습니다.' : '인증완료.🎯' : '땡! 틀렸습니다.😜'
    };
  }

  _getUserName(user) {
    return `${user.username || `${user.first_name || ''} ${user.last_name || ''}`}`;
  }
}

module.exports = Pass;