const { sendMessage } = require('./chatbotResponse3');

const processMessage = async (prompt,messages ) => {
  try {
      const response = await sendMessage({prompt, messages});
      console.log("Received: " + response);

      // Format the response if it's an array of objects
    //   if (Array.isArray(response)) {
    //       return response.map(room => `Room Name: ${room.name}, Price: ${room.price}`).join('\n');
    //   }

    // console.log(response[0] );
    return response;
  } catch (error) {
      console.error('Error processing message:', error);
      return null;
  }
};

module.exports = { processMessage };