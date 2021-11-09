const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const dayjs = require('dayjs');
const chalk = require('chalk');

const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

const logger = require('./logger');
const constant = require('./constant');

const DB_FILE_NAME = '.SLACK_OFF_TIPS_MARK';
const DB_PATH = path.resolve(os.homedir(), DB_FILE_NAME);
const DB_RECORD_DIVISION = '\n';

/** 读取锚点记录 */
function getDBContent() {
  fs.ensureFileSync(DB_PATH);

  const content = fs.readFileSync(DB_PATH, 'utf-8');

  return content || '';
}

/** 保存锚点记录 */
function setDBContent(value) {
  fs.ensureFileSync(DB_PATH);
  fs.writeFileSync(DB_PATH, value);
}

function formattingDBContent(value) {
  let val = [];

  try {
    const lineArr = value.split(DB_RECORD_DIVISION);
    for (let i = 1, j = lineArr.length; i < j; ) {
      const date = lineArr[i];
      const name = lineArr[i + 1];

      if (date && name) {
        val.push([date, name]);
        i += 2;
      } else {
        break;
      }
    }
  } catch (e) {
    const msg = '转换保存记录时出现了问题: ' + e.message;
    logger.error(msg);
    process.exit();
  }

  return val;
}

function getFormattedDBContent() {
  const saveContent = getDBContent();
  const markArr = formattingDBContent(saveContent);

  return markArr;
}

function markOperation(date, name) {
  logger.info('[markOperation]', 'date', date);
  logger.info('[markOperation]', 'name', name);

  // 输入合法性校验
  const dateInput = dayjs(date, constant.MARK_DATE_FORMAT);
  if (!dateInput.isValid()) {
    logger.error(
      `输入的 date 不是合法的日期字符串，格式为 ${constant.MARK_DATE_FORMAT}`
    );
    process.exit();
  }

  if (!name) {
    logger.error('请输入锚点的名称');
    process.exit();
  }

  const saveContent = getFormattedDBContent();
  logger.info('[markOperation]', 'DB', saveContent);

  const contentToSave = [];
  if (!saveContent.length) {
    contentToSave.push(date);
    contentToSave.push(name);
  } else {
    const afterSort = [...saveContent, [date, name]].sort((before, next) => {
      const beforeTS = dayjs(before[0], constant.MARK_DATE_FORMAT).unix();
      const nextTS = dayjs(next[0], constant.MARK_DATE_FORMAT).unix();

      return beforeTS - nextTS;
    });

    afterSort.forEach((i) => {
      contentToSave.push(i[0]);
      contentToSave.push(i[1]);
    });
  }

  // 保存数据
  contentToSave.unshift(
    '# 这是存放 npm 模块 slack-off-tips 的用户自定义节日锚点的数据文件'
  );
  setDBContent(contentToSave.join(DB_RECORD_DIVISION));
  console.log(chalk.yellow('保存成功:', DB_PATH));
}

module.exports = {
  getFormattedDBContent,
  markOperation,
};
