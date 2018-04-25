const c = require('clorox');

const configPath = process.argv[2] || './.config';
const config = require(configPath);
const telegram = require('./lib/telegram')(config.telegram);
const jenkins = require('./lib/jenkins')(config.jenkins);
const store = require('./store')(config.db);

const log = {
  info: str => console.log(`${c.white(str)}`),
  error: str => console.log(`${c.red(str)}`),
  debug: str => console.log(`${c.green(str)}`)
};

start().then(() => {
  log.info(`Start on ${process.pid}`);
  log.info('Bot started.');
});

function loop(offset) {
  next(offset).then(nextOffset => {
    setTimeout(loop.bind(null, nextOffset), 1000);
  });
}

async function start() {
  await store.prepare();
  loop(0);
}

async function next(offset) {
  const res = await telegram.getUpdates(offset);
  if (res.ok && res.result.length) {
    const data = res.result[0];
    log.info(`poll - ${JSON.stringify(data, null, 2)}`);
    const message = data.message;
    const text = message.text;
    const chat_id = message.chat.id;
    const user_id = message.from.id;
    const entities = message.entities;
    if (entities && entities.length) {
      entities.forEach(async entity => {
        if (entity.type === 'bot_command') {
          const textTokens = text.split(' ');
          const cmd = textTokens[0];
          const args = textTokens.slice(1).join('').trim();
          switch (cmd) {
            case '/help':
              break;
            case '/list': {
              const jobs = await store.findJobsByUserId(user_id);
              telegram.sendMessage(chat_id, JSON.stringify(jobs));
              break;
            }

            case '/add':
              await store.addJobForUser({user_id, job: args});
              telegram.sendMessage({chat_id, text: `${args}`});
              break;
            case '/search':
              const jobs = await jenkins.searchJobs(args);
              const splitAndRun = (jobs) => {
                if (!jobs.length) {
                  return;
                }
                telegram.sendMessage(chat_id, jobs.slice(0, 5).reduce((accum, job) => {
                  accum += `- [${job.name}](${job.url})\n`;
                  return accum;
                }, ''));
                splitAndRun(jobs.slice(5, 5));
              };
              splitAndRun(jobs);
              break;
            case '/remove':
              break;
            default:
              break;
          }
        }
      });
    } else if (chat_id < 0) {
      log.info(`throw ${JSON.stringify(data, null, 2)}`);
    } else {
      telegram.sendMessage(chat_id, `echo ${text}`);
    }

    return data.update_id + 1;
  }

  return offset;
}

function terminate() {
  store.close();
  log.info('Bye~');
  process.exit();
}

process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);
