import { describe, it, expect } from 'vitest';
import { supportsAdaptiveThinking } from './agent.js';

// Regression guard. `thinking: {type:'adaptive'}` and `output_config.effort`
// were once sent unconditionally, which 400s the entire request on models that
// don't support them ("adaptive thinking is not supported on this model") —
// including claude-haiku-4-5, which docs/whatsapp-agent.md recommends as the
// cheap WHATSAPP_AGENT_MODEL override. Every reply became the generic error.

describe('supportsAdaptiveThinking', () => {
  it('accepts the models that support it', () => {
    for (const m of [
      'claude-opus-5', 'claude-opus-4-8', 'claude-opus-4-7', 'claude-opus-4-6',
      'claude-sonnet-5', 'claude-sonnet-4-6', 'claude-fable-5', 'claude-mythos-5',
    ]) {
      expect(supportsAdaptiveThinking(m), m).toBe(true);
    }
  });

  it('rejects models that do not — this is the bug that shipped', () => {
    for (const m of [
      'claude-haiku-4-5',   // the documented cost override
      'claude-sonnet-4-5',
      'claude-opus-4-5',
      'claude-opus-4-1',
      'claude-3-5-sonnet-20241022',
    ]) {
      expect(supportsAdaptiveThinking(m), m).toBe(false);
    }
  });

  it('fails closed on anything unrecognised', () => {
    // An unknown model just goes without the params and still gets an answer;
    // the opposite default would 400 every future model until someone noticed.
    for (const m of ['some-future-model', '', null, undefined, 'claude-opus', 42]) {
      expect(supportsAdaptiveThinking(m), String(m)).toBe(false);
    }
  });

  it('does not match on a version prefix', () => {
    // "sonnet-4-6" must not match "sonnet-4-60"
    expect(supportsAdaptiveThinking('claude-sonnet-4-60')).toBe(false);
    expect(supportsAdaptiveThinking('claude-opus-4-80')).toBe(false);
  });
});
