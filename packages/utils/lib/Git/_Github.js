const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const SimpleGit = require('simple-git');
const home = require('user-home');
const axios = require('axios');
const log = require('../log');
const inquirer = require('../inquirer');
const terminalLink = require('../terminalLink');

const DEFAULT_CLI_HOME = '.imooc-cli';
const GIT_TOKEN_FILE = '.git_token';
const GIT_USER_FILE = '.git_cache_user';
const GIT_REMOTE_FILE = '.git_remote';
const GIT_REPO_FILE = '.git_project';
const BASE_URL = 'https://api.github.com';
const GIT_REMOTE_OWN = 'own';
const GIT_REMOTE_ORG = 'org';

class GithubRequest {
  constructor(token) {
    this.token = token;
    this.service = axios.create({
      baseURL: BASE_URL,
      timeout: 5000,
    });
    this.service.interceptors.request.use(
      config => {
        config.headers['Authorization'] = `token ${this.token}`;
        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );
    this.service.interceptors.response.use(
      response => {
        log.verbose('response', response.data);
        return response.data;
      },
      error => {
        if (error.response && error.response.data) {
          return error.response;
        } else {
          return Promise.reject(error);
        }
      },
    );
  }

  get(url, params, headers) {
    return this.service({
      url,
      data: params,
      method: 'get',
      headers,
    });
  }

  post(url, data, headers) {
    return this.service({
      url,
      data,
      method: 'post',
      headers,
    });
  }
}

class Github {
  constructor({ dir, name, version }, options = {}) {
    this.git = SimpleGit(dir);
    this.dir = dir;
    this.owner = null;
    this.name = name;
    this.version = version;
    this.options = options;
    this.projectType = GIT_REMOTE_OWN;
  }

  prepare = async () => {
    // 检查配置目录
    if (this.options.cliHome) {
      this.home = this.options.cliHome;
    } else if (process.env.CLI_HOME) {
      this.home = path.resolve(home, process.env.CLI_HOME);
    } else {
      this.home = path.resolve(home, DEFAULT_CLI_HOME);
    }
    log.verbose('home', this.home);
    fse.ensureDirSync(this.home);
    // 检查 github token
    this.tokenPath = path.resolve(this.home, GIT_TOKEN_FILE);
    this.token = '';
    if (!fs.existsSync(this.tokenPath) || this.options.refreshToken) {
      log.notice('github token未生成', '请先生成 github token，' + terminalLink('链接', 'https://github.com/settings/tokens'));
      this.token = await inquirer({
        type: 'password',
        message: '请将token复制到这里',
        defaultValue: '',
      });
      log.verbose('token', this.token);
      fs.writeFileSync(this.tokenPath, this.token);
      log.success('token写入成功', this.tokenPath);
    } else {
      this.token = fs.readFileSync(this.tokenPath).toString();
      log.verbose('token', this.token);
    }
    this.request = new GithubRequest(this.token);
    // 检查是否能够获取到 git 源信息
    this.remotePath = path.resolve(this.home, GIT_REMOTE_FILE);
    this.userCachePath = path.resolve(this.home, GIT_USER_FILE);
    if (fs.existsSync(this.remotePath) && !this.options.refreshRemote) {
      this.owner = fs.readFileSync(this.remotePath).toString();
      const userCache = JSON.parse(fs.readFileSync(this.userCachePath).toString());
      if (!userCache) {
        throw new Error('项目类型获取失败');
      }
      this.user = userCache.user;
      this.orgs = userCache.orgs;
      this.org = this.orgs.find(item => item.login === this.owner);
      this.projectType = this.getProjectTypeFromRemote();
      log.success('获取 remote 信息成功', this.owner);
      log.success('项目类型', this.projectType);
    } else {
      // 如果无法获取 git 源信息，则开始获取用户和组织信息
      this.user = await this.getUser();
      if (this.user) {
        this.orgs = await this.getOrganizations() || [];
      } else {
        throw new Error('获取 github 用户信息失败');
      }
      // 缓存 github 用户和组织信息
      fs.writeFileSync(this.userCachePath, JSON.stringify({
        user: this.user,
        orgs: this.orgs,
      }));
      log.success('github 用户信息缓存成功', this.userCachePath);
      // 确定 git remote 源
      const gitRemote = await inquirer({
        type: 'list',
        choices: [{
          name: '个人',
          value: GIT_REMOTE_OWN,
        }, {
          name: '组织',
          value: GIT_REMOTE_ORG,
        }],
        message: '请选择您的仓库类型',
      });
      log.verbose('仓库类型', gitRemote);
      if (gitRemote === GIT_REMOTE_OWN) {
        this.owner = this.user.login;
        this.projectType = GIT_REMOTE_OWN;
      } else {
        this.owner = await inquirer({
          type: 'list',
          choices: this.orgs.map(item => ({
            name: item.login,
            value: item.login,
          })),
          message: '请选择您的仓库类型',
        });
        this.projectType = GIT_REMOTE_ORG;
      }
      fs.writeFileSync(this.remotePath, this.owner);
      log.success('git remote 生成成功', fs.readFileSync(this.remotePath).toString());
    }
    // 创建远程仓库
    this.repo = await this.getRepo();
    if (this.repo) {
      this.repoCachePath = path.resolve(this.home, GIT_REPO_FILE);
      fs.writeFileSync(this.repoCachePath, JSON.stringify(this.repo));
      log.success('github 仓库获取成功', this.repoCachePath);
    } else {
      throw new Error('github 仓库获取或创建失败');
    }
    // git 初始化
    await this.init();
  };

  init = async () => {
    log.notice('执行 git 初始化');
    await this.git.init(this.dir);
    log.notice('添加 git remote');
    await this.git.addRemote('origin', this.getRemote());
    log.notice('执行 git add');
    // await this.git.add();
  }

  getUser = async () => {
    return this.request.get('/user');
  };

  getOrganizations = async () => {
    return this.request.get(`/user/orgs`);
  };

  getRemote = () => {
    return `git@github.com:${this.owner}/${this.name}.git`;
  };

  getProjectTypeFromRemote = () => {
    if (this.user.login === this.owner) {
      return GIT_REMOTE_OWN;
    } else {
      if (this.org) {
        return GIT_REMOTE_ORG;
      } else {
        throw new Error('项目类型获取失败');
      }
    }
  };

  getRepo = async () => {
    let repo = await this.request.get('/repos/' + this.owner + '/' + this.name);
    if (repo.status === 404) {
      log.warn('github 仓库未创建', repo.data.message);
      log.notice('开始创建 github 仓库');
      if (this.projectType === GIT_REMOTE_ORG) {
        repo = await this.request.post('/orgs/' + this.owner + '/repos', {
          name: this.name,
        }, {
          Accept: 'application/vnd.github.v3+json',
        });
      } else {
        repo = await this.request.post('/user/repos', {
          name: this.name,
        }, {
          Accept: 'application/vnd.github.v3+json',
        });
      }
    }
    if (!repo || !repo.id) {
      return null;
    }
    return repo;
  };

  exists = () => {
  };

  pull = () => {
  };

  clone() {
    return this.git.clone(this.getRemote());
  }

  tags() {
    return this.git.tags();
  }

  checkout(tag) {
    return this.git.checkout(tag);
  }
}

module.exports = Github;
