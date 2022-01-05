'use strict';
const fse = require('fs-extra')
const fs = require('fs')
const pkgUp = require('pkg-up')
const path = require('path')
const pathExists = require('path-exists').sync;
const npminstall = require('npminstall')

const { homedir } = require('os')
const { ADD_CONTENT,DEFAULT_TYPE,ADD_PAGES_TEMPLATE,DEFAULT_CLI_HOME,ADD_CODE_TEMPLATE,SHOW_FILE_TYPE} = require('./const')
const {  inquirer,log ,npm,spinner,exec,sleep} = require('@imooc-cli/utils');

const useOriginNpm = false;
async function add () {
  log.level = process.env.LOG_LEVEL; // 进入add后log.level的层级还是info
  let targetPath // 缓存文件地址
  let rootDir = process.cwd() // 目标目录
  let addTemplate // 模版信息
   // 生成缓存文件目录
  // process.env.CLI_HOME 没有获取到，这里直接写
  targetPath = path.resolve(`${homedir()}/${DEFAULT_CLI_HOME}`, 'addTemplate');
  log.verbose('targetPath',targetPath)
  // 1. 选择添加的类型
  let addType = await getAddType()
  log.verbose('addType',addType)
  let addName
  if(addType === 'page') {
    addName= await getAddName()
    log.verbose('addName',addName)
    // 2. 选择添加模版
    addTemplate = await getAddTemplate(ADD_PAGES_TEMPLATE)
    log.verbose('addTemplate',addTemplate)
    const selectedTemplate = ADD_PAGES_TEMPLATE.find(item => item.name === addTemplate);
    log.verbose('selectedTemplate',selectedTemplate)
    // 获取最新版本号
    selectedTemplate.templateVersion = await npm.getLatestVersion(selectedTemplate.npmName)
    // 下载对应的模版文件
    // 下载的模版需要安装到缓存中，安装时从本地缓存文件中查找（更新/安装）
    // 指定存放模版文件的目录为 (/Users/liumeng/.imooc-cli/addTemplate)
    // 判断缓存文件是否存在（更新/安装的逻辑判断）
    await updateOrInstall(targetPath,selectedTemplate)
    // 3. 读取缓存项目中的package.json和当前项目中的package.json信息进行对比
    // 读取缓存项目中的package.json和当前项目中的package.json信息进行对比
    // 4.获取当前目录，拷贝内容到当前目录下
    fse.ensureDirSync(targetPath);
    if(pathExists(`${rootDir}/${addName}`)){
      log.error(`当前目录下已经存在 ${addName} 文件`)
      return
    }else{
      fse.ensureDirSync(`${rootDir}/${addName}`);
    }
    await copyFile(targetPath,selectedTemplate,rootDir,addName)
    // 5. 安装项目依赖
    await dependencyInit(targetPath,selectedTemplate)
  }else{
    // 代码
    // 选择模版
    // 读取目标信息文件内容（展示刷选后的文件列表）
    // 安装/更新模版
    // 拷贝文件
    // 安装依赖
    addTemplate = await getAddTemplate(ADD_CODE_TEMPLATE)
    log.verbose('addTemplate',addTemplate)
    const selectedTemplate = ADD_CODE_TEMPLATE.find(item => item.name === addTemplate);
    log.verbose('selectedTemplate',selectedTemplate)
    // 获取最新版本号
    selectedTemplate.templateVersion = await npm.getLatestVersion(selectedTemplate.npmName)
    log.verbose('selectedTemplate',selectedTemplate)
    // 更新/安装依赖
    await updateOrInstall(targetPath,selectedTemplate)
    // 展示文件
    const showFileList = await showFilterFile(rootDir)
    log.verbose('showFileList',showFileList)
    const addFileName = await showAddFile(showFileList)
    log.verbose('addFileName',addFileName)
    if(addFileName){
      // 选择添加内容的行数
      await fileWrite(rootDir,addFileName,selectedTemplate)
      // 拷贝模版内容到指定文件
      await copyCodeToComponent(targetPath,rootDir,selectedTemplate)
      // 依赖安装
      await dependencyInit(targetPath,selectedTemplate)
    }

  }
}
// 拷贝代码片段模版到指定位置
function copyCodeToComponent(targetPath,rootDir,selectedTemplate){
  if(pathExists(`${rootDir}/components/${selectedTemplate.fileName}`)){
    log.error(`当前目录下已经存在 ${selectedTemplate.fileName} 文件`)
    return
  }else{
    // fse.copySync(`${cacheFilePath(targetPath,selectedTemplate)}/template`,`${rootDir}/components/${selectedTemplate.fileName}`);
    fse.copySync(`${cacheFilePath(targetPath,selectedTemplate)}/template`,`${rootDir}/components/`);
  }
}
// 向指定文件中写入信息
async function fileWrite(rootDir,addFileName,selectedTemplate){
  const fileDir = `${rootDir}/${addFileName}`
  const fileContent = fs.readFileSync(fileDir,'utf-8')
  const fileContentArray = fileContent.split('\n')
  // 选择需要添加的文件和行数
  const addPostionIndex = await addCodePosition(fileContentArray)
  log.verbose('addPostionIndex',addPostionIndex)
  let lastImport = 0; // import最后出现的位置
  fileContentArray.map((item,index) => {
    if(item.indexOf('import') != -1 && item.indexOf('@import') == -1 ){
      lastImport = index
    }
  })
  const insertContent = insertStr(fileContent,fileContent.indexOf(fileContentArray[addPostionIndex-1])
      +fileContentArray[addPostionIndex-1].length, '\n' +`<${selectedTemplate.fileName}/>` )
  // 在指定位置模版插入内容
  const insertContent2 = insertStr(insertContent,insertContent.indexOf(fileContentArray[lastImport])
      +fileContentArray[lastImport].length, '\n' +`import ${titleCase(selectedTemplate.fileName)} from './components/${selectedTemplate.fileName}'`)
  fs.writeFileSync(fileDir,insertContent2,'utf-8')
}
// 向字符串制定位置添加内容
function insertStr(str1, n, str2){
  var s1 = '';
  var s2 = '';
  if(str1.length<n){
      return str1 + str2;
  }else{
      s1 = str1.substring(0, n);
      s2 = str1.substring(n, str1.length);
      return s1 + str2 + s2;
  }
}
// 首字母大写

