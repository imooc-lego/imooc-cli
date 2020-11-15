function getEnvLocale(env) {
  env = env || process.env;
  return env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE;
}

module.exports = getEnvLocale();
