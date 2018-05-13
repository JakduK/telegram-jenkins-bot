# Telegram Jenkins Bot for self hosting


### Available commands
```
my : Print my job bookmars
jobs : Find Jobs (/jobs <keyword or blank>)
run : Run Job (/run <number>)
submit : Run Job with parameters (after /run command)
add : Add a Job bookmark (/add <number>)
rm : Remove a Job bookmark (/rm <number>)
pass : Jenkins Authorization (/pass <your jenkinds_id> <your jenkins_password>)
chat_id : Query chat information
```

### Config file spec
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

### Start
```
node app.js config.js
```

