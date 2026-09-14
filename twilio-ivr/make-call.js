require("dotenv").config();
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;
const toNumber   = process.env.TWILIO_TO_NUMBER;
const webhookUrl = process.env.WEBHOOK_BASE_URL;

if (!accountSid || !authToken || !fromNumber || !toNumber || !webhookUrl) {
  console.error("❌ .env mein kuch values missing hain. .env.example dekho.");
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function makeCall() {
  try {
    console.log(`📞 Call kar raha hoon ${toNumber} ko...`);
    console.log(`   From     : ${fromNumber}`);
    console.log(`   Webhook  : ${webhookUrl}/voice`);

    // Trial accounts: only essential params (to, from, url)
    const call = await client.calls.create({
      to   : toNumber,
      from : fromNumber,
      url  : `${webhookUrl}/voice`,
    });

    console.log(`✅ Call shuru ho gayi!`);
    console.log(`   Call SID : ${call.sid}`);
    console.log(`   Status   : ${call.status}`);
    console.log(`   To       : ${call.to}`);
    console.log(`   From     : ${call.from}`);
  } catch (err) {
    // Print full error details for debugging
    console.error("❌ Call karne mein error:", err.message);
    if (err.code)    console.error("   Error Code   :", err.code);
    if (err.moreInfo) console.error("   More Info    :", err.moreInfo);
    if (err.status)  console.error("   HTTP Status  :", err.status);
  }
}

makeCall();
