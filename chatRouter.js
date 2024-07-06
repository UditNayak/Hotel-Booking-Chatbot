
const express = require('express');


const chatRouter = express.Router();
const { processMessage } = require('./chatbotResponse');

chatRouter.post('/', async (req, res) => {
    const receivedString = req.body.message;

    if (!receivedString) {
        return res.status(400).send('Bad Request: message field is required.');
    }
    try {
        const responseMessage = await processMessage(receivedString);
        console.log("Received: " + responseMessage);
        res.status(200).json(responseMessage);  
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

module.exports = chatRouter;