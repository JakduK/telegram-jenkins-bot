class Job {
  async run(context, num) {
    const user = await context.api.store.findUser(context.user.id);
    const lastCommand = user.lastCommand;
    const data = JSON.parse(user.last_command_result);
    const job = data[num - 1];
    return job;
  }

  async toTgMessage(context, job) {
    if (!job) {
      return '';
    }
    return {
      text: [
        '원하시는 작업을 선택하세요.',
        'my에 등록 : `/add`',
        '실행 : `/run`'
      ].join('\n'),
      parse_mode: 'Markdown'
    };
  }
}

module.exports = Job;