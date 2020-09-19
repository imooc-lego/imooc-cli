const inquirer = require('inquirer')

module.exports = function({ choices, defaultValue, message, type = 'list', require = true }) {
  const options = {
    type,
    name: 'name',
    message,
    default: defaultValue,
    require
  }
  if (type === 'list') {
    options.choices = choices;
  }
  return inquirer.prompt(options).then((answer) => answer.name)
}
