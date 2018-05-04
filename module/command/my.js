class My {
  async run(context) {
    return await context.api.store.findAllJobsByUserId(context.user.id);
  }

  async toTgMessage(context, jobs) {
    return {
      text: jobs.length ? '' : '없습니다.',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: jobs.map(job => {
          return [{
            text: job.name,
            callback_data: job.url
          }];
        })
      }
    };
  }
}

module.exports = My;