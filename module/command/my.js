class My {
  async run(context) {
    const list = await context.store.findAllJobsByUserId(context.user.id);
    await context.store.saveUserWorkflow(context.user.id, {
      command: '/my',
      args: null,
      result: list
    });
    return list;
  }

  async toTgMessage(context, jobs) {
    const user = await context.store.findUser(context.user.id);
    const text = [];

    if (!jobs.length) {
      text.push('🙈 없습니다.');
    } else {
      text.push(
        `⭐️ *${user.user_name.trim()}*님의 북마크목록`,
        '-- '.repeat(24),
      );
      jobs.forEach((job, index) => text.push(`*${index + 1}.* [${job.name}](${job.url})`));
      text.push(
        '-- '.repeat(24),
        '- 실행 : `/run <번호>`',
        '- 북마크 해제 : `/rm <번호>`'
      );
    }

    return {
      text: text.join('\n'),
      parse_mode: 'Markdown'
    };
  }
}

module.exports = My;