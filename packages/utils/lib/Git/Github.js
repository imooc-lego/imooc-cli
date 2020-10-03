const GitServer = require('./GitServer');
const GithubRequest = require('./GithubRequest');

class Github extends GitServer {
  constructor() {
    super('github');
  }

  getTokenHelpUrl = () => {
    return 'https://github.com/settings/tokens';
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
    }).then(response => {
      return this.handleResponse(response);
    });
  };

  setToken = (token) => {
    this.request = new GithubRequest(token);
  };

  getRepo = (owner, repo) => {
    return this.request.get(`/repos/${owner}/${repo}`).then(response => {
      return this.handleResponse(response);
    });
  };

  createRepo = (repo) => {
    return this.request.post('/user/repos', {
      name: repo,
    }, {
      Accept: 'application/vnd.github.v3+json',
    });
  };

  createOrgRepo = (repo, login) => {
    return this.request.post('/orgs/' + login + '/repos', {
      name: repo,
    }, {
      Accept: 'application/vnd.github.v3+json',
    });
  };

  getRemote = (login, repo) => {
    return `git@github.com:${login}/${repo}.git`;
  };

  getSSHKeysUrl = () => {
    return 'https://github.com/settings/keys';
  };

  getSSHKeysHelpUrl = () => {
    return 'https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/connecting-to-github-with-ssh';
  };
}

module.exports = Github;
