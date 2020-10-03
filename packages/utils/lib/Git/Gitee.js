const GitServer = require('./GitServer');
const GiteeRequest = require('./GiteeRequest');

class Gitee extends GitServer {
  constructor() {
    super('gitee');
  }

  getTokenHelpUrl = () => {
    return 'https://gitee.com/profile/personal_access_tokens';
  };

  getUser = () => {
    return this.request.get('/user').then(response => {
      return this.handleResponse(response);
    });
  };

  getOrgs = () => {
    return this.request.get('/user/orgs', {
      page: 1,
      per_page: 100,
      admin: true,
    }).then(response => {
      return this.handleResponse(response);
    });
  };

  setToken = (token) => {
    this.request = new GiteeRequest(token);
  };

  getRepo = (owner, repo) => {
    return this.request.get(`/repos/${owner}/${repo}`).then(response => {
      return this.handleResponse(response);
    });
  };

  createRepo = (repo) => {
    return this.request.post('/user/repos', {
      name: repo,
    });
  };

  createOrgRepo = (repo, login) => {
    return this.request.post(`/orgs/${login}/repos`, {
      name: repo,
    });
  };

  getRemote = (login, repo) => {
    return `git@gitee.com:${login}/${repo}.git`;
  };

  getSSHKeysUrl = () => {
    return 'https://gitee.com/profile/sshkeys';
  };

  getSSHKeysHelpUrl = () => {
    return 'https://gitee.com/help/articles/4191';
  };
}

module.exports = Gitee;
