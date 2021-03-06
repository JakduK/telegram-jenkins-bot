const log = require('../lib/logger')('store');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const tableDDL = {
  users: 'create table users (user_id text primary key, user_name text, workflow text, jenkins_ok integer, created_at integer)',
  user_jobs: 'create table user_jobs (user_id text, job_url text, job text, created_at integer, primary key (user_id, job_url))'
};

class Store {
  constructor(config = {}) {
    this.db = new sqlite3.Database(config.dbPath || path.join(process.cwd(), 'local.db'));
  }

  prepare() {
    const promises = [];
    for (let name in tableDDL) {
      promises.push(new Promise((resolve, reject) => {
        this.db.get('select * from sqlite_master where name=$name', {$name: name}, (err, result) => {
          if (err) {
            reject(err);
            log.error(err);
          } else if (result) {
            resolve();
          } else {
            log.info(`${name} table not exists.`);
            this.db.run(tableDDL[name], (err, result) => {
              if (!err) {
                log.info(`${name} table created.`);
                resolve();
              } else {
                log.error(`Failed to create ${name} table.`);
                log.error(err);
                reject(err);
              }
            });
          }
        });
      }));
    }
    return Promise.all(promises);
  }

  findUser(user_id) {
    return this._async('get', 'select * from users where user_id=$user_id', {$user_id: user_id});
  }

  async findAllJobsByUserId(user_id) {
    const raw = await this._async('all', 'select * from user_jobs where user_id=$user_id order by created_at', {
      $user_id: user_id
    });
    return raw.map(userJob => JSON.parse(userJob.job));
  }

  addUser(user_id, user_name) {
    return this._async('run', 'insert into users (user_id, user_name, jenkins_ok, created_at) values ($user_id, $user_name, 1, $created_at)', {
      $user_id: user_id,
      $user_name: user_name,
      $created_at: Date.now()
    });
  }

  addJobBookmark(user_id, job) {
    if (!job || !job.url) {
      throw new Error(`Invalid job object. job=${JSON.stringify(job)}`);
    }
    return this._async('run', `insert into user_jobs (user_id, job_url, job, created_at) values ($user_id, $job_url, $job, $created_at)`, {
      $user_id: user_id,
      $job_url: job.url,
      $job: JSON.stringify(job),
      $created_at: Date.now()
    });
  }

  removeJobBookmark(user_id, job) {
    if (!job || !job.url) {
      throw new Error(`Invalid job object. job=${JSON.stringify(job)}`);
    }
    return this._async('run', 'delete from user_jobs where user_id=$user_id and job_url=$job_url', {
      $user_id: user_id,
      $job_url: job.url
    });
  }

  saveUserWorkflow(user_id, workflow) {
    return this._async('run', 'update users set workflow=$workflow where user_id=$user_id', {
      $user_id: user_id,
      $workflow: JSON.stringify(workflow)
    });
  }

  clearUserWorkflow(user_id) {
    return this._async('run', 'update users set workflow=$workflow where user_id=$user_id', {
      $user_id: user_id,
      $workflow: null
    });
  }

  updateUserJenkinsOk(user_id, ok) {
    return this._async('run', 'update users set jenkins_ok=$ok where user_id=$user_id', {
      $user_id: user_id,
      $ok: ok
    });
  }

  clearUserTransients() {
    return this._async('run', 'update users set jenkins_ok=0, workflow=null');
  }

  close() {
    this.db.close();
  }

  _async(method, sql, params) {
    return new Promise((resolve, reject) => {
      this.db[method](sql, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}

module.exports = Store;