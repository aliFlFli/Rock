const TelegramBot = require('node-telegram-bot-api');

// توکن از Environment Variable گرفته میشه
const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: true });

const choices = ['سنگ', 'کاغذ', 'قیچی'];

// شروع
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'یکی رو انتخاب کن 👇', {
    reply_markup: {
      keyboard: [['سنگ', 'کاغذ', 'قیچی']],
      resize_keyboard: true
    }
  });
});

// هندل پیام‌ها
bot.on('message', (msg) => {
  const userChoice = msg.text;

  if (!choices.includes(userChoice)) return;

  const botChoice = choices[Math.floor(Math.random() * 3)];

  let result = '';

  if (userChoice === botChoice) {
    result = 'مساوی 😐';
  } else if (
    (userChoice === 'سنگ' && botChoice === 'قیچی') ||
    (userChoice === 'کاغذ' && botChoice === 'سنگ') ||
    (userChoice === 'قیچی' && botChoice === 'کاغذ')
  ) {
    result = 'تو بردی 😎';
  } else {
    result = 'باختی 😢';
  }

  bot.sendMessage(
    msg.chat.id,
    `👤 تو: ${userChoice}\n🤖 ربات: ${botChoice}\n\n${result}`
  );
});