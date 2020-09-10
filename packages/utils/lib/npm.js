const axios = require('axios');
const urlJoin = require("url-join");
const semver = require("semver");

// 获取 registry 信息
function getNpmRegistry(isOriginal = false) {
  return isOriginal ? 'https://registry.npmjs.org' :
    'https://registry.npm.taobao.org';
}

// 从 registry 获取 npm 的信息
function getNpmInfo(npm, registry) {
  const register = registry || getNpmRegistry();
  const url = urlJoin(register, npm);
  return axios.get(url).then(function(response) {
    try {
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      return Promise.reject(error);
    }
  });
}

// 获取某个 npm 的最新版本号
function getLatestVersion(npm, registry) {
  return getNpmInfo(npm, registry).then(function (data) {
    if (!data['dist-tags'] || !data['dist-tags'].latest) {
      console.error('没有 latest 版本号', data);
      return Promise.reject(new Error('Error: 没有 latest 版本号'));
    }
    const latestVersion = data['dist-tags'].latest;
    return latestVersion;
  });
}

// 获取某个 npm 的所有版本号
function getVersions(npm, registry) {
  return getNpmInfo(npm, registry).then(function (body) {
    const versions = Object.keys(body.versions);
    return versions;
  });
}

// 根据指定 version 获取符合 semver 规范的最新版本号
function getLatestSemverVersion(baseVersion, versions) {
  versions = versions
    .filter(function (version) { return semver.satisfies(version, "^" + baseVersion); })
    .sort(function (a, b) {
      return semver.gt(b, a);
    });
  return versions[0];
}

// 根据指定 version 和包名获取符合 semver 规范的最新版本号
function getNpmLatestSemverVersion(npm, baseVersion, registry) {
  return getVersions(npm, registry).then(function (versions) {
    return getLatestSemverVersion(baseVersion, versions);
  });
}

module.exports = {
  getNpmRegistry,
  getNpmInfo,
  getLatestVersion,
  getNpmLatestSemverVersion,
};
