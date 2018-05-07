const _ = require('lodash');

class KeyValueParser {
  static parse(args) {
    const resultMap = {};
    const cAccum = [];
    let startQuote = null;
    let currentName = null;
    let state = 'START_NAME';

    _.forEach(args, c => {
      switch (c) {
        case '"':
        case "'":
          if (state === 'START_VALUE') {
            startQuote = c;
            state = 'START_VALUE_QUOTE';
          } else if (state === 'START_VALUE_QUOTE' && c === startQuote) {
            savePair();
            state = 'END_VALUE_QUOTE';
          } else {
            cAccum.push(c);
          }
          break;
        case '=':
          if (state === 'START_VALUE' || state === 'START_VALUE_QUOTE') {
            cAccum.push(c);
          } else {
            saveName();
            state ='START_VALUE';
          }
          break;
        case ' ':
          if (state === 'START_VALUE_QUOTE') {
            cAccum.push(c);
          } else {
            if (state !== 'END_VALUE_QUOTE') {
              if (state === 'START_NAME') {
                saveName();
              }
              savePair();
            }
            state = 'START_NAME';
          }
          break;
        default:
          if (state === 'END_VALUE_QUOTE') {
            state = 'START_NAME';
          }
          cAccum.push(c);
          break;
      }
    });

    if (currentName) {
      resultMap[currentName] = cAccum.join('');
    } else if (cAccum.length) {
      resultMap[cAccum.join('')] = '';
    }

    return resultMap;

    function saveName() {
      currentName = cAccum.join('');
      cAccum.length = 0;
    }

    function savePair() {
      resultMap[currentName] = cAccum.join('');
      cAccum.length = 0;
      currentName = null;
    }
  }
}

module.exports = KeyValueParser;