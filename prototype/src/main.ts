import { createApp } from './app.js';
import './styles/global.css';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('Missing #app root element.');
}

createApp(root);
