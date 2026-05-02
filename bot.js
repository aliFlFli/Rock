const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const choices = ['سنگ', 'کاغذ', 'قیچی'];

// ذخیره امتیاز ساده (موقتی داخل RAM)
const score = {};

// شروع
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (!score[chatId]) {
    score[chatId] = { win: 0, lose: 0, draw: 0 };
  }

  bot.sendMessage(chatId, '🎮 بازی سنگ کاغذ قیچی\nیکی رو انتخاب کن:', {
    reply_markup: {
      keyboard: [['سنگ', 'کاغذ', 'قیچی'], ['📊 امتیاز']],
      resize_keyboard: true
    }
  });
});

// پیام‌ها
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!score[chatId]) {
    score[chatId] = { win: 0, lose: 0, draw: 0 };
  }

  // نمایش امتیاز
  if (text === '📊 امتیاز') {
    const s = score[chatId];
    return bot.sendMessage(chatId,
      `📊 امتیاز شما:\n🏆 برد: ${s.win}\n❌ باخت: ${s.lose}\n➖ مساوی: ${s.draw}`
    );
  }

  if (!choices.includes(text)) return;

  const user = text;
  const botChoice = choices[Math.floor(Math.random() * 3)];

  let result = '';

  if (user === botChoice) {
    result = '➖ مساوی شد';
    score[chatId].draw++;
  } else if (
    (user === 'سنگ' && botChoice === 'قیچی') ||
    (user === 'کاغذ' && botChoice === 'سنگ') ||
    (user === 'قیچی' && botChoice === 'کاغذ')
  ) {
    result = '🏆 تو بردی';
    score[chatId].win++;
  } else {
    result = '❌ باختی';
    score[chatId].lose++;
  }

  bot.sendMessage(chatId,
    `تو: ${user}\nربات: ${botChoice}\n\n${result}`
  );
});
