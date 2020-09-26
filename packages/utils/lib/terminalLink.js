module.exports = function terminalLink(key, url) {
  if (!url) {
    return require('terminal-link')(key, key);
  } else {
    return require('terminal-link')(key, url);
  }
}
