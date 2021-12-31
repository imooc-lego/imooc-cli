'use strict';
const fse = require('fs-extra')
const fs = require('fs')
const pkgUp = require('pkg-up')
const path = require('path')
const pathExists = require('path-exists').sync;
const npminstall = require('npminstall')

const { homedir } = require('os')
const { ADD_CONTENT,DEFAULT_TYPE,ADD_PAGES_TEMPLATE,DEFAULT_CLI_HOME} = require('./const')
const {  inquirer,log ,npm,spinner,exec,sleep} = require('@imooc-cli/utils');

const useOriginNpm = false;

async function add () {
  // 1. 选择添加的类型
  let addType = await getAddType()
  log.verbose('addType',addType)
  let addName
  if(addType === 'page') {
    addName= await getAddName(addType)
    log.verbose('addName',addName)
  }
  // 2. 选择添加模版
  let addTemplate = await getAddTemplate()
  log.verbose('addTemplate',addTemplate)
  const selectedTemplate = ADD_PAGES_TEMPLATE.find(item => item.name === addTemplate);
  log.verbose('selectedTemplate',selectedTemplate)
   // 获取最新版本号
  selectedTemplate.templateVersion = await npm.getLatestVersion(selectedTemplate.npmName)
    // 生成缓存文件目录
  // process.env.CLI_HOME 没有获取到，这里直接写
  const targetPath = path.resolve(`${homedir()}/${DEFAULT_CLI_HOME}`, 'addTemplate');
  log.verbose('targetPath',targetPath)
  // 下载对应的模版文件
  // 下载的模版需要安装到缓存中，安装时从本地缓存文件中查找（更新/安装）
  // 指定存放模版文件的目录为 (/Users/liumeng/.imooc-cli/addTemplate)
  // 判断缓存文件是否存在（更新/安装的逻辑判断）
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
  // 3. 读取缓存项目中的package.json和当前项目中的package.json信息进行对比
  // 读取缓存项目中的package.json和当前项目中的package.json信息进行对比
  // 4. 安装项目依赖
  // await dependencyInit(targetPath,selectedTemplate)
  const rootDir = process.cwd()
  // 5.获取当前目录，拷贝内容到当前目录下
  fse.ensureDirSync(targetPath);
  if(pathExists(`${rootDir}/${addName}`)){
    log.error(`当前目录下已经存在 ${addName} 文件`)
    return
  }else{
    fse.ensureDirSync(`${rootDir}/${addName}`);
  }
  // let spinnerStart = spinner(`正在拷贝模板文件...`);
  // await sleep(1000);
  // fse.copySync(`${cacheFilePath(targetPath,selectedTemplate)}/template/src`, `${rootDir}/${addName}`);
  // 拷贝的内容要进行处理，将src下不需要的内容进行剔除
  // fse.copySync(`${cacheFilePath(targetPath,selectedTemplate)}/${selectedTemplate.template}`, `${rootDir}/${addName}`,{filter:filterFile});
  // console.log(fs.readFile(`${cacheFilePath(targetPath,selectedTemplate)}/${selectedTemplate.template}`),12222)
  await copyFile(targetPath,selectedTemplate,rootDir,addName)
  // spinnerStart.stop(true);
  // log.success('模版拷贝成功');

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
function getAddName(addType) {
  return inquirer({
    type: 'string',
    message: '请输入文件名称',
    defaultValue: '',
  });
}
// 选择项目模版
function getAddTemplate(){
  return inquirer({
    choices: ADD_PAGES_TEMPLATE,
    message: '请选择页面模版',
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
  // const diffDevDependencies = await dependencyDiff(targetPathPkgJson.devDependencies,rootDirPkgJson.devDependencies,'devDependencies')
  // log.verbose('依赖项 devDependencies 对比',diffDevDependencies)
  if(diffDependencies && diffDependencies.length > 0 ){
    // 安装 dependencies 依赖
    await writeDependency(diffDependencies,await pkgUp())
    log.success('当前项目中dependencies已经是最新依赖');
  }
  // if(diffDevDependencies && diffDevDependencies.length > 0){
  //   // 安装 devDependencies 依赖
  //   await writeDependency(diffDevDependencies,await pkgUp(),'devDependencies')
  // }else{
  //   log.success('当前项目中devDependencies已经是最新依赖');
  // }
  await addNpminstall(rootDir)
  log.success('下载依赖成功');
}
// 依赖对比
function dependencyDiff(template,origin,type){
  if(template && origin){
    const templateList = objToArr(template)
    const originList = objToArr(origin)
    const diff = templateList.filter(function (val) { return originList.indexOf(val) === -1 })
    const intersection = templateList.filter(function (val) { return originList.indexOf(val) > -1 })
    if(intersection && intersection.length > 0 ){
      log.error(`两者存在依赖版本冲突，请手动选择版本: ${intersection}`)
      intersection.map((item) => {
        log.warn(`${type}: 模版项目 ${item} 版本号：${template[item]} ==> 当前项目 ${item} 版本号：${origin[item]}`)
      })
      return
    }else{
      // 计算依赖是否相同
      return diff
    }
  }else if(template){
    return objToArr(template)
  }else {
    return
  }
}
// 将依赖写入package.json文件
async function writeDependency(dependencyList,targetPath){
  const data = JSON.parse(fs.readFileSync(targetPath,'utf-8'))
  // if(type ==='dependencies'){
    dependencyList.map((item) => {
      data.dependencies[Object.keys(item)[0]] = Object.values(item)[0]
    })
  // }else{
    // dependencyList.map((item) => {
    //   data.devDependencies[Object.keys(item)[0]] = Object.values(item)[0]
    // })
  // }
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
// // filterFile 过滤文件 文件过滤无效 只能获取到目标文件名和源文件名
// function filterFile (src,dest,aa){
//   console.log(src,dest,aa,12)
//   return true
// }
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
    log.success('模版拷贝成功');
  })
}



module.exports = add;
