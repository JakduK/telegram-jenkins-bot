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

    const job = workflow.result;
    const params = KeyValueParser.parse(args);
    job.submitted = params;

    try {
      await context.jenkins.runJob(job.url, params);
      job.started = true;
    } catch (err) {
      log.error(err.req ? `${err.responseText}` : (err.stack || err));
    }

    return job;
  }

  async toTgMessage(context, job) {
    const text = [`${job.started ? '🔵' : '🔴'} [${job.name}](${job.url}) ${job.started ? '시작됨' : '실행실패'}.`];
    if (!_.isEmpty(job.submitted)) {
      text.push(
        '---',
        '파라미터',
        ..._.map(job.submitted, (value, key)  => {
          return `- ${key} : ${value}`;
        })
      );
    }
    return {
      text: text.join('\n'),
      parse_mode: 'Markdown'
    }
  }
}

module.exports = Submit;