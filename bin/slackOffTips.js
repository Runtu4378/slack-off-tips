#!/usr/bin/env node

const yargs = require('yargs');
const chalk = require('chalk');

const version = require('../package.json').version;
const constant = require('./constant');
const logger = require('./logger');
const { showOperation } = require('./show');
const { markOperation } = require('./mark');

function operation(command, argv) {
  if (argv.debug) {
    // 设定 debug 全局变量
    process.env.tipsDebug = true;
    logger.info('[command]', command);
    logger.info('[argv]', JSON.stringify(argv));
  }

  if (command === constant.COMMAND_SHOW) {
    showOperation(argv);
  } else if (command === constant.COMMAND_MARK) {
    markOperation(argv.date, argv.name);
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

  // 标记时间锚点
  yargs
    .command(
      `${constant.COMMAND_MARK} <date> <name>`,
      `标记时间锚点, date 格式为 ${constant.MARK_DATE_FORMAT}`,
      () => {},
      (argv) => operation(constant.COMMAND_MARK, argv)
    )
    .demandCommand(2);
}

// init usage
yargs.usage(
  `moyu ${version}
  Usage: moyu [command] [options] 例如:
  # 显示今天的摸鱼文案
  moyu show
  # 增加自定义节日锚点
  moyu mark 2021-12-25 圣诞节`
);

initCommand();

yargs
  .help('h')
  .alias('h', 'help')
  .version(version)
  .alias('version', 'v')
  .showHelpOnFail()
  .strict().argv;
