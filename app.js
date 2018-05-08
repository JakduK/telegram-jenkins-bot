const _ = require('lodash');
const configPath = process.argv[2] || './config.local.js';
const config = require(configPath);
const HttpClient = require('./lib/httpclient');
const Telegram = require('./lib/telegram');
const Store = require('./module/store');
const log = require('./lib/logger')('main');
const CommandManager = require('./module/command_manager');
const Context = require('./module/context');
const store = new Store(config.db);
const telegram = new Telegram(config.telegram);
const userJenkinsCredentialMap = new Map;

process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);

start().catch(err => {
  log.error(`Failed to startup : ${err}`);
});

async function start() {
  log.info(`Start on ${process.pid}`);

  await store.prepare();
  await store.clearUserTransients();
  log.info('sqlite OK');
  
  await checkServer(config.jenkins.url);
  log.info('Jenkins server OK');
  
  await checkServer(config.telegram.url);
  log.info('Telegram server OK');
  
  loop(0);
  log.info('Jenkins bot started.');
}

async function loop(offset) {
  let nextOffset = offset;
  try {
    nextOffset = await next(offset);
  } catch (err) {
    log.error(errorMessage(err));
  }

  process.nextTick(loop, nextOffset);
}

async function next(offset) {
  const updates = await telegram.getUpdates(offset);
  if (!updates.ok || _.isEmpty(updates.result)) {
    return offset;
  }

  const context = new Context({update: updates.result[0], config, store, userJenkinsCredentialMap});
  const user = await context.store.findUser(context.user.id);

  log.info(`Get update from telegram : update_id=${context.update.update_id}, from=${context.user.id}, user=${user ? user.user_name : 'unknown'}`);

  if (context.message) {
    log.info(`-- message obtained : text=${context.message.text}`);
    log.debug(`-- ${JSON.stringify(context.message, null, 2)}`);

    if (!_.isEmpty(context.message.entities)) {
      context.message.entities.forEach(async entity => {
        if (entity.type === 'bot_command') {
          let cmd = context.message.text.slice(entity.offset, entity.length);
          const args = context.message.text.slice(cmd.length + 1);
          let isMyMessage = true;

          if (context.chat.type === 'group') {
            const botInfo = await telegram.getMe();
            isMyMessage = cmd.indexOf(botInfo.result.username) !== -1;
            if (isMyMessage) {
              cmd = cmd.replace(`@${botInfo.result.username}`, '');
            }
          }

          if (isMyMessage) {
            try {
              const command = CommandManager.create(cmd);

              if (!command.permitAll && (!user || !user.jenkins_ok)) {
                telegram.sendMessage(context.chat.id, ['인증 먼저 해주세요.🔒', '`/pass <jenkins_id> <jenkins_password>`'].join('\n'));
              } else {
                const result = await command.run(context, args);
                const tgReplyMessage = await command.toTgMessage(context, result);
                await telegram.sendMessage(context.chat.id, tgReplyMessage);
              }
            } catch (err) {
              let message;

              if (err._cause) {
                // handled error
                message = err._cause;

                if (err._by === 'jenkins' && (err.statusCode === 401 || err.statusCode === 403)) {
                  context.store.updateUserJenkinsOk(context.user.id, 0);
                }
              } else if (err.req) {
                // something wrong on calling external api
                message = `❗️내부 오류\n\`${err.statusCode} ${err.statusMessage}\``;
              } else {
                // unhandled error
                message = '잘못 들었습니다?🤔';
              }

              log.error(errorMessage(err));
              await telegram.sendMessage(context.chat.id, message);
            }
          }
        }
      });
    }
  }

  return context.update.update_id + 1;
}

async function checkServer(url) {
  try {
    await new HttpClient({url}).get();
  } catch (e) {
    if (!e.req) {
      throw e;
    }
  }
}

function errorMessage(err) {
  return err.stack || `${err.req ? `(${err.statusCode}) ${err.statusMessage}\n${err.req._header}${err.responseText}` : ''}` || err;
}

function terminate() {
  store.close();
  log.info('Bye~');
  process.exit();
}
