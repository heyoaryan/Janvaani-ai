# Twilio IVR — Aryan ka Hindi Assistant 🇮🇳

Yeh system Twilio se automated call karta hai, Hindi mein bolta hai, aur user ka input (1/2/3) store karta hai.

---

## Setup karo (ek baar)

```bash
cd twilio-ivr
npm install
```

---

## Chalane ka steps

### Step 1 — ngrok se public URL lo

Terminal 1 mein:
```bash
ngrok http 3000
```
Output mein kuch aisa dikhega:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```
Us `https://abc123.ngrok-free.app` URL ko copy karo.

---

### Step 2 — .env update karo

`.env` file mein `WEBHOOK_BASE_URL` ko update karo:
```
WEBHOOK_BASE_URL=https://abc123.ngrok-free.app
```

---

### Step 3 — Server start karo

Terminal 2 mein:
```bash
npm start
```

---

### Step 4 — Call karo

Terminal 3 mein:
```bash
npm run call
```

---

## IVR Menu (jo call mein bolega)

> "Namaste! Main Aryan ka assistant bol raha hoon..."
> - **1 dabao** → Appointment lena
> - **2 dabao** → Information lena  
> - **3 dabao** → Agent se baat karna

---

## Responses kahan store hote hain?

`responses.json` file mein. Example entry:

```json
{
  "timestamp": "2026-08-29T10:30:00.000Z",
  "callSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "caller": "+918384041061",
  "digit": "1",
  "intent": "appointment",
  "finalStatus": "completed",
  "duration": "35"
}
```

Browser mein bhi dekh sakte ho:
```
http://localhost:3000/responses
```

---

## Twilio Free Trial Note

- Free trial mein sirf **verified numbers** pe call ja sakti hai
- Apna number verify karo: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
