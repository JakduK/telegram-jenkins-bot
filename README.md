# Telegram Jenkins Bot for self hosting


### Available commands
|Command|Description|
|-------|-----------|
|my|Print my Job bookmars|
|jobs|Find Jobs `/jobs <keyword or blank>`|
|run|Run Job `/run <number>`|
|submit|Run Job after submit parameters `after /run`|
|add|Add Job bookmarks `/add <number> <number> <number> ...`|
|rm|Remove Job bookmarks `/rm <number> <number> <number> ...`|
|pass|Authorize Jenkins `/pass <your jenkinds_id> <your jenkins_password>`|
|chat_info|Query Chat information|

### Config file spec
```
module.exports = {
  telegram: {
    token: 'bot token for yours'
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
# Use default config path (./config.local.js)
node app.js

# Use specific config path
node app.js config.js
```
