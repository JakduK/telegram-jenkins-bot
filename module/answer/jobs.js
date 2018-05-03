module.exports = factory;

function factory(api, config) {
  async function jobs(message) {
    const user = await api.store.findUser(message.from.id);
    const data = JSON.parse(user.last_command_result);
    const num = parseInt(message.text.replace(/\D/g, ''));
    const job = data[num - 1];
    return job;
  }

  function toTgMessage(job) {
    return {
      text: job
    };
  }

  jobs.toTgMessage = toTgMessage;
  return jobs;
}