const axios = require('axios');
require('dotenv').config();


// Replace with your OpenAI API key
const apiKey = process.env.OPENAI_API_KEY;

async function sendMessage(prompt) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const data = {
        model: 'gpt-4', // or 'gpt-4-turbo'
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
        ]
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const message = response.data.choices[0].message.content;
        console.log('Response:', message);
        return message;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}


const processMessage = async (message) => {
    try {
        const response = await sendMessage(message);
        console.log("Received: " + response);
        return response;
    } catch (error) {
        console.error('Error processing message:', error);
        return null;
    }
};

module.exports = { processMessage };