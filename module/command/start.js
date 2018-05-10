class Start {
  constructor() {
    this.permitAll = true;
  }

  async run() {}
  
  async toTgMessage(context) {
    return {
      text: [
        '안녕하세요',
        '-- '.repeat(24),
        '/help - 커맨드 도움말 보기',
        '-- '.repeat(24)
      ].join('\n')
    };
  }
}

module.exports = Start;