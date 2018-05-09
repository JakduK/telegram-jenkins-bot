class Add {
  async run(context, num) {
    const user = await context.store.findUser(context.user.id);
    const workflow = JSON.parse(user.workflow);
    let job;

    if (workflow.command === '/job') {
      job = workflow.result;
    } else if (workflow.command === '/jobs') {
      const jobs = workflow.result;
      job = jobs[parseInt(num) - 1];
    } else {
      throw new Error(`Workflow command mismatch. command=${workflow.command}`);
    }

    await context.store.addJobBookmark(context.user.id, job);
    await context.store.clearUserWorkflow(context.user.id);
    return job;
  }

  async toTgMessage(context, job) {
    return {
      text: [
        `✅ [${job.name}](${job.url}) 북마크 완료!`,
        '-- '.repeat(24),
        '- 확인 : `/my`'
      ].join('\n'),
      parse_mode: 'Markdown'
    }
  }
}

module.exports = Add;