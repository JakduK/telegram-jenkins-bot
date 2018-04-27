const configPath = process.argv[2] || './.config';
const config = require(configPath);
const telegram = require('./lib/telegram')(config.telegram);
const jenkins = require('./lib/jenkins')(config.jenkins);
const store = require('./store')(config.db);
const log = require('./logger');
const api = {
  jenkins,
  store
}

process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);

start().then(() => {
  log.info(`Start on ${process.pid}`);
  log.info('Bot started.');
  loop(0);
});

async function next(offset) {
  const res = await telegram.getUpdates(offset);
  if (res.ok && res.result.length) {
    const update = res.result[0];
    
    log.info(`get update from telegram - update_id=${update.update_id}`);

    if (update.message) {
      const message = update.message;
      const entities = message.entities;

      log.info(`\t obtained message - text=${message.text}`);
      log.debug(JSON.stringify(message, null, 2));

      if (entities && entities.length) {
        entities.forEach(async entity => {
          if (entity.type === 'bot_command') {
            const chat_id = message.chat.id;
            const text = message.text;
            const entities = message.entities;
            const textTokens = text.split(' ');
            const cmd = textTokens[0];
            const args = textTokens.slice(1).join('').trim();
            try {
              const command = require(`./command${cmd}`);
              const resultMessage = await command(api, message, args);
              const result = await telegram.sendMessage(chat_id, resultMessage);
              if (!result.ok) {
                log.error(JSON.stringify(result, null, 2));
                telegram.sendMessage(chat_id, '잘못 들었습니다?');
              }
            } catch (e) {
              log.error(e.stack);
              telegram.sendMessage(chat_id, '잘못 들었습니다?');
            }
          }
        });
      }
    } else if (res.result[0].callback_query) {
      const callback_query = res.result[0].callback_query;

      log.info(`\t obtained callback_query - data=${callback_query.data}`);
      log.debug(JSON.stringify(callback_query, null, 2));
    }

    return update.update_id + 1;
  }

  return offset;
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
