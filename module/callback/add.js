module.exports = Add;
Add.prototype.run = run;

function Run() {}

async function run(context, args) {
  await context.api.store.addJobForUser(context.user.id, args);
  return {
    text: `add ${args} to ${message.from.first_name}\`s list`
  }
}
