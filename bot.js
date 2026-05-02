const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const choices = ['سنگ', 'کاغذ', 'قیچی'];

// ذخیره امتیاز
const score = {};

// شروع بازی
function sendGame(chatId) {
  bot.sendMessage(chatId, '🎮 بازی شروع شد!\nیکی رو انتخاب کن:', {
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
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (!score[chatId]) {
    score[chatId] = { win: 0, lose: 0, draw: 0 };
  }

  sendGame(chatId);
});

// کلیک روی دکمه‌ها
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userChoice = query.data;

  if (!score[chatId]) {
    score[chatId] = { win: 0, lose: 0, draw: 0 };
  }

  const botChoice = choices[Math.floor(Math.random() * 3)];

  let result = '';

  if (userChoice === botChoice) {
    result = '➖ مساوی شد';
    score[chatId].draw++;
  } else if (
    (userChoice === 'سنگ' && botChoice === 'قیچی') ||
    (userChoice === 'کاغذ' && botChoice === 'سنگ') ||
    (userChoice === 'قیچی' && botChoice === 'کاغذ')
  ) {
    result = '🏆 تو بردی';
    score[chatId].win++;
  } else {
    result = '❌ باختی';
    score[chatId].lose++;
  }

  const s = score[chatId];

  bot.answerCallbackQuery(query.id);

  // پیام خفن
  bot.sendMessage(chatId,
`🎮 نتیجه بازی

👤 تو: ${userChoice}
🤖 ربات: ${botChoice}

${result}

📊 امتیاز:
🏆 برد: ${s.win}
❌ باخت: ${s.lose}
➖ مساوی: ${s.draw}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔁 دوباره بازی کن', callback_data: 'RESTART' }]
      ]
    }
  });
});

// دکمه ریست
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'RESTART') {
    bot.answerCallbackQuery(query.id);
    sendGame(chatId);
  }
});
