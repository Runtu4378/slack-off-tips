#!/usr/bin/env node

const yargs = require('yargs');
const chalk = require('chalk');

const version = require('../package.json').version;
const constant = require('./constant');
const { showOperation } = require('./show');

function operation(command, argv) {
  if (argv.debug) {
    // 设定 debug 全局变量
    process.env.tipsDebug = true;
  }

  if (command === constant.COMMAND_SHOW) {
    showOperation(argv);
  } else {
    console.log(chalk.red('无效的指令'));
  }
}

function initCommand() {
  // 是否开启 DEBUG 模式
  yargs.options('debug', {
    describe: 'open DEBUG mode',
  });

  // 生成摸鱼文案
  yargs.command(
    constant.COMMAND_SHOW,
    '生成今天的摸鱼文案',
    () => {},
    (argv) => operation(constant.COMMAND_SHOW, argv)
  );
}

// init usage
yargs.usage(
  `tips ${version}
  Usage: tips [command] [options]`
);

initCommand();

yargs
  .help('h')
  .alias('h', 'help')
  .version(version)
  .alias('version', 'v')
  .showHelpOnFail()
  .strict().argv;
