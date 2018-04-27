const c = require('clorox');
module.exports = {
  info: str => console.log(`${c.white(str)}`),
  error: str => console.error(`${c.red(str)}`),
  debug: str => console.debug(`${c.green(str)}`)
};