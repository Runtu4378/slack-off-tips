#!/usr/bin/env node

const yargs = require('yargs')
const chalk = require('chalk')
const axios = require('axios')
const dayjs = require('dayjs')

const version = require('../package.json').version

require('dayjs/locale/zh-cn')
dayjs.locale('zh-cn')

const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

const COMMAND_SHOW = 'show'

function logger () {
  // console.log(typeof arguments)
  for (let i in arguments) {
    console.log(chalk.yellow(arguments[i]))
  }
  // console.log(arguments.forEach(log => chalk.yellow(log)))
}

function generateDateRange(dateStart, length, unit = 'day') {
  const result = [dateStart];

  for (let i = 1; i < length; i += 1) {
    const newDate = dateStart.clone()
    result.push(newDate.add(i, unit))
  }

  return result;
}

function getTimeDiff (start, end, unit = 'day') {
  const baseReset = {
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  }
  let diff = 0

  switch (unit) {
    case 'day': {
      const startDate = start.set(baseReset)
      const endDate = end.set(baseReset)

      logger('startDate: ', startDate)
      logger('endDate: ', endDate)

      diff = endDate.diff(startDate, 'day')
      break;
    }
  }

  return diff
}

async function showOperation (argv) {
  const API = 'https://api.apihubs.cn/holiday/get'
  const today = dayjs().startOf('day')
  const todayText = today.format('YYYY-MM-DD dddd')
  console.log(chalk.green('今天是', todayText))

  let nextWeekend = null

  const nextWeekendDate = generateDateRange(today, 10, 'day').map(i => i.format('YYYYMMDD'))
  logger('获取下一周末的日期范围', nextWeekendDate)
  // 获取10日内的下一周末
  const resp = await axios.get(API, {
    params: {
      // 日期范围
      date: nextWeekendDate.join(','),
      // 只显示周末
      weekend: 1,
      // 升序
      order_by: 1,
    }
  })
  if (resp.status === 200 && resp.data.code === '0') {
    const weekendList = resp.data.data.list;
    if (!weekendList.length) {
      logger('查询不到下一周末')
    } else {
      // 入参必须要字符化
      nextWeekend = dayjs(`${weekendList[0].date}`, 'YYYYMMDD')
      logger('下一周末:', weekendList[0].date)
    }
  } else {
    logger('网络出错')
  }

  let text = `【摸鱼办公室】${today.format('M月D日')}`
  text += `
上午好，摸鱼人，工作再累，一定不要忘记摸鱼哦！
有事没事起身去茶水间去厕所去廊道走走，别老在工位上坐着，钱是老板的，但命是自己的`
  if (nextWeekend) {
    const diff = getTimeDiff(today, nextWeekend)
    logger('下一周末与今天的时间差', diff)
    if (diff > 0) {
    text += `
距离本周周末还有${diff}天`
    }
  }

  console.log(chalk.green(text))
}

function operation (command, argv) {
  if (argv.debug) {
    // 设定 debug 全局变量
    process.env.tipsDebug = true
  }

  if (command === COMMAND_SHOW) {
    showOperation(argv)
  } else {
    console.log(chalk.red('无效的指令'))
  }
}

function initCommand () {
  // 是否开启 DEBUG 模式
  yargs.options('debug', {
    describe: 'open DEBUG mode',
  })

  // 生成摸鱼文案
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


module.exports = {
  generateDateRange,
  getTimeDiff,
}
