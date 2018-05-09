const Jenkins = require('../../lib/jenkins');

class Pass {
  constructor() {
    this.permitAll = true;
  }

  async run(context, args) {
    const user = await context.store.findUser(context.user.id);
    const sepIndex = args.indexOf(' ');
    const id = args.slice(0, sepIndex);
    const password = args.slice(sepIndex + 1);
    const credential = `${id}:${password}`;

    try {
      await new Jenkins({config: context.config, url: context.config.jenkins.url, credential}).checkAuth();
      if (!user) {
        await context.store.addUser(context.user.id, Pass._getUserName(context.user));
      } else {
        await context.store.updateUserJenkinsOk(context.user.id, true);
      }
      context.userJenkinsCredentialMap.set(context.user.id, credential);
    } catch (e) {}

    return await context.store.findUser(context.user.id);
  }

  async toTgMessage(context, user) {
    return {
      text: user && user.jenkins_ok ? '인증완료.🎯' : '땡! 틀렸습니다.🙊'
    };
  }

  static _getUserName(user) {
    return `${user.username || `${user.first_name || ''} ${user.last_name || ''}`}`;
  }
}

module.exports = Pass;