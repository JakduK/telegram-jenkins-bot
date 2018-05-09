const Url = require('url');
const XmlJs = require('xml-js');
const _ = require('lodash');
const HttpClient = require('./httpclient');

class Jenkins {
  constructor(config) {
    this.config = config;
    this.httpclient = new HttpClient({
      url: config.url,
      credential: config.credential
    });
  }

  checkAuth() {
    return this._request('get');
  }

  async findAllJobs(jobName) {
    const res = await this._request('get', {path: '/api/json'});
    const builds = res.responseJson;
    let flatten = await builds.jobs.reduce(async (accum, job) => {
      const coll = await accum;
      if (job._class === 'com.cloudbees.hudson.plugins.folder.Folder') {
        const folder = await this.getJobConfiguration(job.url);
        folder.jobs.forEach(child => {
          child.parent = job;
          coll.push(child)
        });
      } else {
        coll.push(job);
      }
      return coll
    }, Promise.resolve([]));

    flatten = !jobName ? flatten : flatten.filter(job => {
      return job.name.toLowerCase().indexOf(jobName.toLowerCase()) !== -1;
    });

    return flatten.slice(0, 40);
  }

  async getJobConfiguration(jobUrl) {
    const path = Url.parse(jobUrl).pathname;
    const res = await this._request('get', {path: `${path}/api/json`});
    return res.responseJson;
  }

  async runJob(jobUrl, params) {
    const path = Url.parse(jobUrl).pathname.concat(params ? '/buildWithParameters' : '/build');
    await this._request('post', {path: path, body: params});
  }

  async getSuccessBuilds(jobUrl) {
    const path = Url.parse(jobUrl).pathname.concat(`/api/xml?tree=builds[name,displayName,number,url,result]&exclude=*/build[result!=%27SUCCESS%27]`);
    const res = await this._request('post', {path: path});
    const builds = XmlJs.xml2js(res.responseText, {
      compact: true,
      ignoreDeclaration: true,
      ignoreAttributes: true,
      ignoreComment: true
    });
    const rootKey = Object.keys(builds)[0];
    const recent5Builds = (builds[rootKey].build || []).slice(0, 5);

    function transform(elem, key0) {
      if (_.has(elem[key0], '_text')) {
        elem[key0] = elem[key0]._text;
      } else {
        for (const key1 of Object.keys(elem[key0])) {
          transform(elem[key0], key1);
        }
      }
    }

    transform({build: recent5Builds}, 'build');
    return recent5Builds;
  }

  async _issueCrumb() {
    try {
      const res = await this.httpclient.get({path: '/crumbIssuer/api/json'});
      const data = res.responseJson;
      return {
        [data.crumbRequestField]: data.crumb
      };
    } catch (e) {
      return null;
    }
  }

  async _request(method, reqOptions) {
    const csrfHeader = await this._issueCrumb();
    try {
      return await this.httpclient[method](Object.assign({headers: csrfHeader}, reqOptions));
    } catch (err) {
      if (!err.statusCode) {
        err._cause = '❗ 젠킨스 서버 접속장애';
      } else if (err.statusCode === 401 || err.statusCode === 403) {
        err._cause = '❌ 젠킨스 서버 인증오류';
      }
      err._by = 'jenkins';
      throw err;
    }
  }
}

module.exports = Jenkins;