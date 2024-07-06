const express = require('express');
const bodyParser = require('body-parser');
const chatRouter = require('./chatRouter'); // Import the router

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Use the chatRouter for /chat routes
app.use('/chat', chatRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});