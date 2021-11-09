const chalk = require('chalk');

function info() {
  if (process.env.tipsDebug) {
    console.log(chalk.yellow(...arguments));
  }
}

function error() {
  console.log(chalk.red(...arguments));
}

module.exports = {
  info,
  error,
};
