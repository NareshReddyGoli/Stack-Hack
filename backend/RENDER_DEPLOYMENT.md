# Render Deployment Guide

## Environment Variables for Render

Copy these exact values into your Render environment variables:

```bash
# Database
MONGODB_URI=mongodb+srv://vivekmuskang03_db_user:5nEhG9nwI3oiNFSO@cluster0.pwkwj5l.mongodb.net/stackhack?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration
JWT_SECRET=78d84285d46b18e856023e3234feb9247be489e5993add067c9f647fba553d9b
JWT_EXPIRES_IN=1h

# Admin Initial Setup
ADMIN_INITIAL_EMAIL=admin@gmail.com
ADMIN_INITIAL_PASSWORD=admin123

# Email Configuration (Update with real SMTP if needed)
SMTP_HOST=smtp.example.com
SMTP_USER=username
SMTP_PASS=password
EMAIL_USER=username
EMAIL_PASS=password

# Server Configuration
PORT=10000
NODE_ENV=production

# CORS - Update with your actual Netlify URL after frontend deployment
CORS_ORIGIN=http://localhost:5173,https://your-netlify-app.netlify.app

# Streamlit Timetable Generator
STREAMLIT_GENERATOR_URL=https://stack-hack-eosilgrwg4dkaplzu9mkwr.streamlit.app
```

## Render Service Configuration

- **Name**: stack-hack-backend
- **Environment**: Node
- **Build Command**: npm install --production
- **Start Command**: npm start
- **Root Directory**: backend

## Important Notes

1. **MongoDB**: Your database is already configured and ready
2. **JWT Secret**: Strong 64-character secret is set
3. **Admin Account**: Will be created with admin@gmail.com / admin123
4. **Port**: Changed to 10000 for Render compatibility
5. **CORS**: Update with your Netlify URL after frontend deployment

## After Deployment

1. Your backend will be available at: `https://stack-hack-backend.onrender.com`
2. Update your frontend environment variables with this URL
3. Test the admin login with the credentials above
4. Update CORS_ORIGIN with your actual Netlify URL
