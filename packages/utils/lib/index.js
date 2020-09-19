'use strict';

const log = require('./log');
const request = require('./request');
const npm = require('./npm');
const inquirer = require('./inquirer');
const spinner = require('./spinner');

const Package = require('./Package');

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

module.exports = {
  log,
  request,
  npm,
  inquirer,
  spinner,
  Package,
  sleep,
  exec,
};
