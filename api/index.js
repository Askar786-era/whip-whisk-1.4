/**
 * Vercel Serverless Function Entry Point
 * Routes all /api/* requests to the Whip & Whisk Express app
 */

const app = require('../server');

module.exports = app;
