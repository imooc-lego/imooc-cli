const request = require('../request');

module.exports = function(params) {
  return request({
    url: '/project/oss',
    params,
  });
};
