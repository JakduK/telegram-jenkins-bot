module.exports = async function (api, message) {
  const jobs = await api.store.findJobsByUserId(message.from.id);
  return {
    text: jobs
  };
}