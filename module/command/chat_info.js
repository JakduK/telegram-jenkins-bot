class ChatInfo {
  constructor() {
    this.permitAll = true;
  }

  async run () {}

  async toTgMessage(context) {
    const user = await context.store.findUser(context.user.id);
    return {
      text: [
        `${user ? `${user.user_name.trim()}님의 ` : '당신의 '} 텔레그래 아아디 : *${context.user.id}*`,
        `현재 대화방 아아디 : *${context.chat.id}*`
      ].join('\n'),
      parse_mode: 'Markdown'
    }
  }
}

module.exports = ChatInfo;