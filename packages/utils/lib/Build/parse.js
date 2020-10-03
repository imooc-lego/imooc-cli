const get = require('lodash/get');

function createMsg(action, payload = {}, metadata = {}) {
  const meta = Object.assign({}, {
    timestamp: Date.now(),
  }, metadata);

  return {
    meta,
    data: {
      action,
      payload,
    },
  };
}

function parseMsg(msg) {
  const action = get(msg, 'data.action');
  const message = get(msg, 'data.payload.message');
  return {
    action,
    message,
  };
}

module.exports = {
  createMsg,
  parseMsg,
};
