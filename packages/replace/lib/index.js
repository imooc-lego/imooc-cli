'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const fse = require('fs-extra');
const glob = require('glob');
const { log } = require('@imooc-cli/utils');

async function replace(params) {
  try {
    console.log(params);
    assert(params.ossAccessKey, 'oss accessKey不能为空！');
    assert(params.ossSecretKey, 'oss secretKey不能为空！');
    log.info('检查是否为打卡项目');
    assert(checkProject() === true, '当前项目不是打卡项目！');
    log.info('遍历images文件夹');
    const imageDirs = await lookAtImages();
    log.info('上传图片至OSS');
    const imageObj = await uploadAllImagesToOSS(imageDirs, params);
    log.info('Markdown图片替换');
    await replaceMarkdown(imageObj);
    log.info('开始删除图片');
    await removeImage(imageObj);
    log.info('执行完毕');
  } catch (e) {
    if (process.env.LOG_LEVEL === 'verbose') {
      console.error(e);
    } else {
      log.error(e.message);
    }
  }
}

function removeImage(imageObj) {
  Object.keys(imageObj).forEach(file => {
    const filePath = path.resolve(file);
    if (fs.existsSync(filePath)) {
      fse.removeSync(filePath);
    }
  });
}

async function replaceMarkdown(imageObj) {
  const keys = Object.keys(imageObj);
  for (const file of keys) {
    const match = file.match(/^docs\/pages\/([^\/]+)\/images\/.+$/);
    if (match && match.length > 1) {
      const dir = match[1];
      await replaceSingleMarkdown({
        file,
        dir,
        url: imageObj[file],
      });
    }
  }
}

async function replaceSingleMarkdown(params) {
  return new Promise((resolve, reject) => {
    glob(`docs/pages/${params.dir}/*.md`, {
      nodir: true,
    }, function(err, files) {
      if (err) {
        reject(err);
      } else {
        for (const file of files) {
          const dir = path.resolve(file);
          const image = path.basename(params.file);
          const url = params.url;
          let content = fs.readFileSync(dir).toString();
          const reg = new RegExp('!\\[.*\\]\\([^)]*' + image + '\\)', 'g');
          const result = reg.exec(content);
          if (result && result.length > 0) {
            content = content.replace(reg, '![](' + url + ')');
            fs.writeFileSync(dir, content);
          }
        }
        resolve(files);
      }
    });
  });
}

function checkProject() {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const src = path.resolve(process.cwd(), 'docs');
  if (fs.existsSync(pkgPath) && fs.existsSync(src)) {
    const pkg = require(pkgPath);
    if (pkg.name === 'students-learn-task') {
      return true;
    }
  }
  return false;
}

async function lookAtImages() {
  return new Promise((resolve, reject) => {
    glob('docs/**/images', {
      cwd: process.cwd(),
    }, function(err, files) {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

async function uploadAllImagesToOSS(imageDirs, params) {
  const imageObj = {};
  const results = [];
  const oss = require('ali-oss')({
    accessKeyId: params.ossAccessKey,
    accessKeySecret: params.ossSecretKey,
    bucket: params.bucket || 'imooc-lego-homework',
    region: params.region || 'oss-cn-hangzhou',
  });
  for (const dir of imageDirs) {
    const result = await uploadImageToOSS(dir, oss);
    results.push(...result);
  }
  results.map(item => imageObj[item.key] = item.url);
  return imageObj;
}

async function uploadImageToOSS(imageDir, oss) {
  return new Promise((resolve, reject) => {
    glob(`${imageDir}/**`, {
      nodir: true,
    }, async function(err, files) {
      if (err) {
        reject(err);
      } else {
        const o = {};
        for (const file of files) {
          const localPath = path.resolve(file);
          log.info('开始上传[' + localPath + ']...');
          const ossRes = await oss.put(file, localPath);
          if (ossRes && ossRes.res.status === 200) {
            o[file] = ossRes.url;
          }
        }
        resolve(files.map(file => ({
          key: file,
          url: o[file],
        })));
      }
    });
  });
}

module.exports = replace;
