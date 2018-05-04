class Jobs {
  async run(context, name) {
    const jobs = await context.api.jenkins.findAllJobs(name);
    const matched = jobs.filter(job => job.name.toLowerCase().indexOf(name.toLowerCase()) !== -1).slice(0, 20);

    await context.api.store.saveUserWorkflow(context.user.id, {
      command: '/jobs',
      args: name,
      result: matched
    });

    return matched;
  }

  async toTgMessage(context, jobs) {
    return {
      text: [
        '결과 개수는 2️⃣0️⃣개로 제한됩니다.',
        '선택방법 : `/job <번호>`'
      ].concat(jobs.map((job, index) => {
        return `*${index + 1}.* [${job.name}](${job.url})`
      })).join('\n'),
      parse_mode: 'Markdown'
    };
  }
}

module.exports = Jobs;