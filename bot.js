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
      round: 0
    };
  }

  sendMenu(chatId);
});

// منوی اصلی
function sendMenu(chatId) {
  bot.sendMessage(chatId, '🎮 <b>بازی سنگ کاغذ قیچی</b>\nیکی رو انتخاب کن 👇', {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🪨 سنگ", callback_data: "سنگ" }],
        [{ text: "📄 کاغذ", callback_data: "کاغذ" }],
        [{ text: "✂️ قیچی", callback_data: "قیچی" }],
        [{ text: "📊 امتیاز", callback_data: "score" }]
      ]
    }
  });
}

// هندل کلیک دکمه‌ها
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (!users[chatId]) {
    users[chatId] = { win: 0, lose: 0, draw: 0, round: 0 };
  }

  // 📊 امتیاز
  if (data === 'score') {
    const u = users[chatId];
    bot.answerCallbackQuery(query.id);

    return bot.sendMessage(chatId,
`📊 <b>امتیاز شما</b>

🏆 برد: ${u.win}
❌ باخت: ${u.lose}
➖ مساوی: ${u.draw}
🎮 راند: ${u.round}`, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 برگشت", callback_data: "back" }]
        ]
      }
    });
  }

  // 🔙 برگشت
  if (data === 'back') {
    bot.answerCallbackQuery(query.id);
    return sendMenu(chatId);
  }

  // 🎮 بازی
  if (choices.includes(data)) {
    const userChoice = data;
    const botChoice = choices[Math.floor(Math.random() * 3)];

    let result = '';

    if (userChoice === botChoice) {
      result = '➖ مساوی شد';
      users[chatId].draw++;
    } else if (
      (userChoice === 'سنگ' && botChoice === 'قیچی') ||
      (userChoice === 'کاغذ' && botChoice === 'سنگ') ||
      (userChoice === 'قیچی' && botChoice === 'کاغذ')
    ) {
      result = '🏆 تو بردی';
      users[chatId].win++;
    } else {
      result = '❌ باختی';
      users[chatId].lose++;
    }

    users[chatId].round++;

    bot.answerCallbackQuery(query.id);

    // 🎨 پیام خفن UI
    bot.sendMessage(chatId,
`🎮 <b>راند ${users[chatId].round}</b>

━━━━━━━━━━━━━━
👤 <b>تو:</b> ${userChoice}
🤖 <b>ربات:</b> ${botChoice}
━━━━━━━━━━━━━━

<b>${result}</b>

📊 <b>نتایج کلی</b>
🏆 برد: ${users[chatId].win}
❌ باخت: ${users[chatId].lose}
➖ مساوی: ${users[chatId].draw}
━━━━━━━━━━━━━━`, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔁 بازی دوباره", callback_data: "restart" }],
          [{ text: "📊 امتیاز", callback_data: "score" }]
        ]
      }
    });
  }

  // 🔁 ریست بازی
  if (data === 'restart') {
    users[chatId].round = 0;
    bot.answerCallbackQuery(query.id);
    sendMenu(chatId);
  }
});
