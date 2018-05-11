class Start {
  constructor() {
    this.permitAll = true;
  }

  async run() {}
  
  async toTgMessage() {
    return {
      text: [
        '안녕하세요👋👋👋',
        '/help - 커맨드 도움말 보기'
      ].join('\n')
    };
  }
}

module.exports = Start;