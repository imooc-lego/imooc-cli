'use strict';

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const { log, Github } = require('@imooc-cli/utils');

async function publish(options) {
  log.verbose('publish', options);
  try {
    // 本地初始化
    // 检查项目的基本信息
    const projectInfo = checkProjectInfo();
    const Git = new Github(projectInfo, options);
    await Git.prepare();
    // 生成远程 git 仓库链接
    // 检查远程仓库是否存在
    // 仓库存在时关联远程仓库
    // 根据 package.json version 创建分支
    // 本地 git 提交
    // 远程 git 提交
  } catch (e) {
    log.error('Error:', e.message);
    log.error('Error:', e.stack);
  }
}

function checkProjectInfo() {
  const projectPath = process.cwd();
  const pkgPath = path.resolve(projectPath, 'package.json');
  log.verbose('package.json', pkgPath);
  if (!fs.existsSync(pkgPath)) {
    throw new Error('package.json不存在');
  }
  const pkg = fse.readJsonSync(pkgPath);
  const { name, version } = pkg;
  log.verbose('project', name, version);
  return { name, version, dir: projectPath };
}

module.exports = publish;
