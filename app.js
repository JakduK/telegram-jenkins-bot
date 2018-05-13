const _ = require('lodash');
const configPath = process.argv[2] || './config.local.js';
const config = require(configPath);
const telegram = require('./lib/telegram')(config.telegram);
const jenkins = require('./lib/jenkins')(config.jenkins);
const store = require('./module/store')(config.db);
const log = require('./lib/logger')('main');
const api = {jenkins, store};
const commandManager = require('./module/command_manager');
const contextFactory = require('./module/context_factory');

process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);

start().then(() => {
  log.info(`Start on ${process.pid}`);
  log.info('Bot started.');
  loop(0);
});

async function next(offset) {
  const updates = await telegram.getUpdates(offset);
  if (!updates.ok || _.isEmpty(updates.result)) {
    return offset;
  }

  const context = contextFactory.create(updates.result[0]);
  const user = await store.findUser(context.user.id);
  context.api = api;
  context.api = api;
  context.config = config;

  log.info(`Get update from telegram - update_id=${context.update.update_id}, , from=${context.user.id}`);

  if (context.message) {
    log.info(`-- message obtained - text=${context.message.text}`);
    log.debug(`-- ${JSON.stringify(context.message, null, 2)}`);

    if (!_.isEmpty(context.message.entities)) {
      context.message.entities.forEach(async entity => {
        if (entity.type === 'bot_command') {
          const textTokens = context.message.text.split(' ');
          const cmd = textTokens[0];
          const args = textTokens.slice(1).join('').trim();

          try {
            const command = commandManager.create(cmd);

            if (!command.permitAll && !user) {
              telegram.sendMessage(context.chat.id, ['님. 인증부터 해주세요.🔒', '`/pass <비밀번호>`'].join('\n'));
            } else {
              const result = await command.run(context, args);

              if (command.hasNext) {
                await store.updateUserLastCommand(context.user.id, cmd, args, JSON.stringify(result));
              }

              const tgReplyMessage = command.toTgMessage(result);
              const tgMessageResult = await telegram.sendMessage(context.chat.id, tgReplyMessage);

              if (!tgMessageResult.ok) {
                log.error(JSON.stringify(tgMessageResult, null, 2));
                telegram.sendMessage(context.chat.id, '잘못 들었습니다?');
              }
            }
          } catch (e) {
            log.error(e.stack);
            telegram.sendMessage(context.chat.id, '잘못 들었습니다?');
          }
        }
      });
    }
  } else if (context.callback_query) {
    const callback_query = context.callback_query;

    log.info(`-- callback_query obtained - data=${callback_query.data}, from=${callback_query.from.id}`);
    log.debug(`-- ${JSON.stringify(callback_query, null, 2)}`);
  }

  return context.update.update_id + 1;
}

async function start() {
  await store.prepare();
}

async function loop(offset) {
  const nextOffset = await next(offset);
  setTimeout(loop.bind(null, nextOffset), 500);
}

function terminate() {
  store.close();
  log.info('Bye~');
  process.exit();
}
