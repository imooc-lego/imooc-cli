const axios = require('axios');

module.exports = {
  createComponent: async function(component) {
    try {
      const response = await axios.post('http://book.youbaobao.xyz:7002/api/v1/components', component);
      const { data } = response;
      if (data.code === 0) {
        return data.data;
      } else {
        return null;
      }
    } catch (e) {
      throw e;
    }
  },
};
