class Job {
  async run(context, num) {
    const user = await context.store.findUser(context.user.id);
    const workflow = JSON.parse(user.workflow);
    const job = workflow.result[parseInt(num) - 1];

    job.by = workflow.command;

    await context.store.saveUserWorkflow(context.user.id, {
      command: '/job',
      args: num,
      result: job
    });
    return job;
  }

  async toTgMessage(context, job) {
    return {
      text: [
        `✅ *${job.name}*`,
        '원하시는 작업을 선택하세요.',
        '- 실행 : `/run`',
        job.by === '/my' ? '- 북마크 해제 : `/rm`' : '- 북마크 : `/add`'
      ].join('\n'),
      parse_mode: 'Markdown'
    };
  }
}

module.exports = Job;