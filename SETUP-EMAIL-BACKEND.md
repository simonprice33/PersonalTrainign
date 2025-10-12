# 📧 Email Backend Setup Instructions

## What This Does
Your contact form will now send **real emails** to `simon.price.33@hotmail.com` when visitors fill out the "Get My Free Consultation" form.

## 🏃‍♂️ Quick Start

### 1. Copy Backend Files to Your Local Machine
Copy the entire `/backend/` folder to your local project directory:
```
C:\Projects\Personal Training\Website - React\PersonalTrainign\
├── frontend/
└── backend/     ← Copy this folder
```

### 2. Get Your Hotmail App Password

**This is REQUIRED for email sending:**

1. **Go to Microsoft Account Security**: https://account.microsoft.com/security
2. **Sign in** with `simon.price.33@hotmail.com`
3. **Click "Advanced security options"**
4. **Click "Create a new app password"**
5. **Name it** "Simon PT Website"
6. **Copy the generated password** (it will look like: `abcd1234efgh5678`)

### 3. Update Backend Configuration

**Edit** `backend/.env` file and replace:
```
EMAIL_PASS=YOUR_APP_PASSWORD_HERE
```
**With your actual app password:**
```
EMAIL_PASS=abcd1234efgh5678
```

### 4. Start the Backend Server

**Option A: Windows (Double-click)**
- Double-click `backend/start.bat`

**Option B: Command Line**
```powershell
cd backend
npm install
npm start
```

You should see:
```
🚀 Simon Price PT Backend running on port 3001
🌍 Environment: development  
📧 Email configured for: simon.price.33@hotmail.com
🔗 CORS enabled for: http://localhost:3000
```

### 5. Start the Frontend

**In a separate terminal:**
```powershell
cd frontend
npm start
```

## 🧪 Test the Email System

1. **Open** http://localhost:3000
2. **Click** "Get My Free Consultation"
3. **Fill out the form** with test data
4. **Click** "Get My Free Consultation" button
5. **Check your email** - you should receive a beautifully formatted email!

## 📁 File Structure
```
PersonalTrainign/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
└── backend/          ← New backend folder
    ├── server.js     ← Main server file
    ├── package.json  ← Backend dependencies
    ├── .env          ← Email configuration (UPDATE THIS!)
    └── start.bat     ← Easy startup script
```

## 🎨 What the Email Looks Like

The emails are professionally designed with:
- **Beautiful HTML formatting** with your brand colors (cyan blue)
- **All form data** clearly organized
- **Client information** section
- **Message section** (if provided)
- **Direct reply button** to respond to the client
- **Timestamp** of submission

## 🛠️ Troubleshooting

### "Error: Invalid login" 
- You need to create an app password (see step 2)
- Regular Hotmail password won't work

### "ECONNECTION" Error
- Check your internet connection
- Hotmail SMTP might be temporarily unavailable

### Form shows error message
- Make sure backend is running on port 3001
- Check backend terminal for error messages

### Port 3001 already in use
- Stop any other apps using port 3001
- Or change PORT in backend/.env to 3002

## 🔒 Security Features

- **Rate limiting**: Max 10 emails per 15 minutes per IP
- **Input validation**: All form inputs are sanitized
- **CORS protection**: Only allows requests from your frontend
- **Email validation**: Ensures valid email addresses
- **XSS protection**: All inputs are escaped

## 📱 Production Deployment

When you deploy to your server:
1. Update `CORS_ORIGIN` in backend/.env to your domain
2. Change `NODE_ENV` to "production"
3. Use a process manager like PM2 or run as Windows service

## ✅ Success!

Once set up, every contact form submission will:
1. ✅ Send you a professional email instantly
2. ✅ Include all client details in beautiful format  
3. ✅ Allow you to reply directly from your email
4. ✅ Show success message to the client
5. ✅ Clear the form for next submission

**Need help?** Check the backend terminal for detailed error messages and troubleshooting info!