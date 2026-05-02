const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const choices = ['سنگ', 'کاغذ', 'قیچی'];

// شروع
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🎮 یکی رو انتخاب کن:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🪨 سنگ', callback_data: 'سنگ' },
          { text: '📄 کاغذ', callback_data: 'کاغذ' },
          { text: '✂️ قیچی', callback_data: 'قیچی' }
        ]
      ]
    }
  });
});

// کلیک روی دکمه‌ها
bot.on('callback_query', (query) => {
  const userChoice = query.data;
  const chatId = query.message.chat.id;

  const botChoice = choices[Math.floor(Math.random() * 3)];

  let result = '';

  if (userChoice === botChoice) {
    result = '➖ مساوی شد';
  } else if (
    (userChoice === 'سنگ' && botChoice === 'قیچی') ||
    (userChoice === 'کاغذ' && botChoice === 'سنگ') ||
    (userChoice === 'قیچی' && botChoice === 'کاغذ')
  ) {
    result = '🏆 تو بردی';
  } else {
    result = '❌ باختی';
  }

  bot.answerCallbackQuery(query.id);

  bot.sendMessage(chatId,
    `تو: ${userChoice}\nربات: ${botChoice}\n\n${result}`
  );
});
