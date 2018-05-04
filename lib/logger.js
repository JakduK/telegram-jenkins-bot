const c = require('clorox');
const debugEnabled = process.NODE_ENV !== 'production';

module.exports = function (namespace) {
  return {
    info: str => console.log(`${c.white(log('INFO ', namespace, str))}`),
    error: str => console.error(`${c.red(log('ERROR', namespace, str))}`),
    debug: debugEnabled ? str => console.debug(`${c.green(log('DEBUG', namespace, str))}`) : () => {}
  };
};

function log(level, namespace, str) {
  return `[${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleString().split(' ')[1]}][${level}] ${namespace} : ${str}`
}