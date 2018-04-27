module.exports = async function (api, message, name) {
  const jobs = await api.jenkins.findAllJobs(name);
  const result = jobs.filter(job => job.name.toLowerCase().indexOf(name.toLowerCase()) !== -1);
  return {
    text: `"*${name}*" search results.`,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: result.map(job => {
        return [{
          text: job.name,
          callback_data: job.url
        }];
      })
    }
  };
}