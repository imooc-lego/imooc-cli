function error(methodName) {
  throw new Error(`${methodName} must be implemented!`);
}

class GitServer {
  constructor(type, token) {
    this.type = type;
    this.token = token;
  }

  setToken = () => {
    error('setToken');
  };
  createRepo = () => {
    error('createRepo');
  };
  createOrgRepo = () => {
    error('createOrgRepo');
  };
  getRepo = () => {
    error('getRepo');
  };
  getUser = () => {
    error('getUser');
  };
  getOrgs = () => {
    error('getOrgs');
  };
  getTokenHelpUrl = () => {
    error('getTokenHelpUrl');
  };
  getSSHKeysUrl = () => {
    error('getSSHKeysUrl');
  };
  getSSHKeysHelpUrl = () => {
    error('getSSHKeysHelpUrl');
  };
  getRemote = () => {
    error('getRemote');
  };

  isHttpResponse = (response) => {
    return response && response.status && response.statusText &&
      response.headers && response.data && response.config;
  };

  handleResponse = (response) => {
    if (this.isHttpResponse(response) && response !== 200) {
      return null;
    } else {
      return response;
    }
  };
}

module.exports = GitServer;
