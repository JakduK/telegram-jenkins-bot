const path = require('path');
const c = require('clorox');
const https = require('https');
const url = require('url');
const prase = require('co-body');
const qs = require('querystring');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(path.join(__dirname, '.sqllitedb'));
const host = 'api.telegram.org';
const token = '579574331:AAGwqJSkP8HJhzMgoICYrw36FSEdyhPov7c';
// 448519433:AAEi1nsk-DRBeRmTuC3ZrtVJRO9UedXOlCo

const tableDDL = {
    users: 'create table users (user_name text, user_id num primary key)',
    user_jobs: 'create table user_jobs (user_id num, job text) primary key (user_id, job)'
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
    const res = await request('/getUpdates', {offset});
    let nextOffset = offset;
    if (res.ok && res.result.length) {
        const data = res.result[0];
        log.info(`poll - ${JSON.stringify(data, null, 2)}`);
        const message = data.message;
        const text = message.text;
        const chat_id = message.chat.id;
        const user_id = message.from.id;
        const entities = message.entities;
        nextOffset = data.update_id + 1;
        if (entities && entities.length) {
            entities.forEach(entity => {
                if (entity.type === 'bot_command') {
                    const chatArgs = text.split(' ');
                    const cmd = chatArgs[0];
                    const args = chatArgs.slice(1).join('').trim();
                    switch (cmd) {
                        case '/help':
                            break;
                        case '/list':
                            db.all('select * from user_jobs where user_id = $id', {$id: user_id}, (err, result) => {
                                request('/sendMessage', {
                                  chat_id: chat_id, 
                                  text: JSON.stringify(result)
                                });
                            });
                            break;
                        case '/add':
                            db.run('insert into user_jobs (user_id, job) values ($user_id, $job)', {$user_id: user_id, $job: args
                            }, (err, result) => {
                              request('/sendMessage', {chat_id: chat_id, text: `${args}`});
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
            request('/sendMessage', { chat_id: chat_id, text: `echo ${text}` });
        }
    }

    setTimeout(() => {
        loop(nextOffset);
    }, 1000);
}

function prepareDB(sql, name) {
    db.get('select * from sqlite_master where name=$name', { $name: name }, (err, result) => {
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

function request(path, params) {
    const promise = new Promise(resolve => {
        const paramsSerialized = JSON.stringify(params);
        const options = {
            hostname: `${host}`,
            path: `/bot${token}${path}`,
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
    return promise;
}

function terminate() {
    db.close();
    log.info('Bye~');
    process.exit();
}
process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);
