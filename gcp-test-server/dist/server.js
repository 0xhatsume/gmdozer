"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Basic logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.url} - START`);
    next();
});
// Root endpoint
app.get('/', (req, res) => {
    console.log('Root request received');
    res.send('Hello World');
});
// Ping endpoint with immediate response
app.get('/ping', (req, res) => {
    console.log('Ping request received');
    const response = {
        message: 'pong',
        timestamp: new Date().toISOString()
    };
    console.log('Sending response:', response);
    res.status(200).json(response);
});
// Health check
app.get('/_ah/health', (req, res) => {
    console.log('Health check received');
    res.status(200).send('ok');
});
const PORT = process.env.PORT || 8081;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} at ${new Date().toISOString()}`);
});
// Error handling
server.on('error', (error) => {
    console.error('Server error:', error);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.error(error.stack);
});