function titleCase(str) {
  const newStr = str.slice(0,1).toUpperCase() +str.slice(1).toLowerCase();
  return newStr;
}
// 选择添加代码的位置
function addCodePosition(fileContentArray){
  return inquirer({
    type: 'input',
    message: '请输入添加的位置',
    validate: function(v){
      // 插入的位置范围是从1 到 总长度
      var done = this.async();
      setTimeout(function() {
        if(v * 1 === 0){
          done('添加的代码位置不能从0开始')
        }
        if((v * 1) > fileContentArray.length +1  &&  v * 1 != 0){
          done('添加的代码位置不能超过文件代码总长度 ')
        }
        done(null, true);
      }, 0);
    }
  });
}
// 过滤显示的文件名
async function showFilterFile(targetPath){
  const fileContent = []
  const files = await fse.readdirSync(targetPath)
  files.map((item) => {
    for(let j = 0 ; j <SHOW_FILE_TYPE.length; j++ ){
      if(item.indexOf(SHOW_FILE_TYPE[j]) != -1 && item.indexOf('.json') == -1){
        const obj = {}
        obj.name = item
        obj.value = item
        fileContent.push(obj)
      }
    }
  })
  return fileContent
}
// 选择添加的文件
function showAddFile(data){
  return inquirer({
    type: 'list',
    choices: data,
    pageSize: data.length,
    Loop: false,
    message: '请选择添加的文件',
  });
}

// 更新/安装模版逻辑
async function updateOrInstall(targetPath,selectedTemplate){
  const installOrUpdataFlag = await cacheFile(targetPath,selectedTemplate)
    if( installOrUpdataFlag === 'install'){
      let spinnerStart = spinner(`正在下载模板...`);
      await sleep(1000);
      await installAddTemplate(targetPath,selectedTemplate)
      spinnerStart.stop(true);
      log.success('下载模板成功');
    }else if(installOrUpdataFlag === 'update'){
      let spinnerStart = spinner(`正在更新模板...`);
      await sleep(1000);
      await updateAddTemplate(targetPath,selectedTemplate)
      spinnerStart.stop(true);
      log.success('更新模板成功');
    }else{
      log.success('模版文件中已经是最新版本')
    }
}
// 选择添加的类型
function getAddType() {
  return inquirer({
    type: 'list',
    choices: ADD_CONTENT,
    message: '请选择初始化类型',
    defaultValue: DEFAULT_TYPE,
  });
}
// 输入文件名
function getAddName() {
  return inquirer({
    type: 'string',
    message: '请输入文件名称',
    defaultValue: '',
  });
}
// 选择项目模版
function getAddTemplate(data){
  return inquirer({
    choices: data,
    message: '请选择模版',
  });
}

