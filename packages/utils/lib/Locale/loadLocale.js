function loadLocale() {
  const locale = require('./getEnvLocale');
  if (locale) {
    const localeShortName = locale.split('.')[0].toLocaleLowerCase();
    return require(`./${localeShortName}`);
  } else {
    return require('./zh_cn');
  }
}

module.exports = loadLocale();
