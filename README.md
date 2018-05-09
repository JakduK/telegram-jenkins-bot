#Jenkins Bot for Telegram


###Available commands
```
my : Print my job bookmars
jobs - Find jobs (/jobs <keyword or blank>)
job - Select job (/job <number>)
run - Run job (/run <number> or after /job command)
submit - Run job with parameters (after /run command)
add - Add Job bookmark (/add <number> or after /job command)
rm - Remove Job bookmark (/rm <number> or after /job command)
/pass Jenkins Authorization (/pass <your jenkinds_id> <your jenkins_password>)
```

###Config file spec
```
module.exports = {
  telegram: {
    url: 'https://api.telegram.org',
    token: 'token for yours'
  },
  jenkins: {
    url: 'url for yours'
  },
  // optional
  db: {
    dbPath: 'local.db'
  }
};
```

###Start
```
node app.js config.js
```

