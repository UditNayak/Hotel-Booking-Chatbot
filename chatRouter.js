
const express = require('express');


const chatRouter = express.Router();
const { processMessage } = require('./chatbotResponse3');

const messages = [
    { role: 'system', content: 'You are a helpful assistant.' }
];

chatRouter.post('/', async (req, res) => {
    const prompt = req.body.message;

    if (!prompt) {
        return res.status(400).send('Bad Request: message field is required.');
    }
    try {
        console.log(messages);
        const responseMessage = await processMessage({prompt , messages});
        console.log("Received: " + responseMessage);
        res.status(200).json(responseMessage);  
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

module.exports = chatRouter;