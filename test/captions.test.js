const test = require('node:test');
const assert = require('node:assert');
const { newWords } = require('../captions.js');

test('first caption is all new', () => assert.deepStrictEqual(newWords('', 'hello there'), ['hello', 'there']));
test('auto captions append words', () => assert.deepStrictEqual(newWords('so today we', 'so today we will build'), ['will', 'build']));
test('rolled-off line is not repeated', () => assert.deepStrictEqual(newWords('so today we will build', 'will build a chrome'), ['a', 'chrome']));
test('unchanged caption adds nothing', () => assert.deepStrictEqual(newWords('same text', 'same text'), []));
test('replaced caption is all new', () => assert.deepStrictEqual(newWords('First line.', 'Second line.'), ['Second', 'line.']));

const { json3Cues, toSentences } = require('../captions.js');

test('json3 auto captions become word cues', () => {
  const json = { events: [{ tStartMs: 1000, dDurationMs: 3000, wWinId: 1 }, { tStartMs: 1000, dDurationMs: 3000, segs: [{ utf8: 'so' }, { utf8: ' today', tOffsetMs: 400 }] }, { tStartMs: 2000, segs: [{ utf8: '\n' }] }] };
  assert.deepStrictEqual(json3Cues(json), [{ start: 1, end: 4, text: 'so' }, { start: 1.4, end: 4, text: 'today' }]);
});

test('punctuated cues merge into sentences', () => {
  const cues = [{ start: 1, end: 2, text: 'Today we' }, { start: 2, end: 3, text: 'build it.' }, { start: 4, end: 5, text: 'Done!' }];
  assert.deepStrictEqual(toSentences(cues), [{ start: 1, end: 3, text: 'Today we build it.' }, { start: 4, end: 5, text: 'Done!' }]);
});

test('unpunctuated words split on pauses', () => {
  const words = ['so', 'today', 'we'].map((text, i) => ({ start: i * 0.3, end: 5, text })).concat({ start: 2, end: 5, text: 'build' });
  assert.deepStrictEqual(toSentences(words).map((s) => s.text), ['so today we', 'build']);
});

test('long sentences are capped at 10s', () => {
  const cues = Array.from({ length: 12 }, (_, i) => ({ start: i, end: i + 1, text: 'word,' })).concat({ start: 12, end: 13, text: 'end.' });
  assert.deepStrictEqual(toSentences(cues).map((s) => s.start), [0, 11]);
});
