const _ = require('lodash');

class Run {
  async run(context, num) {
    const user = await context.store.findUser(context.user.id);
    const workflow = JSON.parse(user.workflow);
    let selectedJob;

    if (workflow.command === '/run') {
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
        ? `🔵 [${job.name}#${job.nextBuildNumber}](${job.url}${job.nextBuildNumber}) 시작됐습니다.`
        : `🔴 [${job.name}](${job.url}) 요청중 오류로 실행하지 못했습니다.`
      );
    } else {
      text.push(`✅ [${job.name}](${job.url}) 파라미터가 필요합니다.`);

      for (const param of jobParams.parameterDefinitions) {
        text.push(
          '',
          `파라미터 - *${param.name}*`,
          `파라미터 타입 - \`${param.type}\``,
          `설명 - \`${param.description}\``,
        );

        if (param.type === 'RunParameterDefinition') {
          const buildDetailsList = await context.jenkins.getSuccessBuilds(`/job/${param.projectName.replace('/', '/job/')}`);
          const defaultBuild = _.find(buildDetailsList, build => build.number === param.defaultParameterValue.number) || {};

          text.push(
            `기본값 - \`${param.projectName}#${defaultBuild.number}\` */* \`${defaultBuild.displayName}\``,
            '택1 -',
            `${buildDetailsList.map(build => {
              return `\`${param.projectName}#${build.number}\` */* \`${build.displayName}\``;
            }).join('\n')}`,
            '⚠️주의 - 위 기본값과 택1은 "`foo` */* `bar`" 형식입니다.',
            '"`foo`" 부분만 전달하세요.',
            '"`bar`" 부분은 값을 설명하는 텍스트입니다.',
            '`ex) param=foo`'
          );
        } else {
          text.push(`기본값 - \`${param.defaultParameterValue.value}\``);
        }

        if (param.type === 'ChoiceParameterDefinition') {
          text.push(
            `택1 -`,
            `\`${param.choices.join('\n')}\``
          );
        }
      }

      text.push(
        '',
        '`/submit` 커맨드로 파라미터를 전달하여 실행하세요.',
        '생략한 파라미터는 기본값이 적용됩니다.',
        '`ex) /submit param1=value param2=value param...`',
        '공백이 포함된 값은 따옴표로 감싸주세요.',
        '`ex) param1="1 2 3" param2=\'1 2 3\'`'
      );
    }

    return {
      text: text.join('\n'),
      parse_mode: 'Markdown'
    };
  }
}

module.exports = Run;