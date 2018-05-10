class Help {
  constructor() {
    this.permitAll = true;
  }

  async run() {}

  async toTgMessage() {
    return {
      text: [
        'ℹ️ 도움말',
        '-- '.repeat(24),
        '/my - 내 Job목록',
        '/jobs - Job검색 최대 50개(/jobs <키워드 또는 생략>)',
        '/run - Job실행(/run <번호>)',
        '/submit - 파라미터 전달하여 Job실행(/run커맨드 실행후 가능)',
        '/add - Job북마크(/add <번호>)',
        '/rm - Job북마크 제거(/rm <번호>)',
        '/pass - 인증(/pass <jenkins_id> <jenkinds_password>)',
        '/chat_info - 나와 현재 대화방 아이디 조회',
        '-- '.repeat(24)
      ].join('\n')
    }
  }
}

module.exports = Help;