// 安装模版
function installAddTemplate(targetPath,template){
  const {npmName,templateVersion} = template
  return npminstall({
    root: targetPath,
    storeDir: targetPath,
    registry: npm.getNpmRegistry(useOriginNpm),
    pkgs: [{
      name: npmName,
      version: templateVersion,
    }],
  });

}
// 更新模版
function updateAddTemplate(targetPath,template){
  // 更新
  const {npmName,templateVersion} = template
  return npminstall({
    root: targetPath,
    storeDir: targetPath,
    registry: npm.getNpmRegistry(useOriginNpm),
    pkgs: [{
      name: npmName,
      version: templateVersion,
    }],
  });
}
// 缓存文件判断
async function cacheFile(targetPath,template){
  const {npmName} = template
  // 判断本地缓存文件是否存在，如果不存在缓存文件就创建缓存文件执行安装逻辑，
  // 如果缓存文件存在，但是没有模版文件，也需要重新安装。
  // 如果存在缓存模版文件就针对版本信息进行文件查找，如果是最新版本就退出，执行拷贝命令，否则执行更新逻辑
  if(!pathExists(targetPath)){
    fse.mkdirpSync(targetPath)
    return 'install'
  }else{
    const cacheFilePathTemplate = await cacheFilePath(targetPath,template)
    // 如果存在当前版本文件就直接返回
    if(pathExists(cacheFilePathTemplate)){
      return 'none'
    }
    const filfList = await readCacheFile(targetPath,npmName)
    // 如果有旧版本文件就直接更新，否则就执行安装逻辑
    if(filfList && filfList.length > 0 ){
      return 'update'
    }else{
      return 'install'
    }

  }
}
// 缓存模版文件格式
function  cacheFilePath (targetPath,template) {
  const {npmName,templateVersion} = template
  return path.resolve(targetPath, `_${npmName.replace('/', '_')}@${templateVersion}@${npmName}`);
}
// 遍历缓存文件
function readCacheFile(path,templateName) {
  const fileList = []
  const files = fs.readdirSync(path);
  files.map((items) => {
    if(items.indexOf(templateName.replace('/', '_')) != -1)
    fileList.push(items)
  })
  return fileList
}
// 依赖安装
async function dependencyInit(targetPath,selectedTemplate){
  const rootDir = process.cwd()
  const targetPathPkgJson = require(await pkgUp({cwd: `${cacheFilePath(targetPath,selectedTemplate)}/template`}))
  const rootDirPkgJson = require(await pkgUp())
  // 依赖项对比
  const diffDependencies = await dependencyDiff(targetPathPkgJson.dependencies,rootDirPkgJson.dependencies,'dependencies')
  log.verbose('依赖项 dependencies 对比',diffDependencies)
  if(diffDependencies && diffDependencies.length > 0 ){
    // 安装 dependencies 依赖
    await writeDependency(diffDependencies,await pkgUp())
    log.success('当前项目中dependencies已经是最新依赖');
    await addNpminstall(rootDir)
    log.success('下载依赖成功');
  }else{
    log.warn('请手动安装依赖');
    return
  }
}
// 依赖对比
function dependencyDiff(template,origin,type){
  if(template && origin){
    const templateList = Object.keys(template)
    const originList = Object.keys(origin)
    const diff = templateList.filter(function (val) { return originList.indexOf(val) === -1 })
    const intersection = templateList.filter(function (val) { return originList.indexOf(val) > -1 })
    console.log(templateList,originList,intersection,diff,12)
    if(intersection && intersection.length > 0 ){
      log.error(`两者存在依赖版本冲突，请手动选择版本: ${intersection}`)
      intersection.map((item) => {
        log.warn(`${type}: 模版项目 ${item} 版本号：${template[item]} ==> 当前项目 ${item} 版本号：${origin[item]}`)
      })
      return
    }else{
      const newDiff = []
      diff.map((item) => {
        const obj = {}
        obj[item] = template[item]
        newDiff.push(obj)
      })
      return newDiff
    }
  }else if(template ){
    return objToArr(template)
  }else {
    return
  }
}
// 将依赖写入package.json文件
async function writeDependency(dependencyList,targetPath){
  const data = JSON.parse(fs.readFileSync(targetPath,'utf-8'))
    dependencyList.map((item) => {
      data.dependencies[Object.keys(item)[0]] = Object.values(item)[0]
    })
  fs.writeFileSync(targetPath,JSON.stringify(data),'utf-8')
}
// 安装依赖
async function addNpminstall(targetPath) {
  return new Promise((resolve, reject) => {
    const p = exec('npm', ['install', '--registry=https://registry.npm.taobao.org',], { stdio: 'inherit', cwd: targetPath });
    p.on('error', e => {
      reject(e);
    });
    p.on('exit', c => {
      resolve(c);
    });
  });
}
// 对象转数组
function objToArr (object){
  const arr = []
  for(let key in object){
    const obj = {}
    obj[key] = object[key]
    arr.push(obj)
  }
  return arr
}
// 拷贝文件筛选
async function copyFile(targetPath,selectedTemplate,rootDir,addName){
  const originFile = `${cacheFilePath(targetPath,selectedTemplate)}/${selectedTemplate.template}`
  const fileList = fse.readdirSync(originFile)
  const ignore = selectedTemplate.ignore
  fileList.map(async (item) => {
    let spinnerStart = spinner(`正在拷贝模板文件...`);
    await sleep(1000);
    if(ignore.indexOf(item)  === -1){
      if(item === 'views'){
        fse.copySync( `${originFile}/${item}/${selectedTemplate.pageName}`,`${rootDir}/${addName}`);
      }else{
        fse.copySync(`${originFile}/${item}`,`${rootDir}/${addName}/${item}`);
      }
    }
    spinnerStart.stop(true);
  })
  log.success('模版拷贝成功');
}

module.exports = add;
