import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Buffer } from 'buffer';
import process from 'process';
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
  (window as any).process = process;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
