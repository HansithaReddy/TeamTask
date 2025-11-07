import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// jsdom doesn't implement ResizeObserver which many chart libraries rely on.
// Provide a minimal stub so components using it won't throw in tests.
if (typeof global.ResizeObserver === 'undefined') {
  class ResizeObserver {
    constructor(cb) { this.cb = cb }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserver
}