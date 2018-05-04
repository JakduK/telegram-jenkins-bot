const _ = require('lodash');
const configPath = process.argv[2] || './config.local.js';
const config = require(configPath);
const Telegram = require('./lib/telegram')(config.telegram);
const Jenkins = require('./lib/jenkins')(config.jenkins);
const Store = require('./module/store')(config.db);
const log = require('./lib/logger')('main');
const CommandManager = require('./module/command_manager');
const AnswerManager = require('./module/answer_manager');
const Context = require('./module/context');

process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);

start().then(() => {
  log.info(`Start on ${process.pid}`);
  log.info('Jenkins bot started.');
  loop(0);
});

async function next(offset) {
  const updates = await Telegram.getUpdates(offset);
  if (!updates.ok || _.isEmpty(updates.result)) {
    return offset;
  }

  const context = new Context(updates.result[0]);
  const user = await Store.findUser(context.user.id);
  context.api = {Jenkins, Store};
  context.config = config;

  log.info(`Get update from telegram - update_id=${context.update.update_id}, from=${context.user.id}`);

  if (context.message) {
    log.info(`-- message obtained - text=${context.message.text}`);
    log.debug(`-- ${JSON.stringify(context.message, null, 2)}`);

    if (!_.isEmpty(context.message.entities)) {
      context.message.entities.forEach(async entity => {
        if (entity.type === 'bot_command') {
          const textTokens = context.message.text.split(' ');
          const cmd = textTokens[0];
          let args = textTokens.slice(1).join('').trim();

          try {
            const command = CommandManager.create(cmd);

            if (!command.permitAll && !user) {
              Telegram.sendMessage(context.chat.id, ['님. 인증부터 해주세요.🔒', '`/pass <비밀번호>`'].join('\n'));
            } else {
              const result = await command.run(context, args);
              const tgReplyMessage = await command.toTgMessage(context, result);
              const tgMessageResult = await Telegram.sendMessage(context.chat.id, tgReplyMessage);

              if (!tgMessageResult.ok) {
                log.error(JSON.stringify(tgMessageResult, null, 2));
                throw new Error(tgMessageResult);
              }
            }
          } catch (e) {
            log.error(e.stack);
            Telegram.sendMessage(context.chat.id, '잘못 들었습니다?🤔');
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
  await Store.prepare();
}

async function loop(offset) {
  const nextOffset = await next(offset);
  setTimeout(loop.bind(null, nextOffset), 500);
}

function terminate() {
  Store.close();
  log.info('Bye~');
  process.exit();
}
