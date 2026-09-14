const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveLanguageChoice,
  resolveSelectionChoice,
  getApplicationStatusText,
  MOCK_APPLICATIONS,
} = require('./ivr-flow');

test('resolveLanguageChoice maps digits to supported IVR languages', () => {
  assert.equal(resolveLanguageChoice('1'), 'hi-IN');
  assert.equal(resolveLanguageChoice('2'), 'en-IN');
  assert.equal(resolveLanguageChoice('3'), 'pa-IN');
  assert.equal(resolveLanguageChoice('9'), null);
});

test('resolveSelectionChoice maps user intents', () => {
  assert.equal(resolveSelectionChoice('1'), 'scheme_info');
  assert.equal(resolveSelectionChoice('2'), 'application_track');
  assert.equal(resolveSelectionChoice('3'), 'talk_to_executor');
  assert.equal(resolveSelectionChoice('4'), 'further_help');
  assert.equal(resolveSelectionChoice('5'), null);
});

test('mock application tracker returns matching application and localized text', () => {
  const app = MOCK_APPLICATIONS[0];
  const text = getApplicationStatusText(app.applicationNumber, 'hi-IN');
  assert.match(text, /APP-1001|1001|PM Kisan|योजना|स्थिति/i);
  assert.ok(text.length > 30);
});
