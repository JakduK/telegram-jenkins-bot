const _ = require('lodash');
class Run {
  async run(context, num) {
    const user = await context.store.findUser(context.user.id);
    const workflow = JSON.parse(user.workflow);
    let job;

    if (workflow.command === '/job' || workflow.command === '/run') {
      job = workflow.result;
    } else if (workflow.command === '/my' || workflow.command === '/jobs') {
      const jobs = workflow.result;
      job = jobs[parseInt(num) - 1];
    } else {
      throw new Error(`Workflow command mismatch. command=${workflow.command}`);
    }

    const jobJson = await context.jenkins.getJobConfiguration(job.url);
    const jobParams = _.find(jobJson.property, prop => {
      return !_.isEmpty(prop.parameterDefinitions);
    });
    if (jobParams) {
      job.paramters = jobParams.parameterDefinitions;
    }

    if (!job.paramters) {
      await context.jenkins.runJob(job.url);
      job.started = true;
      context.store.clearUserWorkflow(user.user_id);
    } else {
      context.store.saveUserWorkflow(user.user_id, {
        command: '/run',
        args: num,
        result: job
      });
    }

    return job;
  }

  async toTgMessage(context, job) {
    if (job.paramters) {
      const text = [`✅ [${job.name}](${job.url}) 파라미터를 요구합니다.`];
      for (const param of job.paramters) {
        text.push(
          '-- '.repeat(24),
          `- 파라미터 이름 : *${param.name}*`,
          `- 파라미터 타입 : ${param.type}`,
          `- 설명 : ${param.description}`,
        );
        if (param.type === 'RunParameterDefinition') {
          const paramJob = await context.jenkins.getJobConfiguration(`/job/${param.projectName.replace('/', '/job/')}`);
          text.push(
            `- 기본값 : \`${param.defaultParameterValue.jobName || ''}#${param.defaultParameterValue.number || ''}\``,
            '- 택1 :',
            `\`${paramJob.builds.slice(0, 5).map(build => `${param.projectName}#${build.number}`).join('\n')}\``
          );
        } else {
          text.push(`- 기본값 : \`${param.defaultParameterValue.value || ''}\``);
        }
        if (param.type === 'ChoiceParameterDefinition') {
          text.push(
            `- 택1 :`,
            `\`${param.choices.join('\n')}\``
          );
        }
      }
      text.push(
        '-- '.repeat(24),
        '`/submit 파라미터A=value 파라미터B=value 파라미터...`',
        '형식으로 한줄로 입력해주세요. 생략하면 기본값이 적용됩니다.',
        '공백이 포함된 값은 쌍따옴표로 감싸주세요. ex) param="1 2 3"'
      );
      return {
        text:  text.join('\n'),
        parse_mode: 'Markdown'
      }
    } else {
      return {
        text: `${job.started ? '🔵' : '🔴'} [${job.name}](${job.url}) ${job.started ? '시작됨' : '실행실패'}.`,
        parse_mode: 'Markdown'
      }
    }
  }
}

module.exports = Run;