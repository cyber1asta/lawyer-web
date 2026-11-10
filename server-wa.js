const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors'); // استيراد مكتبة السماح للربط

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('📌 امسح هذا الرمز بواسطة واتساب هاتفك:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ تم ربط واتساب المكتب بنجاح واستعداد تام للإرسال!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ فشل المصادقة:', msg);
});

client.initialize();

const app = express();
app.use(cors()); // السماح بالاتصال من موقع Next.js بدون حظر CORS
app.use(express.json());

app.post('/send-whatsapp', async (req, res) => {
    const { phone, message } = req.body;
    try {
        const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
        await client.sendMessage(chatId, message);
        console.log(`📤 تم إرسال الواتساب بنجاح إلى: ${phone}`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('خطأ في الإرسال:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3001, () => {
    console.log('🚀 خادم الواتساب شغال على البورت 3001');
});