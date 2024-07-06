const { Telegraf } = require('telegraf');
require('dotenv').config();
const { processMessage } = require('./openaiHelper');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome! How can I assist you today?'));
bot.help((ctx) => ctx.reply('You can ask me about available rooms, prices, or create a booking.'));

bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text;
    const response = await processMessage(userMessage);
    ctx.reply(response);
});

bot.launch();

console.log('Telegram bot is running...');