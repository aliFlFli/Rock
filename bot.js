const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const DATA_FILE = './users.json';
const choices = ['سنگ', 'کاغذ', 'قیچی'];

// ====================== LOAD DATA ======================
let users = {};
try {
  users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
} catch (e) {
  console.log('📁 فایل جدید ساخته شد');
}

// ====================== SAVE ======================
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('❌ خطا در ذخیره:', err);
  }
}

// ====================== AI هوشمند ======================
function aiChoice(user, mode = 'normal') {
  const h = user.history;
  const total = h.سنگ + h.کاغذ + h.قیچی;

  if (mode === 'easy' && Math.random() < 0.5) {
    return choices[Math.floor(Math.random() * 3)];
  }

  if (total < 6) return choices[Math.floor(Math.random() * 3)];

  // هوش مصنوعی واقعی‌تر
  const rand = Math.random();
  if (mode === 'hard' && rand < 0.7) {
    // ضد بیشترین انتخاب کاربر
    if (h.سنگ >= h.کاغذ && h.سنگ >= h.قیچی) return 'کاغذ';
    if (h.کاغذ >= h.قیچی) return 'قیچی';
    return 'سنگ';
  }

  // نرمال + کمی رندوم
  return choices[Math.floor(Math.random() * 3)];
}

// ====================== MENU ======================
function sendMenu(chatId) {
  bot.sendMessage(chatId, '🎮 **منوی اصلی سنگ‌کاغذ-قیچی**', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎮 شروع بازی", callback_data: "start_game" }],
        [{ text: "📊 آمار من", callback_data: "stats" }],
        [{ text: "🏆 لیدربورد", callback_data: "leaderboard" }],
        [{ text: "⚙️ تنظیم سختی", callback_data: "mode" }],
        [{ text: "🔄 ریست آمار", callback_data: "reset" }]
      ]
    }
  });
}

// ====================== /start ======================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || "دوست";

  if (!users[chatId]) {
    users[chatId] = {
      win: 0, lose: 0, draw: 0, round: 0,
      streak: 0, bestStreak: 0,
      mode: 'normal',
      history: { سنگ: 0, کاغذ: 0, قیچی: 0 },
      lastPlay: Date.now()
    };
  }

  bot.sendMessage(chatId, `سلام ${name}! 👋\nآماده‌ای بترکونیم؟ 🔥`);
  sendMenu(chatId);
});

// ====================== CALLBACK ======================
bot.on('callback_query', async (q) => {
  const chatId = q.message.chat.id;
  const data = q.data;
  if (!users[chatId]) return;

  const user = users[chatId];

  try {
    // شروع بازی
    if (data === 'start_game') {
      return bot.sendMessage(chatId, 'انتخاب کن 👇', {
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

    // منو
    if (data === 'menu') return sendMenu(chatId);

    // آمار
    if (data === 'stats') {
      const total = user.win + user.lose + user.draw;
      const winRate = total ? ((user.win / total) * 100).toFixed(1) : 0;

      return bot.sendMessage(chatId,
`📊 **آمار تو**

🏆 برد: ${user.win}
❌ باخت: ${user.lose}
🤝 مساوی: ${user.draw}
🔥 بهترین برد متوالی: ${user.bestStreak}
📈 درصد برد: ${winRate}%
🎮 کل راند: ${total}`, { parse_mode: 'Markdown' });
    }

    // لیدربورد (قابلیت جدید)
    if (data === 'leaderboard') {
      const top = Object.entries(users)
        .sort((a, b) => b[1].win - a[1].win)
        .slice(0, 10);

      let text = '🏆 **لیدربورد**\n\n';
      top.forEach(([id, u], i) => {
        text += `${i+1}. ${u.win} برد \( {u.bestStreak ? `🔥 \){u.bestStreak}` : ''}\n`;
      });

      return bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }

    // تنظیم مود
    if (['easy', 'normal', 'hard'].includes(data)) {
      user.mode = data;
      saveData();
      return bot.sendMessage(chatId, `✅ مود تغییر کرد به: **${data}**`, { parse_mode: 'Markdown' });
    }

    // ریست
    if (data === 'reset') {
      users[chatId] = { win:0, lose:0, draw:0, round:0, streak:0, bestStreak:0, mode:'normal', history:{سنگ:0,کاغذ:0,قیچی:0} };
      saveData();
      return sendMenu(chatId);
    }

    // ==================== بازی اصلی ====================
    if (choices.includes(data)) {
      const userChoice = data;
      const botChoice = aiChoice(user, user.mode);

      user.history[userChoice]++;
      user.round++;

      let resultText = '';
      let isWin = false;

      if (userChoice === botChoice) {
        resultText = '🤝 مساوی';
        user.streak = 0;
      } else if (
        (userChoice === 'سنگ' && botChoice === 'قیچی') ||
        (userChoice === 'کاغذ' && botChoice === 'سنگ') ||
        (userChoice === 'قیچی' && botChoice === 'کاغذ')
      ) {
        resultText = '🎉 بردی!';
        user.win++;
        user.streak++;
        isWin = true;
      } else {
        resultText = '😔 باختی';
        user.lose++;
        user.streak = 0;
      }

      if (user.streak > user.bestStreak) user.bestStreak = user.streak;

      saveData();

      bot.sendMessage(chatId,
`🎮 راند ${user.round}

👤 تو: ${userChoice}
🤖 ربات: ${botChoice}

${resultText}
🔥 برد متوالی: ${user.streak}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔁 بازی دوباره", callback_data: "start_game" }],
            [{ text: "🏠 منو", callback_data: "menu" }]
          ]
        }
      });
    }

  } catch (e) {
    console.error(e);
    bot.answerCallbackQuery(q.id, { text: "خطایی رخ داد 😅" });
  }
});
