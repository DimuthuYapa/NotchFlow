import { describe, expect, it } from 'vitest'
import { classifyLocally, nextFocusState } from './focus'

describe('local URL classification', () => {
  it('honours approved subdomains', () => expect(classifyLocally('https://docs.github.com/en', ['github.com']).decision).toBe('approved'))
  it('flags known distracting sites', () => expect(classifyLocally('https://www.youtube.com/watch?v=x', []).decision).toBe('distracting'))
  it('starts grace only for a distracting tab', () => expect(nextFocusState('distracting', true)).toBe('grace'))
})
