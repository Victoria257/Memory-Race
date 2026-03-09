import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Buffer } from 'buffer';
import EventEmitter from 'events';
import util from 'util';
import App from './App.tsx';
import './index.css';

// simple-peer polyfills
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = Buffer;
  (window as any).EventEmitter = EventEmitter;
  (window as any).util = util;
  (window as any).process = {
    env: { DEBUG: undefined },
    version: 'v16.0.0',
    nextTick: (fn: any, ...args: any[]) => setTimeout(() => fn(...args), 0),
    browser: true,
    on: () => {},
    removeListener: () => {},
    emit: () => {},
    listeners: () => [],
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
