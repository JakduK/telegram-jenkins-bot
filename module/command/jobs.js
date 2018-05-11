class Jobs {
  async run(context, keyword) {
    const jobs = await context.jenkins.findAllJobs(keyword);
    await context.store.saveUserWorkflow(context.user.id, {
      command: '/jobs',
      args: keyword,
      result: jobs
    });
    return jobs;
  }

  async toTgMessage(context, jobs) {
    const text = [];

    if (!jobs.length) {
      text.push('🙈 없습니다.');
    } else {
      text.push('🔍 결과는 *40*개까지 표시합니다.', '');
      jobs.forEach((job, index) => {
        text.push(`*${index + 1}.* ${job.parent ? `[${job.parent.name}](${job.parent.url}) ▹ ` : ''}[${job.name}](${job.url})`);
      });
      text.push(
        '',
        '`/run <번호>` - 실행',
        '`/add <번호>` - 북마크'
      );
    }

    return {
      text: text.join('\n'),
      parse_mode: 'Markdown'
    };
  }
}

module.exports = Jobs;