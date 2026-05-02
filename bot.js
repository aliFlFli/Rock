const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const DATA_FILE = './users.json';
const choices = ['سنگ', 'کاغذ', 'قیچی'];

// ====================== DATA ======================
let users = {};

try {
  users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
} catch {
  console.log('📁 دیتابیس جدید ساخته شد');
  users = {};
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('❌ save error:', err);
  }
}

// ====================== AI ======================
function aiChoice(user, mode = 'normal') {
  const h = user.history;

  const total = h.سنگ + h.کاغذ + h.قیچی;

  // کم تجربه → رندوم
  if (total < 5) {
    return choices[Math.floor(Math.random() * 3)];
  }

  // easy mode
  if (mode === 'easy' && Math.random() < 0.5) {
    return choices[Math.floor(Math.random() * 3)];
  }

  // hard mode (ضد الگوی غالب)
  if (mode === 'hard') {
    let max = 'سنگ';
    if (h.کاغذ > h[max]) max = 'کاغذ';
    if (h.قیچی > h[max]) max = 'قیچی';

    if (max === 'سنگ') return 'کاغذ';
    if (max === 'کاغذ') return 'قیچی';
    return 'سنگ';
  }

  // normal
  return choices[Math.floor(Math.random() * 3)];
}

// ====================== MENU ======================
function sendMenu(chatId) {
  bot.sendMessage(chatId,
`🎮 منوی اصلی

یکی رو انتخاب کن 👇`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🪨 سنگ", callback_data: "سنگ" }],
        [{ text: "📄 کاغذ", callback_data: "کاغذ" }],
        [{ text: "✂️ قیچی", callback_data: "قیچی" }],
        [{ text: "📊 آمار", callback_data: "stats" }],
        [{ text: "⚙️ سختی", callback_data: "mode" }]
      ]
    }
  });
}

// ====================== START ======================
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  const name = msg.from.first_name || 'بازیکن';

  if (!users[id]) {
    users[id] = {
      win: 0,
      lose: 0,
      draw: 0,
      round: 0,
      streak: 0,
      bestStreak: 0,
      mode: 'normal',
      history: { سنگ: 0, کاغذ: 0, قیچی: 0 }
    };
  }

  saveData();

  bot.sendMessage(id, `سلام ${name} 😎\nبزن بریم!`);
  sendMenu(id);
});

// ====================== GAME ======================
bot.on('callback_query', (q) => {
  const id = q.message.chat.id;
  const data = q.data;

  if (!users[id]) return;

  const u = users[id];

  try {

    // آمار
    if (data === 'stats') {
      const total = u.win + u.lose + u.draw;
      const rate = total ? ((u.win / total) * 100).toFixed(1) : 0;

      return bot.sendMessage(id,
`📊 آمار تو

🏆 برد: ${u.win}
❌ باخت: ${u.lose}
🤝 مساوی: ${u.draw}
🔥 استریک: ${u.bestStreak}
📈 Win Rate: ${rate}%`);
    }

    // انتخاب سختی
    if (data === 'mode') {
      return bot.sendMessage(id, '⚙️ انتخاب سختی:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: "😴 آسان", callback_data: "easy" }],
            [{ text: "⚖️ عادی", callback_data: "normal" }],
            [{ text: "🔥 سخت", callback_data: "hard" }]
          ]
        }
      });
    }

    // تغییر مود
    if (['easy', 'normal', 'hard'].includes(data)) {
      u.mode = data;
      saveData();
      return bot.sendMessage(id, `✔ مود تغییر کرد: ${data}`);
    }

    // بازی
    if (choices.includes(data)) {
      const userChoice = data;
      const botChoice = aiChoice(u, u.mode);

      u.history[userChoice]++;
      u.round++;

      let result = '';

      if (userChoice === botChoice) {
        result = '🤝 مساوی';
        u.streak = 0;
        u.draw++;
      } else if (
        (userChoice === 'سنگ' && botChoice === 'قیچی') ||
        (userChoice === 'کاغذ' && botChoice === 'سنگ') ||
        (userChoice === 'قیچی' && botChoice === 'کاغذ')
      ) {
        result = '🏆 بردی';
        u.win++;
        u.streak++;
      } else {
        result = '❌ باختی';
        u.lose++;
        u.streak = 0;
      }

      if (u.streak > u.bestStreak) u.bestStreak = u.streak;

      saveData();

      return bot.sendMessage(id,
`🎮 راند ${u.round}

👤 تو: ${userChoice}
🤖 ربات: ${botChoice}

${result}
🔥 استریک: ${u.streak}

📊 ${u.win} | ${u.lose} | ${u.draw}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔁 دوباره", callback_data: "menu" }]
          ]
        }
      });
    }

    // برگشت به منو
    if (data === 'menu') {
      return sendMenu(id);
    }

  } catch (e) {
    console.error(e);
    bot.answerCallbackQuery(q.id, { text: "خطا 😅" });
  }
});
