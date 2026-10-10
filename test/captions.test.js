const test = require('node:test');
const assert = require('node:assert');
const { newWords } = require('../captions.js');

test('first caption is all new', () => assert.deepStrictEqual(newWords('', 'hello there'), ['hello', 'there']));
test('auto captions append words', () => assert.deepStrictEqual(newWords('so today we', 'so today we will build'), ['will', 'build']));
test('rolled-off line is not repeated', () => assert.deepStrictEqual(newWords('so today we will build', 'will build a chrome'), ['a', 'chrome']));
test('unchanged caption adds nothing', () => assert.deepStrictEqual(newWords('same text', 'same text'), []));
test('replaced caption is all new', () => assert.deepStrictEqual(newWords('First line.', 'Second line.'), ['Second', 'line.']));
