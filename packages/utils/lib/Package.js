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
    this.cliHome = options.cliHome;
    this.packageDir = options.packageDir;
    this.packageName = options.packageName;
    this.packageVersion = options.packageVersion;
    this.targetPath = path.resolve(this.cliHome, this.packageDir);
    this.storePath = path.resolve(this.targetPath, 'node_modules');
  }

  prepare() {
    log.verbose('targetPath', this.targetPath);
    log.verbose('storePath', this.storePath);
    if (!fs.existsSync(this.targetPath)) {
      fse.mkdirpSync(this.targetPath);
    }
    if (!fs.existsSync(this.storePath)) {
      fse.mkdirpSync(this.storePath);
    }
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

  update() {
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
}

module.exports = Package;
