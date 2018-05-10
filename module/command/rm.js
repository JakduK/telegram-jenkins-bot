class Rm {
  async run(context, num) {
    const user = await context.store.findUser(context.user.id);
    const workflow = JSON.parse(user.workflow);

    if (workflow.command !== '/my') {    
      throw new Error(`Workflow command mismatch. command=${workflow.command}`);
    }

    const jobs = workflow.result;
    const job = jobs[parseInt(num) - 1];

    await context.store.removeJobBookmark(context.user.id, job);

    return job;
  }

  async toTgMessage(context, job) {
    return {
      text: [
        `✅ [${job.name}](${job.url}) 북마크 해제 완료!`,
        '-- '.repeat(24),
        '- 확인 : `/my`'
      ].join('\n'),
      parse_mode: 'Markdown'
    }
  }
}

module.exports = Rm;