'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const { log, inquirer, spinner, Package, sleep, exec } = require('@imooc-cli/utils');
const getProjectTemplate = require('./getProjectTemplate');

async function init(options) {
  try {
    // 设置 targetPath
    let targetPath = process.cwd();
    if (!options.targetPath) {
      options.targetPath = targetPath;
    }
    log.verbose('init', options);
    // 完成项目初始化的准备和校验工作
    const result = await prepare(options);
    if (!result) {
      log.info('创建项目终止');
      return;
    }
    // 获取项目模板列表
    const { templateList } = result;
    // 缓存项目模板文件
    const template = await downloadTemplate(templateList, options);
    log.verbose('template', template);
    // 安装项目模板
    await installTemplate(template, options);
  } catch (e) {
    log.error('Error:', e.message);
  }
}

async function npminstall(targetPath) {
  return new Promise((resolve, reject) => {
    const p = exec('cnpm', ['install'], { stdio: 'inherit', cwd: targetPath });
    p.on('error', e => {
      reject(e);
    });
    p.on('exit', c => {
      resolve(c);
    });
  });
}

async function execStartCommand(targetPath, startCommand) {
  return new Promise((resolve, reject) => {
    const p = exec(startCommand[0], startCommand.slice(1), { stdio: 'inherit', cwd: targetPath });
    p.on('error', e => {
      reject(e);
    });
    p.on('exit', c => {
      resolve(c);
    });
  });
}

async function installTemplate(template, options) {
  // 安装模板
  let spinnerStart = spinner(`正在安装模板...`);
  await sleep(1000);
  const sourceDir = template.path;
  const targetDir = options.targetPath;
  fse.copySync(sourceDir, targetDir);
  spinnerStart.stop(true);
  log.success('模板安装成功');
  // 安装依赖文件
  log.notice('开始安装依赖');
  await npminstall(targetDir);
  log.success('依赖安装成功');
  // 启动代码
  if (template.startCommand) {
    log.notice('开始执行启动命令');
    const startCommand = template.startCommand.split(' ');
    await execStartCommand(targetDir, startCommand);
  }
}

async function downloadTemplate(templateList, options) {
  // 用户交互选择
  const templateName = await inquirer({
    choices: createTemplateChoice(templateList),
    message: '请选择项目模板',
  });
  log.verbose('template', templateName);
  const selectedTemplate = templateList.find(item => item.npmName === templateName);
  log.verbose('selected template', selectedTemplate);
  const { cliHome } = options;
  const targetPath = path.resolve(cliHome, 'template');
  // 基于模板生成 Package 对象
  const templatePkg = new Package({
    targetPath,
    storePath: targetPath,
    name: selectedTemplate.npmName,
    version: selectedTemplate.version,
  });
  // 如果模板不存在则进行下载
  if (!await templatePkg.exists()) {
    let spinnerStart = spinner(`正在下载模板...`);
    await sleep(1000);
    await templatePkg.install();
    spinnerStart.stop(true);
    log.success('下载模板成功');
  } else {
    log.notice('模板已存在', `${selectedTemplate.npmName}@${selectedTemplate.version}`);
    log.notice('模板路径', `${targetPath}`);
  }
  // 生成模板路径
  const templatePath = path.resolve(templatePkg.npmFilePath, 'template');
  log.verbose('template path', templatePath);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`[${templateName}]项目模板不存在！`);
  }
  const template = {
    ...selectedTemplate,
    path: templatePath,
  };
  return template;
}

async function prepare(options) {
  let fileList = fs.readdirSync(process.cwd());
  fileList = fileList.filter(file => ['node_modules', '.git', '.DS_Store'].indexOf(file) < 0);
  log.verbose('fileList', fileList);
  let continueWhenDirNotEmpty = true;
  if (fileList && fileList.length > 0) {
    continueWhenDirNotEmpty = await inquirer({
      type: 'confirm',
      message: '当前文件夹不为空，是否继续创建项目？',
      defaultValue: false,
    });
  }
  if (!continueWhenDirNotEmpty) {
    return;
  }
  if (options.force) {
    const targetDir = options.targetPath;
    const confirmEmptyDir = await inquirer({
      type: 'confirm',
      message: '是否确认清空当下目录下的文件',
      defaultValue: false,
    });
    if (confirmEmptyDir) {
      fse.emptyDirSync(targetDir);
    }
  }
  const templateList = await getProjectTemplate();
  if (!templateList || templateList.length === 0) {
    throw new Error('项目模板列表获取失败');
  }
  return {
    templateList,
  };
}

function createTemplateChoice(list) {
  return list.map(item => ({
    value: item.npmName,
    name: item.name,
  }));
}

module.exports = init;
