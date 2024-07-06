const { sendMessage } = require('./chatbotResponse');

const processMessage = async (message) => {
  try {
      const response = await sendMessage(message);
      console.log("Received: " + response);

      // Format the response if it's an array of objects
      if (Array.isArray(response)) {
          return response.map(room => `Room Name: ${room.name}, Price: ${room.price}`).join('\n');
      }

      return response;
  } catch (error) {
      console.error('Error processing message:', error);
      return null;
  }
};

module.exports = { processMessage };