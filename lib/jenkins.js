function jenkins (config) {
  const httpclient = require('./httpclient')({
    url: config.url,
    credential: config.credential
  });
  return {
    async searchJobs(jobName) {
      const builds = await httpclient.getJson();
      return builds.jobs.filter(job => {
        return job.name.toLowerCase().indexOf(jobName.toLowerCase()) !== -1;
      });
    }
  }
}

module.exports = jenkins;