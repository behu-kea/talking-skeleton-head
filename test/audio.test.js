import test from 'node:test';
import assert from 'node:assert/strict';
import { jawFromSamples, speechText } from '../src/audio.js';
test('jaw closes during silence and quiet noise', () => {
  assert.equal(jawFromSamples(new Float32Array(512)), 0);
  assert.equal(jawFromSamples(new Float32Array(512).fill(.005)), 0);
  assert.equal(jawFromSamples([]), 0);
});
test('jaw follows signal energy, is polarity independent, and clamps loud audio', () => {
  const low = jawFromSamples([.02, -.02]); const high = jawFromSamples([.04, -.04]);
  assert.ok(low > 0 && high > low); assert.equal(jawFromSamples([1, -1]), 1);
  assert.equal(jawFromSamples([-.02, .02]), low);
  assert.ok(jawFromSamples([.02], 4) > jawFromSamples([.02], 1));
});
test('only models without audio tag support have tags removed', () => {
  assert.equal(speechText('[whispers] Hej, søulk! [laughs]', 'eleven_multilingual_v2'), 'Hej, søulk!');
  assert.equal(speechText('[whispers] Hej, søulk! [laughs]', 'eleven_v3'), '[whispers] Hej, søulk! [laughs]');
});
