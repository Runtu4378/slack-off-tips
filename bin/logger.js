module.exports = function logger() {
  if (process.env.tipsDebug) {
    console.log(chalk.yellow(...arguments));
  }
};
