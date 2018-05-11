class Rm {
  async run(context, num) {
    const user = await context.store.findUser(context.user.id);
    const workflow = JSON.parse(user.workflow);

    if (workflow.command !== '/my') {    
      throw new Error(`Workflow command mismatch. command=${workflow.command}`);
    }

    const jobs = workflow.result;
    const selectedJobs = num.split(' ')
      .reduce((accum, num) => {
        const job = jobs[parseInt(num) - 1];
        if (job) {
          accum.push(job);
        }
        return accum;
      }, []);

    await Promise.all(selectedJobs.map(job => context.store.removeJobBookmark(context.user.id, job)));

    return selectedJobs;
  }

  async toTgMessage(context, jobs) {
    return {
      text: [
        `✅ 북마크 해제 완료!`,
        '',
        `${jobs.map(job => {
          return `[${job.name}](${job.url})`;
        }).join('\n')}`,
        '',
        '`/my` - 북마크 목록'
      ].join('\n'),
      parse_mode: 'Markdown'
    }
  }
}

module.exports = Rm;