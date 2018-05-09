const _ = require('lodash');
const log = require('../../lib/logger')('Command:Submit');
const KeyValueParser = require('../../lib/keyvalue_parser');

class Submit {
  async run(context, args) {
    const user = await context.store.findUser(context.user.id);
    const workflow = JSON.parse(user.workflow);

    if (workflow.command !== '/run') {
      throw new Error(`Workflow command mismatch. command=${workflow.command}`);
    }

    const selectedJob = workflow.result;
    const jobDetails = await context.jenkins.getJobConfiguration(selectedJob.url);
    const inputParams = KeyValueParser.parse(args);
    jobDetails.submitted = inputParams;

    try {
      await context.jenkins.runJob(jobDetails.url, inputParams);
      jobDetails.started = true;
    } catch (err) {
      log.error(err.req ? `${err.responseText}` : (err.stack || err));
    }

    return jobDetails;
  }

  async toTgMessage(context, job) {
    const text = [
      job.started
      ? `🔵 [${job.name}#${job.nextBuildNumber}](${job.url}${job.nextBuildNumber}) 시작됐습니다.`
      : `🔴 [${job.name}](${job.url}) 요청중 오류로 실행하지 못했습니다.`
    ];

    if (!_.isEmpty(job.submitted)) {
      text.push(
        '-- '.repeat(24),
        '전달 파라미터',
        '-- '.repeat(24),
        ..._.map(job.submitted, (value, key)  => {
          return `- \`${key} : ${value}\``;
        }),
        '-- '.repeat(24)
      );
    }

    return {
      text: text.join('\n'),
      parse_mode: 'Markdown'
    }
  }
}

module.exports = Submit;