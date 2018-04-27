module.exports = async function (api, message, args) {
  await store.addJobForUser(message.from.id, args);
  return {
    text: `add ${args} to ${message.from.first_name}\`s list`
  }
}