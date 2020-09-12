const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const npminstall = require('npminstall');
const log = require('./log');
const npm = require('./npm');

/**
 * Package 类，用于管理动态下载的库文件
 */
class Package {
  constructor(options) {
    log.verbose('options', options);
    this.targetPath = options.targetPath;
    this.storePath = options.storePath;
    this.packageName = options.name;
    this.packageVersion = options.version;
    this.npmFilePath = path.resolve(this.storePath, `_${this.packageName}@${this.packageVersion}@${this.packageName}`);
  }

  prepare() {
    if (!fs.existsSync(this.targetPath)) {
      fse.mkdirpSync(this.targetPath);
    }
    if (!fs.existsSync(this.storePath)) {
      fse.mkdirpSync(this.storePath);
    }
    log.verbose(this.targetPath);
    log.verbose(this.storePath);
  }

  install() {
    this.prepare();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: npm.getNpmRegistry(),
      pkgs: [{
        name: this.packageName,
        version: this.packageVersion,
      }]
    });
  }

  exists() {
    return fs.existsSync(this.npmFilePath);
  }

  getPackage(isOriginal = false) {
    if (!isOriginal) {
      return fse.readJsonSync(path.resolve(this.npmFilePath, 'package.json'));
    }
    return fse.readJsonSync(path.resolve(this.storePath, 'package.json'));
  }

  getRootFilePath(isOriginal = false) {
    const pkg = this.getPackage(isOriginal);
    if (pkg) {
      if (!isOriginal) {
        return path.resolve(this.npmFilePath, pkg.main);
      }
      return path.resolve(this.storePath, pkg.main);
    }
    return null;
  }

  get version() {
    this.prepare();
    return this.exists() ? this.getPackage().version : null;
  }

  async getLatestVersion() {
    const version = this.version;
    if (version) {
      const latestVersion = await npm.getNpmLatestSemverVersion(this.packageName, version);
      return latestVersion;
    }
    return null;
  }

  async update() {
    const latestVersion = await this.getLatestVersion();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: npm.getNpmRegistry(),
      pkgs: [{
        name: this.packageName,
        version: latestVersion,
      }],
    });
  }
}

module.exports = Package;
