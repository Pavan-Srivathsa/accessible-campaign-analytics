import { defineConfig } from 'vite';
export default defineConfig({server:{proxy:{'/api':'http://127.0.0.1:3001'}},preview:{host:'0.0.0.0'}});
