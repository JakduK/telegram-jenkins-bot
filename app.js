const configPath = process.argv[2] || './config.local.js';
const config = require(configPath);
const telegram = require('./lib/telegram')(config.telegram);
const jenkins = require('./lib/jenkins')(config.jenkins);
const store = require('./module/store')(config.db);
const log = require('./lib/logger')('main');
const api = {
  jenkins,
  store
};
const commandFactory = require('./command')(api, config);

process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);

start().then(() => {
  log.info(`Start on ${process.pid}`);
  log.info('Bot started.');
  loop(0);
});

async function next(offset) {
  const tgUpdates = await telegram.getUpdates(offset);
  if (!tgUpdates.ok || !tgUpdates.result.length) {
    return offset;
  }
  
  const tgUpdate = tgUpdates.result[0];
  const tgMessage = getPropFromUpdate(tgUpdate, 'message');
  const tgUser = getPropFromUpdate(tgUpdate, 'from');
  const tgChat = getPropFromUpdate(tgUpdate, 'chat');

  log.info(`Get update from telegram - update_id=${tgUpdate.update_id}, , from=${tgUser.id}`);

  if (tgUpdate.message) {
    const tgEntities = tgMessage.entities;

    log.info(`\tObtained message - text=${tgMessage.text}`);
    log.debug(`\t${JSON.stringify(tgMessage, null, 2)}`);

    if (tgEntities && tgEntities.length) {
      tgEntities.forEach(async entity => {
        if (entity.type === 'bot_command') {
          const textTokens = tgMessage.text.split(' ');
          const cmd = textTokens[0];
          const args = textTokens.slice(1).join('').trim();
          
          try {
            const user = await store.findUser(tgUser.id);
            const command = commandFactory(cmd);
            if (!command.passAuth && !user) {
              telegram.sendMessage(tgChat.id, {
                text: ['님. 인증부터 해주세요.🔒', '`/pass <비밀번호>`'].join('\n'),
                parse_mode: 'Markdown'
              });
            } else {
              const result = await command(tgMessage, args);
              await store.updateUserLastCommand(tgUser.id, cmd, args, JSON.stringify(result));

              const tgReplyMessage = command.toTgMessage ? command.toTgMessage(result) : {text: 'OK'};
              const tgMessageResult = await telegram.sendMessage(tgChat.id, tgReplyMessage);
              if (!tgMessageResult.ok) {
                log.error(JSON.stringify(tgMessageResult, null, 2));
                telegram.sendMessage(tgChat.id, '잘못 들었습니다?');
              }
            }
          } catch (e) {
            log.error(e.stack);
            telegram.sendMessage(tgChat.id, '잘못 들었습니다?');
          }
        }
      });
    }
  } else if (tgUpdate.callback_query) {
    const callback_query = tgUpdate.callback_query;

    log.info(`\tObtained callback_query - data=${callback_query.data}, from=${callback_query.from.id}`);
    log.debug(`\t${JSON.stringify(callback_query, null, 2)}`);
  }

  return tgUpdate.update_id + 1;
}

async function start() {
  await store.prepare();
}

async function loop(offset) {
  const nextOffset = await next(offset);
  setTimeout(loop.bind(null, nextOffset), 500);
}

function getPropFromUpdate(update, key) {
  return update[key] || (update.message || update.callback_query)[key];
}

function terminate() {
  store.close();
  log.info('Bye~');
  process.exit();
}
