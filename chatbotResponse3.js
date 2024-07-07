const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;

async function sendMessage({ prompt, messages }) {
    const url = 'https://api.openai.com/v1/chat/completions';

    messages.push({ role: 'user', content: prompt });

    const data = {
        model: 'gpt-3.5-turbo',
        messages,
        tools,
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const responseMessage = response.data.choices[0].message;
        const toolCalls = responseMessage.tool_calls;

        if (toolCalls) {
            const availableFunctions = {
                getAllRooms,
                getPrice,
                createBooking
            };

            messages.push(responseMessage);

            for (const toolCall of toolCalls) {
                const functionName = toolCall.function.name;
                const functionToCall = availableFunctions[functionName];
                const functionArgs = JSON.parse(toolCall.function.arguments);
                const functionResponse = await functionToCall(functionArgs);

                messages.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: functionName,
                    content: JSON.stringify(functionResponse),
                });

                // Check for missing parameters and prompt the user
                if (functionResponse.missingParams) {
                    for (const prompt of functionResponse.prompts) {
                        messages.push({ role: 'assistant', content: prompt });
                    }

                    // Re-send message with updated messages to gather missing info
                    return await sendMessage({ prompt: '', messages });
                }
            }

            const tempData = {
                model: 'gpt-3.5-turbo',
                messages
            };
            const secondResponse = await axios.post(url, tempData, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return secondResponse.data.choices[0].message.content;
        } else {
            return response.data.choices[0].message.content;
        }
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

const tools = [
    {
        "name": "getAllRooms",
        "description": "Get the available room options. This function returns a list of rooms that are available to book. You can get all the information of the rooms from this function.",
        "type": "function",
        "function": {
            "name": "getAllRooms",
            "parameters": {}
        }
    },
    {
        "name": "getPrice",
        "description": "Get the price of a specific room. This function returns the price of the room.",
        "type": "function",
        "function": {
            "name": "getPrice",
            "parameters": {
                "type": "object",
                "properties": {
                    "roomName": {
                        "type": "string",
                        "description": "the name of the specific room"
                    }
                },
                "required": ["roomName"]
            }
        }
    },
    {
        "name": "createBooking",
        "description": "Book a room for a guest. This function books a room for a guest. You need to provide the room ID, guest's full name, email, and the number of nights to book the room for. The function returns the booking confirmation details. The parameters must be JSON encoded. Ask for the information you need from the user before calling this function. Don't create anything by yourself. Ask for every parameter from the user until it is provided.",
        "type": "function",
        "function": {
            "name": "createBooking",
            "parameters": {
                "type": "object",
                "properties": {
                    "roomId": {
                        "type": "integer",
                        "description": "Id of the room which user wants to book"
                    },
                    "fullName": {
                        "type": "string",
                        "description": "Name of the user"
                    },
                    "email": {
                        "type": "string",
                        "description": "Email of the user"
                    },
                    "nights": {
                        "type": "integer",
                        "description": "Number of nights the user wants to book the room for"
                    }
                },
                "required": ["roomId", "fullName", "email", "nights"]
            }
        }
    }
];

const processMessage = async (message) => {
    try {
        const response = await sendMessage(message);
        let messages = message.messages;

        if (response && response[0].tool_calls) {
            for (const toolCall of response[0].tool_calls) {
                const { name, content } = toolCall;
                const functionResponse = JSON.parse(content);

                if (functionResponse.missingParams) {
                    for (const prompt of functionResponse.prompts) {
                        messages.push({ role: 'assistant', content: prompt });
                    }
                } else {
                    messages.push({ role: 'assistant', content: `Booking confirmed: ${JSON.stringify(functionResponse)}` });
                }
            }
        }

        return messages;
    } catch (error) {
        console.error('Error processing message:', error);
        return null;
    }
};

async function getAllRooms() {
    try {
        const response = await axios.get('https://bot9assignement.deno.dev/rooms');
        return response.data;
    } catch (error) {
        console.error('Error fetching rooms:', error);
        throw error;
    }
}

async function createBooking(args) {
    const requiredParams = ['roomId', 'fullName', 'email', 'nights'];
    const missingParams = requiredParams.filter(param => !args[param]);

    if (missingParams.length > 0) {
        const prompts = missingParams.map(param => `Please provide your ${param}:`);
        return { missingParams, prompts };
    }

    const bookingData = {
        roomId: args.roomId,
        fullName: args.fullName,
        email: args.email,
        nights: args.nights
    };

    try {
        const response = await axios.post('https://bot9assignement.deno.dev/book', bookingData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
}

async function getPrice({ roomName }) {
    const url = 'https://bot9assignement.deno.dev/rooms';

    try {
        const response = await axios.get(url);
        const rooms = response.data;

        const room = rooms.find(room => room.name.toLowerCase() === roomName.toLowerCase());

        if (room) {
            return room.price;
        } else {
            throw new Error(`Room '${roomName}' not found.`);
        }
    } catch (error) {
        console.error('Error fetching room data:', error);
        throw error;
    }
}

module.exports = { processMessage, sendMessage };