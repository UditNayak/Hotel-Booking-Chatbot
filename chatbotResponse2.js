const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;

async function sendMessage(prompt) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
    ];
    const data = {
        model: 'gpt-3.5-turbo', // or 'gpt-4-turbo'
        messages,
        tools: tools,
        // tool_choice: auto,
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const responseMessage = response.data.choices[0].message;
        messages.push(responseMessage);

        if (responseMessage.tool_calls) {
            const tool_calls = responseMessage.tool_calls;
            const tool_call_id = tool_calls[0].id;
            const tool_function_name = tool_calls[0].function.name;
            const tool_parameters = eval(tool_calls[0].function.arguments);
            console.log(tool_parameters);

            if (tool_function_name === "getAllRooms") {
                const roomOptions = await getAllRooms();
                // console.log(roomOptions);

                messages.push({
                    "role": "tool",
                    "tool_call_id": tool_call_id,
                    "name": tool_function_name,
                    "content": JSON.stringify(roomOptions)
                });

                console.log(messages);

                const tempData = {
                    model: 'gpt-3.5-turbo',
                    messages
                };
                const tempResponse = await axios.post(url, tempData, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                let reply = tempResponse.data.choices[0].message;

                console.log(reply.content);

                return reply.content;
            } else if (tool_function_name === "createBooking") {
                const bookingDetails = await createBooking(tool_parameters);
                console.log(bookingDetails);
                messages.push({
                    "role": "tool",
                    "tool_call_id": tool_call_id,
                    "name": tool_function_name,
                    "content": JSON.stringify(bookingDetails)
                });

                const tempData = {
                    model: 'gpt-3.5-turbo',
                    messages
                };
                const tempResponse = await axios.post(url, tempData, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                let reply = tempResponse.data.choices[0].message;

                console.log(reply.content);

                return reply.content;
            } else if (tool_function_name === "getPrice") {
                const price = await getPrice(tool_parameters);
                messages.push({
                    "role": "tool",
                    "tool_call_id": tool_call_id,
                    "name": tool_function_name,
                    "content": JSON.stringify(price)
                });

                const tempData = {
                    model: 'gpt-3.5-turbo',
                    messages
                };
                const tempResponse = await axios.post(url, tempData, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                let reply = tempResponse.data.choices[0].message;

                console.log(reply.content);

                return reply.content;
            } else {
                return "No functions found with the name: " + tool_function_name;
            }
        }
        return responseMessage.content;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

const tools = [
    {
        "name": "getAllRooms",
        "description": "Get the list of all available rooms",
        "type": "function",
        "function": {
            "name": "getAllRooms",
            "parameters": {}
        }
    },
    {
        "name": "getPrice",
        "description": "Get the price of a specific room which the user has given",
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
        "description": "Creates a booking of the room after user has given all the parameters",
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
        console.log("Received: " + response);
        return response;
    } catch (error) {
        console.error('Error processing message:', error);
        return null;
    }
};

async function getAllRooms() {
    try {
        const response = await axios.get('https://bot9assignement.deno.dev/rooms');
        return response.data; // Assuming the response is JSON array of room objects
    } catch (error) {
        console.error('Error fetching rooms:', error);
        throw error; // Handle error appropriately in your application
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
        return response.data; // Assuming the response returns a booking ID
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error; // Handle error appropriately in your application
    }
}

async function getPrice({ roomName }) {
    const url = 'https://bot9assignement.deno.dev/rooms';

    try {
        const response = await fetch(url);
        const rooms = await response.json();

        // Find the room object with matching name
        const room = rooms.find(room => room.name.toLowerCase() == roomName.toLowerCase());

        if (room) {
            return room.price;
        } else {
            throw new Error(`Room '${roomName}' not found.`);
        }
    } catch (error) {
        console.error('Error fetching room data:', error);
        // Handle error as per your application's requirement
        throw error;
    }
}

module.exports = { processMessage, sendMessage };