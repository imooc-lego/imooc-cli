const { request } = require('@imooc-cli/utils');

module.exports = function() {
  return request({
    url: '/project/template',
  });
};
