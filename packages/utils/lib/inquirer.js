const inquirer = require('inquirer')

module.exports = function({ choices, defaultValue, message, type = 'list', require = true, mask = '*' }) {
  const options = {
    type,
    name: 'name',
    message,
    default: defaultValue,
    require,
    mask,
  }
  if (type === 'list') {
    options.choices = choices;
  }
  return inquirer.prompt(options).then((answer) => answer.name)
}
