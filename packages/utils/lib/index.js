'use strict';

const log = require('./log');
const request = require('./request');
const npm = require('./npm');
const inquirer = require('./inquirer');
const spinner = require('./spinner');
const ejs = require('./ejs');
const terminalLink = require('./terminalLink');

const Package = require('./Package');
const Git = require('./Git/Git');
const file = require('./file');
const locale = require('./Locale/loadLocale');

function sleep(timeout) {
  return new Promise((resolve => {
    setTimeout(resolve, timeout);
  }));
}

function exec(command, args, options) {
  const win32 = process.platform === 'win32';

  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;

  return require('child_process').spawn(cmd, cmdArgs, options || {});
}

function firstUpperCase(str) {
  return str.replace(/^\S/, s => s.toUpperCase());
}

function camelTrans(str, isBig) {
  let i = isBig ? 0 : 1;
  str = str.split('-');
  for (; i < str.length; i += 1) {
    str[i] = firstUpperCase(str[i]);
  }
  return str.join('');
}

function formatName(name) {
  if (name) {
    name = `${name}`.trim();
    if (name) {
      if (/^[.*_\/\\()&^!@#$%+=?<>~`\s]/.test(name)) {
        name = name.replace(/^[.*_\/\\()&^!@#$%+=?<>~`\s]+/g, '');
      }
      if (/^[0-9]+/.test(name)) {
        name = name.replace(/^[0-9]+/, '');
      }
      if (/[.*_\/\\()&^!@#$%+=?<>~`\s]/.test(name)) {
        name = name.replace(/[.*_\/\\()&^!@#$%+=?<>~`\s]/g, '-');
      }
      return camelTrans(name, true);
    } else {
      return name;
    }
  } else {
    return name;
  }
}

function formatClassName(name) {
  return require('kebab-case')(name).replace(/^-/, '');
}

module.exports = {
  log,
  request,
  npm,
  inquirer,
  spinner,
  ejs,
  Package,
  Git,
  sleep,
  exec,
  formatName,
  formatClassName,
  terminalLink,
  ...file,
  locale,
};
