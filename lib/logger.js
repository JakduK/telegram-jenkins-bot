const c = require('clorox');
const debugEnabled = process.env.NODE_ENV !== 'production';

class Log {
  constructor(namespace) {
    this.namespace = namespace;
  }

  info(str) {
    console.log(`${c.white(this._log('INFO ', this.namespace, str))}`)
  }

  error(str) {
    console.error(`${c.red(this._log('ERROR', this.namespace, str))}`)
  }

  debug(str) {
    if (debugEnabled) {
      console.debug(`${c.green(this._log('DEBUG', this.namespace, str))}`)
    }
  }

  _log(level, namespace, str) {
    return `[${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleString().split(' ')[1]}][${level}] ${namespace} : ${str}`
  }
}

function factory(namespace) {
  return new Log(namespace);
}

module.exports = factory;