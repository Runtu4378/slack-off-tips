#!/usr/bin/env node

const yargs = require('yargs')
const chalk = require('chalk')

const version = require('../package.json').version

const COMMAND_SHOW = 'show'

function showOperation (argv) {
  console.log(chalk.yellow('show'))
}

function operation (command, argv) {
  if (command === COMMAND_SHOW) {
    showOperation(argv)
  } else {
    console.log(chalk.red('无效的指令'))
  }
}

function initCommand () {
  yargs.command(
    COMMAND_SHOW,
    '生成今天的摸鱼文案',
    () => {},
    argv => operation(COMMAND_SHOW, argv),
  )
}

// init usage
yargs.usage(
  `tips ${version}
  Usage: tips [command] [options]`
)

initCommand()

yargs
  .help('h')
  .alias('h', 'help')
  .version(version)
  .alias('version', 'v')
  .showHelpOnFail()
  .strict()
  .argv;
