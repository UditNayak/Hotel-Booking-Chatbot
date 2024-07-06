const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;

async function sendMessage({prompt , messages}) {
    const url = 'https://api.openai.com/v1/chat/completions';
    // const messages = [
    //     { role: 'system', content: 'You are a helpful assistant.' },
    //     { role: 'user', content: prompt }
    // ];
    console.log(messages);
    messages.push({ role: 'user', content: prompt });
    const data = {
        model: 'gpt-4',
        messages,
        tools: tools,
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
                getAllRooms: getAllRooms,
                getPrice: getPrice,
                createBooking: createBooking
            };
            console.log(responseMessage);
            messages.push(responseMessage);
            console.log(messages);

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
            }
            console.log(messages);
            const tempData = {
                model: 'gpt-4',
                messages
            };
            const secondResponse = await axios.post(url, tempData, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return secondResponse.data.choices;
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
        "description": "Book a room for a guest. This function books a room for a guest. You need to provide the room ID, guest's full name, email, and the number of nights to book the room for. The function returns the booking confirmation details. The parameters must be JSON encoded. Ask for the information you need from the user before calling this function. Dont create anything from by yourself. ASk for evry parameter to the user until it provides it. This is a very important function . You can use this function to book a room for a guest. You need to provide the room ID, guest's full name, email, and the number of nights to book the room for. The function returns the booking confirmation details. The parameters must be JSON encoded. Ask for the information you need from the user before calling this function. Dont create anything from by yourself. ASk for evry parameter to the user until it provides it. This is a very important function",
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
        console.log("Received: ", response);
        return response;
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

async function createBooking({ roomId, fullName, email, nights }) {
    const bookingData = {
        roomId: roomId,
        fullName: fullName,
        email: email,
        nights: nights
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