const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const app = express();

const BOT_TOKEN = "8908464362:AAG1JbJNL4snZojzbRTnsEUm4WrIPDE8Qek"; // ← Apna Token daalo

const ADMIN_IDS = [8878702771]; // ← Yahan apna Telegram ID daal do (Multiple IDs comma se add kar sakte ho)

const NUM_API = "https://kaise.page.gd/@.php?api_key=mahadev&number=";  // ← Updated API
const TG_API = "https://api.igfollows.site/TG/index.php?type=user&key=AYAN&term=";

const CREDIT = "☙꯭꧁༺Deepak ╔═𖣔ꠋꠋꠋꠋꠋꠋꠋꠋꠋꠋꠋꠋꠋꠋ(ـ๋ࣩࣩࣩࣩࣩࣩࣩࣩࣩࣩࣩࣩࣩࣩࣩࣩࣩࣩࣩࣩࣧࣧࣧࣧࣧࣧࣧࣧࣧࣧࣧ͡";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Allowed Users Database
let allowedUsers = {};

if (fs.existsSync("allowed.json")) {
  allowedUsers = JSON.parse(fs.readFileSync("allowed.json", "utf8"));
}

function isAllowed(userId) {
  return ADMIN_IDS.includes(userId) || allowedUsers[userId] === true;
}

function saveAllowedUsers() {
  fs.writeFileSync("allowed.json", JSON.stringify(allowedUsers, null, 2));
}

// ===================== START =====================
bot.onText(/\/start/, (msg) => {
  const userId = msg.from.id;

  if (!isAllowed(userId)) {
    return bot.sendMessage(msg.chat.id, "⛔ **Access Denied**\n\nBot ka access sirf admin allow karega.", { parse_mode: "Markdown" });
  }

  bot.sendMessage(msg.chat.id,
    `💀 **NUMBER INFO BOT** 💀\n\n` +
    `Commands:\n` +
    `• /num <number>\n` +
    `• /tg <tg id or @username>\n\n` +
    `Example:\n` +
    `/num 98650XXXXX\n` +
    `/tg 954768XXXX\n\n` +
    `🔒 **Private Bot**\n\n${CREDIT}`,
    { parse_mode: "Markdown" }
  );
});

// ===================== /num =====================
bot.onText(/\/num (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (!isAllowed(userId)) {
    return bot.sendMessage(chatId, "⛔ **Access Denied**\nAdmin se contact karein.");
  }

  let number = match[1].trim().replace(/\D/g, '');
  if (number.length === 10) number = "91" + number;
  if (number.length !== 12) {
    return bot.sendMessage(chatId, "❌ Invalid number! Example: /num 9153017254");
  }

  const searching = await bot.sendMessage(chatId, "🔍 Searching for information...");

  try {
    const { data } = await axios.get(NUM_API + number);
    bot.deleteMessage(chatId, searching.message_id);

    const results = Array.isArray(data.result) ? data.result : Array.isArray(data) ? data : [data];

    if (!results || results.length === 0 || !results[0]?.name) {
      return bot.sendMessage(chatId, "❌ No record found for this number.");
    }

    let message = `✅ **NUMBER LOOKUP RESULT**\n\n`;
    message += `📱 **Primary Number:** +${number}\n\n`;

    results.forEach((info, index) => {
      const resNum = index + 1;
      message += `🔴 **Result ${resNum}**\n`;
      message += `━━━━━━━━━━━━━━━\n`;
      
      message += `📱 **Mobile:** ${info.mobile || number}\n`;
      message += `👤 **Name:** ${info.name || "N/A"}\n`;
      message += `👨 **Father:** ${info.fname || info.father || "N/A"}\n`;
      
      if (info.address) message += `🏠 **Address:** ${info.address}\n`;
      if (info.alt || info.alternate) message += `📞 **Alt Number:** ${info.alt || info.alternate}\n`;
      
      message += `🌐 **Circle:** ${info.circle || "N/A"}\n`;
      if (info.email) message += `✉️ **Email:** ${info.email}\n`;
      if (info.id || info.user_id) message += `🆔 **ID:** ${info.id || info.user_id}\n`;

      if (info.dob) message += `🎂 **DOB:** ${info.dob}\n`;
      if (info.gender) message += `⚧ **Gender:** ${info.gender}\n`;
      if (info.aadhaar) message += `🪪 **Aadhaar:** ${info.aadhaar}\n`;
      if (info.pan) message += `🛡️ **PAN:** ${info.pan}\n`;

      message += `\n`;
    });

    message += CREDIT;
    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });

  } catch (e) {
    console.error(e);
    bot.deleteMessage(chatId, searching.message_id).catch(() => {});
    bot.sendMessage(chatId, "⚠️ API Error! Please try again later.");
  }
});

// ===================== /tg =====================
bot.onText(/\/tg (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (!isAllowed(userId)) {
    return bot.sendMessage(chatId, "⛔ **Access Denied**\nAdmin se contact karein.");
  }

  let input = match[1].trim().replace("@", "").trim();

  const searching = await bot.sendMessage(chatId, "🔍 Searching TG Account...");

  try {
    const { data } = await axios.get(TG_API + encodeURIComponent(input));
    bot.deleteMessage(chatId, searching.message_id);

    if (data?.success === true && data?.result?.success === true) {
      const r = data.result;

      const country = r.country || "India";
      const countryCode = r.country_code || "+91";
      const number = r.number || "N/A";
      const userIdTg = r.tg_id || input;

      const message = `☎️ **Telegram Lookup Result**\n\n` +
                      `🌍 **Country:** ${country}\n` +
                      `📞 **Country Code:** ${countryCode}\n` +
                      `📱 **Number:** ${number}\n` +
                      `🆔 **User ID:** ${userIdTg}\n\n` +
                      CREDIT;

      bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } else {
      bot.sendMessage(chatId, "❌ No record found.");
    }
  } catch (e) {
    console.error(e);
    bot.deleteMessage(chatId, searching.message_id).catch(() => {});
    bot.sendMessage(chatId, "⚠️ TG API Error!");
  }
});

// ===================== ADMIN COMMANDS =====================
bot.onText(/\/add (.+)/, (msg, match) => {
  if (!ADMIN_IDS.includes(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "⛔ Sirf Admin hi yeh command use kar sakta hai.");
  }

  const uid = parseInt(match[1].trim());
  if (!uid) return bot.sendMessage(msg.chat.id, "❌ Invalid User ID!");

  allowedUsers[uid] = true;
  saveAllowedUsers();

  bot.sendMessage(msg.chat.id, `✅ User **${uid}** ko bot access de diya gaya!`);
});

bot.onText(/\/remove (.+)/, (msg, match) => {
  if (!ADMIN_IDS.includes(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "⛔ Sirf Admin hi yeh command use kar sakta hai.");
  }

  const uid = parseInt(match[1].trim());
  if (!uid) return bot.sendMessage(msg.chat.id, "❌ Invalid User ID!");

  delete allowedUsers[uid];
  saveAllowedUsers();

  bot.sendMessage(msg.chat.id, `✅ User **${uid}** ka access remove kar diya gaya!`);
});

// ===================== SERVER =====================
app.get("/", (req, res) => res.send("Number Info Bot is Running ✅"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Bot Started on Port ${PORT}`));

console.log("✅ Private Number Info Bot Started with Admin Control");
