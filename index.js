require("dotenv").config();
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const axios = require("axios");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ Bot WhatsApp AI siap digunakan!");
});

client.on("message", async (message) => {
  const text = message.body;

  // Abaikan pesan dari diri sendiri & grup
  if (message.fromMe || message.from.endsWith("@g.us")) return;

  // Ambil nama & nomor pengirim
  const senderName = message._data.notifyName || message._data.pushName || "Pengguna";
  const senderNumber = message.from.split("@")[0];

  console.log(`\n📩 Pesan dari ${senderName} (${senderNumber}): ${text}`);
  console.log(`🕐 Status: Menunggu balasan AI...`);

  try {
    // Kirim pesan "berpikir..."
    const thinkingMsg = await message.reply("💬 Sedang berpikir...");

    const aiReply = await getAIResponse(text);

    // Balas langsung pesan user dengan fitur "reply"
    await message.reply(aiReply);

    console.log(`✅ Status: Balasan AI terkirim ke ${senderName} (${senderNumber})`);
  } catch (err) {
    console.error(`❌ Status: Gagal balas ke ${senderName} (${senderNumber})`);
    console.error("   ⛔ Error:", err.message);
    await message.reply("⚠️ Bot error: " + err.message);
  }
});

async function getAIResponse(userPrompt) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "mistralai/mistral-7b-instruct:free",
      messages: [
        {
          role: "system",
          content: "Kamu adalah AI WhatsApp yang cerdas, sopan, dan membantu pengguna.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": `https://${process.env.PROJECT_NAME}.example.com`,
        "X-Title": "ChatAI",
      },
    }
  );

  if (!response.data || !response.data.choices || !response.data.choices[0]) {
    throw new Error("Tidak ada balasan dari AI");
  }

  return response.data.choices[0].message.content.trim();
}

client.initialize();
