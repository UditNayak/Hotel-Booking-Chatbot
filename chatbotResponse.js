const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;

async function sendMessage(prompt){
    const url = 'https://api.openai.com/v1/chat/completions';
    const data = {
        model: 'gpt-4', // or 'gpt-4-turbo'
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
        ],
        functions :function_descriptions , 
        function_call : "auto"
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        const functionMap = {
            "getPrice": getPrice, 
            "getAllRooms" : getAllRooms,
            "createBooking" : createBooking
        };

        const output = response.data.choices[0].message.function_call;
        
        const function_name = output.name; 
        let argumentsObject = JSON.parse(output.arguments);
       
        const function_response = await functionMap[function_name](argumentsObject);;
        return function_response;
        
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}


const function_descriptions = [
    {
        "name": "getAllRooms",
        "description": "Get the list of all available rooms",
    },
    {
        "name": "getPrice",
        "description": "get the price of a specific room which the user has given",
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
    },
    {
        "name" : "createBooking",
        "description" : "creates a booking of the room after user has given all the parameters",
        "parameters": {
            "type": "object",
            "properties": {
                "roomId":{
                    "type" : "integer",
                    "description" : "Id of the room which user wants to book"
                },
                "fullName":{
                    "type" : "string",
                    "description" : "Name of the user"
                },
                "email":{
                    "type" : "string",
                    "description" : "Email of the user"
                },
                "nights":{
                    "type" : "integer",
                    "description" : "Number of nights the user wants to book the room for"
                }
            },
            "required": ["roomId" , "fullName" , "email" , "nights"]
        }
    }
]

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

async function createBooking({roomId, fullName, email, nights}) {
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

async function getPrice({roomName}) {
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

module.exports = { processMessage };