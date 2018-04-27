const log = require('./logger');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const tableDDL = {
  users: 'create table users (user_name text, user_id num primary key)',
  user_jobs: 'create table user_jobs (user_id num, job text, primary key (user_id, job))'
};

module.exports = function (config) {
  const db = new sqlite3.Database(config.dbPath || path.join(__dirname, '.sqllitedb'));

  function async(method, sql, params) {
    return new Promise(resolve => {
      db[method](sql, params, (err, result) => {
        resolve(err || result);
      });
    });
  }

  return {
    prepare() {
      const promises = [];
      for (let key in tableDDL) {
        promises.push(new Promise(resolve => {
          db.get('select * from sqlite_master where name=$name', {$name: key}, (err, result) => {
            if (!result) {
              log.info(`${name} table not exists.`);
              db.run(tableDDL[key], (err, result) => {
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
    },
    findUser(user_id) {
      return async('all', 'select * from user_jobs where user_id = $user_id', {$user_id: user_id});
    },
    findJobsByUserId(user_id) {
      return async('all', 'select * from user_jobs where user_id = $user_id', {$user_id: user_id});
    },
    findAllJobs(job_name) {
      return async('all', 'select * from user_jobs where job = $job', {$job: job_name});
    },
    addJobForUser(user_id, job) {
      return async('run', 'insert into user_jobs (user_id, job) values ($user_id, $job)', {$user_id: user_id, $job: job});
    },
    close() {
      db.close();
    }
  };
};