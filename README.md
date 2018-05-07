#Jenkins Bot for Telegram

Available commands
```
my : 내 Job목록
jobs - Job검색 최대 50개 (/jobs <키워드 또는 생략>)
job - Job선택 (/job <번호>)
run - Job실행 (/run <번호> 또는 /job커맨드로 Job선택후 가능)
submit - 파라미터 전달하여 Job실행 (/run커맨드 실행후 가능)
add - Job북마크 (/add <번호> 또는 /job커맨드로 Job선택후 가능)
rm - Job북마크 제거 (/rm 번호 또는 /job커맨드로 Job선택후 가능)
```

Authorization command
```
/pass <your jenkinds_id> <your jenkins_password>
```

Config file spec
```
module.exports = {
  telegram: {
    url: 'https://api.telegram.org',
    token: 'token for your'
  },
  jenkins: {
    url: 'url for your'
  },
  db: {
    dbPath: 'local.db'
  }
};
```

Start
```
node app.js config.js
```

