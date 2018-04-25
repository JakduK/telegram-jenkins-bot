const path = require('path');
const c = require('clorox');
const https = require('https');
const http = require('http');
const url = require('url');
const prase = require('co-body');
const qs = require('querystring');
const sqlite3 = require('sqlite3').verbose();
const telegram = require('./lib/telegram')({
    host: 'api.telegram.org',
    token: '579574331:AAGwqJSkP8HJhzMgoICYrw36FSEdyhPov7c'
});
const jenkins = require('./lib/jenkins')({
    host: '10.40.97.67',
    port: '18083',
    credential: 'admin:swfsvcadmin'
});


// 448519433:AAEi1nsk-DRBeRmTuC3ZrtVJRO9UedXOlCo

const db = new sqlite3.Database(path.join(__dirname, '.sqllitedb'));
const tableDDL = {
    users: 'create table users (user_name text, user_id num primary key)',
    user_jobs: 'create table user_jobs (user_id num, job text, primary key (user_id, job))'
};

const log = {
    info: str => console.log(`${c.white(str)}`),
    error: str => console.log(`${c.red(str)}`),
    debug: str => console.log(`${c.green(str)}`)
};

log.info(`Start on ${process.pid}`);

for (let key in tableDDL) {
    prepareDB(tableDDL[key], key);
}

loop(0);

function loop(offset) {
    next(offset).then(offset => {
        setTimeout(() => {
            loop(offset);
        }, 1000);    
    });
}

async function next(offset) {
    const res = await requestTelegram('/getUpdates', {offset});
    if (res.ok && res.result.length) {
        const data = res.result[0];
        log.info(`poll - ${JSON.stringify(data, null, 2)}`);
        const message = data.message;
        const text = message.text;
        const chat_id = message.chat.id;
        const user_id = message.from.id;
        const entities = message.entities;
        if (entities && entities.length) {
            entities.forEach(entity => {
                if (entity.type === 'bot_command') {
                    const textTokens = text.split(' ');
                    const cmd = textTokens[0];
                    const args = textTokens.slice(1).join('').trim();
                    switch (cmd) {
                        case '/help':
                            break;
                        case '/list':
                            store.findJobsByUserId().then(jobs => {
                                telegram.sendMessage(chat_id, JSON.stringify(result));
                            });
                            break;
                        case '/add':
                            db.run('insert into user_jobs (user_id, job) values ($user_id, $job)', {
                                $user_id: user_id, 
                                $job: args
                            }, (err, result) => {
                              requestTelegram('/sendMessage', {chat_id: chat_id, text: `${args}`});
                            });
                            break;
                        case '/search':
                            requestJenkins().then(builds => {
                                const jobs = builds.jobs.filter(job => {
                                    return job.name.toLowerCase().indexOf(args.toLowerCase()) !== -1;
                                });
                                splitAndRun(jobs)
                                function splitAndRun(jobs) {
                                    if (!jobs.length) {
                                        return;
                                    }
                                    requestTelegram('/sendMessage', {
                                        chat_id,
                                        parse_mode: 'Markdown',
                                        text: jobs.slice(0, 5).reduce((accum, job) => {
                                            accum += `- [${job.name}](${job.url})\n`;
                                            return accum;
                                        }, '')
                                    });
                                    splitAndRun(jobs.slice(5, 5));
                                }
                            });
                            break;
                        case '/remove':
                            break;
                        default:
                            break;
                    }
                }
            });
        } else {
            telegram.sendMessage(chat_id, `echo ${text}`);
        }
        
        return data.update_id + 1;
    }

    return offset;
}

function prepareDB(sql, name) {
    db.get('select * from sqlite_master where name=$name', {$name: name}, (err, result) => {
        if (!result) {
            log.info(`${name} table not exists.`);
            db.run(sql, (err, result) => {
                if (!err) {
                    log.info(`${name} table created.`);
                } else {
                    log.error(`Failed to create ${name} table.`);
                    log.error(err);
                }
            });
        }
    });
}

function requestTelegram(path, params) {
    return new Promise(resolve => {
        const paramsSerialized = JSON.stringify(params);
        const options = {
            hostname: telegramHost,
            path: `/bot${telegramToken}${path}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json;charset=utf8',
              'Content-Length': Buffer.byteLength(paramsSerialized)
            }
        };
        const req = https.request(options, async res => {
            const data = await prase.json({req:res});
            resolve(data);
        });

        req.write(paramsSerialized);
        req.end();
    });
}

function requestJenkins(path = '', params) {
    return new Promise(resolve => {
        const paramsSerialized = JSON.stringify(params);
        const options = {
            hostname: jenkinsHost,
            path: `${path}/api/json`,
            auth: jenkinsCredential,
            port: jenkinsPort
        };
        const req = http.request(options, async res => {
            const data = await prase.json({ req: res });
            resolve(data);
        });

        req.end();
    });
}

function terminate() {
    db.close();
    log.info('Bye~');
    process.exit();
}
process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);
