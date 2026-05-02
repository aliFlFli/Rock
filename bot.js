const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const DATA_FILE = './users.json';
const choices = ['سنگ', 'کاغذ', 'قیچی'];

// --------------------
// 📦 Load & Save Data
// --------------------
function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE));
  } catch {
    return {};
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

let users = loadData();

// --------------------
// 🧠 AI (با مود)
// --------------------
function aiChoice(user, mode = 'normal') {
  const h = user.history;

  let target = 'سنگ';
  if (h.کاغذ > h[target]) target = 'کاغذ';
  if (h.قیچی > h[target]) target = 'قیچی';

  // easy mode (تصادفی)
  if (mode === 'easy' && Math.random() < 0.3) {
    return choices[Math.floor(Math.random() * 3)];
  }

  // hard mode (همیشه ضد تو)
  if (target === 'سنگ') return 'کاغذ';
  if (target === 'کاغذ') return 'قیچی';
  return 'سنگ';
}

// --------------------
// 🏠 منو
// --------------------
function sendMenu(chatId) {
  bot.sendMessage(chatId, '🎮 منوی اصلی:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎮 شروع بازی", callback_data: "start_game" }],
        [{ text: "📊 آمار من", callback_data: "stats" }],
        [{ text: "⚙️ تنظیم سختی", callback_data: "mode" }],
        [{ text: "🔄 ریست", callback_data: "reset" }]
      ]
    }
  });
}

// --------------------
// /start
// --------------------
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name;

  if (!users[id]) {
    users[id] = {
      win: 0,
      lose: 0,
      draw: 0,
      round: 0,
      mode: 'normal',
      history: { سنگ: 0, کاغذ: 0, قیچی: 0 }
    };
    saveData();
  }

  bot.sendMessage(id, `سلام ${name} 😎 خوش اومدی`);
  sendMenu(id);
});

// --------------------
// Callback Handler
// --------------------
bot.on('callback_query', (q) => {
  const id = q.message.chat.id;
  const data = q.data;

  if (!users[id]) return;

  const user = users[id];

  try {

    // 🎮 شروع بازی
    if (data === 'start_game') {
      return bot.sendMessage(id, 'یکی رو انتخاب کن 👇', {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🪨 سنگ", callback_data: "سنگ" }],
            [{ text: "📄 کاغذ", callback_data: "کاغذ" }],
            [{ text: "✂️ قیچی", callback_data: "قیچی" }],
            [{ text: "🏠 منو", callback_data: "menu" }]
          ]
        }
      });
    }

    // 🏠 منو
    if (data === 'menu') {
      return sendMenu(id);
    }

    // 📊 آمار
    if (data === 'stats') {
      const total = user.win + user.lose + user.draw;
      const winRate = total ? ((user.win / total) * 100).toFixed(1) : 0;

      return bot.sendMessage(id,
`📊 آمار شما:

🏆 برد: ${user.win}
❌ باخت: ${user.lose}
➖ مساوی: ${user.draw}
📈 درصد برد: ${winRate}%
🎮 کل بازی: ${total}

🎯 آخرین انتخاب‌ها:
سنگ: ${user.history.سنگ}
کاغذ: ${user.history.کاغذ}
قیچی: ${user.history.قیچی}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🏠 منو", callback_data: "menu" }]
          ]
        }
      });
    }

    // ⚙️ مود
    if (data === 'mode') {
      return bot.sendMessage(id, 'سختی بازی رو انتخاب کن:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: "😴 آسان", callback_data: "easy" }],
            [{ text: "⚖️ عادی", callback_data: "normal" }],
            [{ text: "🔥 سخت", callback_data: "hard" }]
          ]
        }
      });
    }

    // تنظیم مود
    if (['easy', 'normal', 'hard'].includes(data)) {
      user.mode = data;
      saveData();

      return bot.sendMessage(id, `✔ مود تغییر کرد: ${data}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🏠 منو", callback_data: "menu" }]
          ]
        }
      });
    }

    // 🔄 ریست
    if (data === 'reset') {
      users[id] = {
        win: 0,
        lose: 0,
        draw: 0,
        round: 0,
        mode: 'normal',
        history: { سنگ: 0, کاغذ: 0, قیچی: 0 }
      };
      saveData();

      return sendMenu(id);
    }

    // 🎮 بازی اصلی
    if (choices.includes(data)) {
      const userChoice = data;
      const botChoice = aiChoice(user, user.mode);

      user.history[userChoice]++;
      user.round++;

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

      saveData();

      return bot.sendMessage(id,
`🎮 راند ${user.round}

👤 تو: ${userChoice}
🤖 ربات: ${botChoice}

${result}

📊 ${user.win} | ${user.lose} | ${user.draw}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔁 دوباره", callback_data: "start_game" }],
            [{ text: "🏠 منو", callback_data: "menu" }]
          ]
        }
      });
    }

  } catch (e) {
    console.error(e);
    bot.answerCallbackQuery(q.id, { text: "خطا 😅 دوباره تلاش کن" });
  }
});
