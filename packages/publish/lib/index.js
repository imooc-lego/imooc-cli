'use strict';

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const colors = require('colors');
const { log, Git } = require('@imooc-cli/utils');

async function publish(options) {
  log.verbose('publish', options);
  try {
    const startTime = new Date().getTime();
    // 本地初始化
    // 检查项目的基本信息
    const projectInfo = checkProjectInfo();
    const git = new Git(projectInfo, options);
    console.log();
    log.info(colors.red('==='), colors.gray('git配置检查'), colors.red('==='));
    await git.prepare();
    console.log();
    log.info(colors.red('==='), colors.gray('git自动提交'), colors.red('==='));
    await git.commit();
    console.log();
    log.info(colors.red('==='), colors.gray('云构建+云发布'), colors.red('==='));
    await git.publish();
    const endTime = new Date().getTime();
    log.info('本次发布耗时：', Math.floor((endTime - startTime) / 3600) + '秒');
  } catch (e) {
    if (options.debug) {
      log.error('Error:', e.stack);
    } else {
      log.error('Error:', e.message);
    }
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
