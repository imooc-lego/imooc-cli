const inquirer = require('inquirer')

module.exports = function({ choices, defaultValue, message, type = 'list', require = true, mask = '*' ,validate,pageSize,loop}) {
  const options = {
    type,
    name: 'name',
    message,
    default: defaultValue,
    require,
    mask,
    validate,
    pageSize,
    loop
  }
  if (type === 'list') {
    options.choices = choices;
  }
  return inquirer.prompt(options).then((answer) => answer.name)
}
