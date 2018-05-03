module.exports = Jobs;
Jobs.prototype.toTgMessage = toTgMessage;
Jobs.prototype.run = run;

function Jobs() {
  this.hasNext = true;
}

async function run(context, name) {
  const jobs = await context.api.jenkins.findAllJobs(name);
  return jobs.filter(job => job.name.toLowerCase().indexOf(name.toLowerCase()) !== -1).slice(0, 20);
}

function toTgMessage(jobs) {
  return {
    text: ['결과 개수는 20개로 제한됩니다.', '`/번호` 를 클릭하거나 번호를 커맨드(`/번호`) 방식으로 입력해주세요'].concat(jobs.map((job, index) => {
      return `/${index + 1} - [${job.name}](${job.url})`
    })).join('\n'),
    parse_mode: 'Markdown'
  };
}
