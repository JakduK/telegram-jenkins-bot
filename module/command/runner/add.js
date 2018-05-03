module.exports = factory;

function factory(api, config) {
  async function run(message, args) {
    await store.addJobForUser(message.from.id, args);
    return {
      text: `add ${args} to ${message.from.first_name}\`s list`
    }
  }
  return run;
}
