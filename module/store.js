module.exports = store;

const log = require('../lib/logger')('store');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const tableDDL = {
  users: 'create table users (user_id num primary key, user_name text, workflow text)',
  user_jobs: 'create table user_jobs (user_id num, job text, primary key (user_id, job))'
};

function store(config) {
  const db = new sqlite3.Database(config.dbPath || path.join(process.cwd(), 'local.db'));

  function async(method, sql, params) {
    return new Promise(resolve => {
      db[method](sql, params, (err, result) => {
        resolve(err || result);
      });
    });
  }

  return {
    findUser(user_id) {
      return async('get', 'select * from users where user_id=$user_id', {$user_id: user_id});
    },
    findAllJobsByUserId(user_id) {
      return async('all', 'select * from user_jobs where user_id=$user_id', {$user_id: user_id});
    },
    findAllJobs(job_name) {
      return async('all', 'select * from user_jobs where job=$job', {$job: job_name});
    },
    addUser(user_id, user_name) {
      return async('run', 'insert into users (user_id, user_name) values ($user_id, $user_name)', {
        $user_id: user_id,
        $user_name: user_name
      });
    },
    addJobForUser(user_id, job) {
      return async('run', 'insert into user_jobs (user_id, job) values ($user_id, $job)', {$user_id: user_id, $job: job});
    },
    saveUserWorkflow(user_id, workflow) {
      return async('run', 'update users set workflow=$workflow where user_id=$user_id', {
        $user_id: user_id,
        $workflow: JSON.stringify(workflow)
      })
    },
    close() {
      db.close();
    },
    prepare() {
      const promises = [];
      for (let name in tableDDL) {
        promises.push(new Promise(resolve => {
          db.get('select * from sqlite_master where name=$name', {$name: name}, (err, result) => {
            if (!result) {
              log.info(`${name} table not exists.`);
              db.run(tableDDL[name], (err, result) => {
                if (!err) {
                  log.info(`${name} table created.`);
                } else {
                  log.error(`Failed to create ${name} table.`);
                  log.error(err);
                }
                resolve();
              });
            } else {
              resolve();
            }
          });
        }));
      }
      return Promise.all(promises);
    }
  };
}