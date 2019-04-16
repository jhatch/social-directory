const handlers = require('./index.js');

if (typeof handlers[process.argv[2]] === 'function') {
  handlers[process.argv[2]]();
} else {
  console.error('Unknown Handler!'); /* eslint no-console: off */
}
