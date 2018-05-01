function jenkins (config) {
  const httpclient = require('./httpclient')({
    url: config.url,
    credential: config.credential
  });
  return {
    async findAllJobs(jobName) {
      const builds = await httpclient.get({path: '/api/json'});
      return builds.jobs.filter(job => {
        return job.name.toLowerCase().indexOf(jobName.toLowerCase()) !== -1;
      });
    }
  }
}

module.exports = jenkins;