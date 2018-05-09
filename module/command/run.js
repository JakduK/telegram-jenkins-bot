const _ = require('lodash');
class Run {
  async run(context, num) {
    const user = await context.store.findUser(context.user.id);
    const workflow = JSON.parse(user.workflow);
    let selectedJob;

    if (workflow.command === '/job' || workflow.command === '/run') {
      selectedJob = workflow.result;
    } else if (workflow.command === '/my' || workflow.command === '/jobs') {
      const jobs = workflow.result;
      selectedJob = jobs[parseInt(num) - 1];
    } else {
      throw new Error(`Workflow command mismatch. command=${workflow.command}`);
    }

    const jobDetails = await context.jenkins.getJobConfiguration(selectedJob.url);
    const hasParam = _.find(jobDetails.property, prop => {
      return !_.isEmpty(prop.parameterDefinitions);
    });

    if (hasParam) {
      context.store.saveUserWorkflow(user.user_id, {
        command: '/run',
        args: num,
        result: jobDetails
      });
    } else {
      await context.jenkins.runJob(selectedJob.url);
      jobDetails.started = true;
      context.store.clearUserWorkflow(user.user_id);
    }

    return jobDetails;
  }

  async toTgMessage(context, job) {
    const jobParams = _.find(job.property, prop => {
      return !_.isEmpty(prop.parameterDefinitions);
    });
    const text = [];

    if (!jobParams) { 
      text.push(
        job.started
        ? `🔵 [${job.name}#${job.nextBuildNumber}](${job.url}/${job.nextBuildNumber}) 시작됐습니다.`
        : `🔴 [${job.name}](${job.url}) 요청중 오류로 실행하지 못했습니다.`
      );
    } else {
      text.push(`✅ [${job.name}](${job.url}) 파라미터를 요구합니다.`);

      for (const param of jobParams.parameterDefinitions) {
        text.push(
          '-- '.repeat(24),
          `- 파라미터 이름 : \`${param.name}\``,
          `- 파라미터 타입 : \`${param.type}\``,
          `- 설명 : \`${param.description}\``,
        );

        if (param.type === 'RunParameterDefinition') {
          const recentBuilds = job.builds.slice(0, 5);
          const buildDetailsList = await Promise.all(recentBuilds.map(async build => {
            return context.jenkins.getJobConfiguration(build.url);
          }));

          text.push(
            `- 기본값 : \`${param.defaultParameterValue.jobName || ''}#${param.defaultParameterValue.number || ''}\``,
            '- 택1 :',
            `\`${buildDetailsList.map(build => `${build.displayName}#${build.number}`).join('\n')}\``
          );
        } else {
          text.push(`- 기본값 : \`${param.defaultParameterValue.value}\``);
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
        '위형식으로 한줄로 입력해주세요. 생략하면 기본값이 적용됩니다.',
        '공백이 포함된 값은 따옴표로 감싸주세요.',
        'ex) paramA="1 2 3" paramB=\'1 2 3\''
      );
    }

    return {
      text: text.join('\n'),
      parse_mode: 'Markdown'
    };
  }
}

module.exports = Run;