/**
 * @file: vercel.js
 * @description: Адаптер для Vercel serverless функций
 * @dependencies: Express app
 * @created: 2025-01-29
 */

const app = require('./dist/index.js');

// Экспортируем для Vercel
module.exports = app; 