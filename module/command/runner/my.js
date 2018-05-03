module.exports = factory;

function factory(api, config) {
  async function run(message) {
    return await api.store.findAllJobsByUserId(message.from.id); 
  }
  
  function toTgMessage(jobs) {
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

  run.toTgMessage = toTgMessage;
  return run;
}