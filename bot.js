const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const choices = ['سنگ', 'کاغذ', 'قیچی'];

// دیتای کاربران
const users = {};

// شروع
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (!users[chatId]) {
    users[chatId] = {
      win: 0,
      lose: 0,
      draw: 0,
      history: { سنگ: 0, کاغذ: 0, قیچی: 0 }
    };
  }

  bot.sendMessage(chatId,
`🎮 بازی شروع شد

یکی رو انتخاب کن 👇`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🪨 سنگ", callback_data: "سنگ" }],
        [{ text: "📄 کاغذ", callback_data: "کاغذ" }],
        [{ text: "✂️ قیچی", callback_data: "قیچی" }]
      ]
    }
  });
});

// AI انتخاب ربات
function aiChoice(userHistory) {
  // پیدا کردن بیشترین انتخاب کاربر
  let max = 'سنگ';

  if (userHistory.کاغذ > userHistory[max]) max = 'کاغذ';
  if (userHistory.قیچی > userHistory[max]) max = 'قیچی';

  // ضدش رو انتخاب کن
  if (max === 'سنگ') return 'کاغذ';
  if (max === 'کاغذ') return 'قیچی';
  return 'سنگ';
}

// منطق بازی
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userChoice = query.data;

  if (!users[chatId]) return;

  const user = users[chatId];

  // ثبت تاریخچه
  if (choices.includes(userChoice)) {
    user.history[userChoice]++;
  }

  const botChoice = aiChoice(user.history);

  let result = '';

  if (userChoice === botChoice) {
    result = '➖ مساوی';
    user.draw++;
  } else if (
    (userChoice === 'سنگ' && botChoice === 'قیچی') ||
    (userChoice === 'کاغذ' && botChoice === 'سنگ') ||
    (userChoice === 'قیچی' && botChoice === 'کاغذ')
  ) {
    result = '🏆 بردی';
    user.win++;
  } else {
    result = '❌ باختی';
    user.lose++;
  }

  bot.answerCallbackQuery(query.id);

  bot.sendMessage(chatId,
`🎮 نتیجه بازی

👤 تو: ${userChoice}
🤖 ربات: ${botChoice}
${result}

📊 امتیاز
🏆 ${user.win} | ❌ ${user.lose} | ➖ ${user.draw}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔁 دوباره بازی", callback_data: "restart" }]
      ]
    }
  });

  // ریست ساده
  if (query.data === 'restart') {
    bot.answerCallbackQuery(query.id);

    bot.sendMessage(chatId,
`🎮 دوباره شروع کن 👇`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🪨 سنگ", callback_data: "سنگ" }],
          [{ text: "📄 کاغذ", callback_data: "کاغذ" }],
          [{ text: "✂️ قیچی", callback_data: "قیچی" }]
        ]
      }
    });
  }
});
