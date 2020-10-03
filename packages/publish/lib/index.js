'use strict';

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const { log, Git } = require('@imooc-cli/utils');

async function publish(options) {
  log.verbose('publish', options);
  try {
    // 本地初始化
    // 检查项目的基本信息
    const projectInfo = checkProjectInfo();
    const git = new Git(projectInfo, options);
    await git.prepare();
    await git.commit();
    if (options.prod) {
      await git.publish();
    }
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
