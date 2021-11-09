const dayjs = require('dayjs');

const { generateDateRange, getTimeDiff } = require('../bin/show');

test('generateDateRange: 2 day', () => {
  const today = dayjs('20211011', 'YYYYMMDD');
  const result = generateDateRange(today, 2, 'day').map((i) =>
    i.format('YYYYMMDD')
  );

  expect(result).toEqual(['20211011', '20211012']);
});

test('generateDateRange: 3 month', () => {
  const today = dayjs('202111', 'YYYYMM');
  const result = generateDateRange(today, 3, 'month').map((i) =>
    i.format('YYYYMM')
  );

  expect(result).toEqual(['202111', '202112', '202201']);
});

test('getTimeDiff: 3 day', () => {
  const start = dayjs('20210917', 'YYYYMMDD');
  const end = dayjs('20210920', 'YYYYMMDD');
  const diff = getTimeDiff(start, end, 'day');

  expect(diff).toBe(3);
});
