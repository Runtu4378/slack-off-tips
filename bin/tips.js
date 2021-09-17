#!/usr/bin/env node

const yargs = require('yargs')
const chalk = require('chalk')
const axios = require('axios')
const dayjs = require('dayjs')
const { Lunar } = require('lunar-javascript')

const version = require('../package.json').version

require('dayjs/locale/zh-cn')
dayjs.locale('zh-cn')

const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

var isBetween = require('dayjs/plugin/isBetween')
dayjs.extend(isBetween)

const API = 'https://api.apihubs.cn/holiday/get'
const COMMAND_SHOW = 'show'

function logger () {
  if (process.env.tipsDebug) {
    console.log(chalk.yellow(...arguments))
  }
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
  let diff = 0

  switch (unit) {
    case 'day': {
      diff = end.diff(start, 'day')
      break;
    }
  }

  return diff
}

/** 获取下一周末 */
async function getNextWeekend (today) {
  let nextWeekend = null

  // 获取10日内的下一周末
  const nextWeekendDate = generateDateRange(today, 10, 'day').map(i => i.format('YYYYMMDD'))
  logger('获取下一周末的日期范围', nextWeekendDate)
  const resp = await axios.get(API, {
    params: {
      // 日期范围
      date: nextWeekendDate.join(','),
      // 只显示非工作日
      workday: 2,
      // 升序
      order_by: 1,
      // 中文描述
      cn: 1,
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

  return nextWeekend
}

/** 获取接下来半年的节假日 */
async function getHoliday (today) {
  const holidayArr = []

  const nextHalfYearMonth = generateDateRange(today, 6, 'month')
  const month = nextHalfYearMonth.map(i => i.format('YYYYMM'))
  logger('获取下半年假日的日期范围', month)
  const resp = await axios.get(API, {
    params: {
      // 日期范围
      month: month.join(','),
      // 只显示节假日假日
      holiday_recess: 1,
      // 升序
      order_by: 1,
      // 中文描述
      cn: 1,
    }
  })

  if (resp.status === 200 && resp.data.code === '0') {
    const baseArr = resp.data.data.list
    let holidayAnchor

    for (let i = 0, j = baseArr.length; i < j; i += 1) {
      const item = baseArr[i];
      if (holidayAnchor === item.holiday) {
        continue
      } else {
        holidayAnchor = item.holiday
        holidayArr.push([
          dayjs(`${item.date}`, 'YYYYMMDD'),
          `${item.holiday_cn}假期`,
          item.holiday,
        ])
      }
    }
  }

  // 因为每年实际的假期安排一般在11月中发布，下面加一点预设逻辑
  // 元旦假期的预设逻辑（大概率从01月01日开始）
  // 春节假期的预设逻辑（大概率从除夕夜开始）
  const firstMonthInRange = nextHalfYearMonth[0]
  const lastMonthInRange = nextHalfYearMonth[nextHalfYearMonth.length - 1]

  let ifyuandan = true
  const yuandan = lastMonthInRange.clone().set('month', 0).set('date', 1)
  logger('预计元旦日期:', yuandan.format('YYYY-MM-DD'))

  if (yuandan.isBetween(firstMonthInRange, lastMonthInRange)) {
    ifyuandan = false

    for (let i = 0, j = holidayArr.length; i < j; i += 1) {
      const item = holidayArr[i]
      if (item[2] === 22) {
        ifyuandan = true
        break
      }
    }
  }

  logger('是否包含远端元旦假期:', ifyuandan)
  if (!ifyuandan) {
    holidayArr.push([
      yuandan,
      `元旦假期`,
      22,
    ])
  }

  let ifSpring = true
  const spring = Lunar.fromYmd(lastMonthInRange.get('year'), 1, 1).getSolar()
  logger(spring)
  const springEve = dayjs(spring.toString(), 'YYYY-MM-DD').subtract(1, 'day')
  logger('预计除夕日期:', springEve.format('YYYY-MM-DD'))

  if (springEve.isBetween(firstMonthInRange, lastMonthInRange)) {
    ifSpring = false

    for (let i = 0, j = holidayArr.length; i < j; i += 1) {
      const item = holidayArr[i]
      if (item[2] === 11) {
        ifSpring = true
        break
      }
    }
  }

  logger('是否包含远端春节假期:', ifSpring)
  if (!ifSpring) {
    holidayArr.push([
      springEve,
      `春节假期`,
      11,
    ])
  }

  return holidayArr
}

async function showOperation (argv) {
  const date = dayjs()
  const today = date.startOf('day')
  const todayText = today.format('YYYY-MM-DD dddd')
  console.log(chalk.green('今天是', todayText))

  const nextWeekend = await getNextWeekend(today)
  const nextHoliday = await getHoliday(today)

  const hour = date.get('hour')
  logger('hour:', hour)
  const state = hour >= 12 ? '下午' : '上午'

  let text = `【摸鱼办公室】${today.format('M月D日')}`
  text += `
${state}好，摸鱼人，工作再累，一定不要忘记摸鱼哦！
有事没事起身去茶水间去厕所去廊道走走，别老在工位上坐着，钱是老板的，但命是自己的`

  if (nextWeekend) {
    const diff = getTimeDiff(today, nextWeekend)
    logger('下一周末与今天的时间差', diff)
    if (diff > 0) {
      if (diff === 1) {
        text += `
明天周末`
      } else {
        text += `
距离本周周末还有${diff - 1}天`
      }
    }
  }

  if (nextHoliday.length) {
    nextHoliday.forEach(([date, name]) => {
      const diff = getTimeDiff(today, date)
      logger('节日:', date.format('YYYY-MM-DD'), name, diff)
      if (diff > 0) {
      text += `
距离${name}还有${diff - 1}天`
      }
    })
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
