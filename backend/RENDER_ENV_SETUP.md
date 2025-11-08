# 🚨 URGENT: Set Environment Variables in Render

## Go to Render Dashboard NOW and Add These:

1. **Click your service** → **Environment** tab
2. **Add these environment variables:**

```bash
MONGODB_URI=mongodb+srv://vivekmuskang03_db_user:5nEhG9nwI3oiNFSO@cluster0.pwkwj5l.mongodb.net/stackhack?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=78d84285d46b18e856023e3234feb9247be489e5993add067c9f647fba553d9b

JWT_EXPIRES_IN=1h

ADMIN_INITIAL_EMAIL=admin@gmail.com

ADMIN_INITIAL_PASSWORD=admin123

NODE_ENV=production

PORT=10000

CORS_ORIGIN=http://localhost:5173,https://your-netlify-app.netlify.app

STREAMLIT_GENERATOR_URL=https://stack-hack-eosilgrwg4dkaplzu9mkwr.streamlit.app
```

## After Adding Variables:
1. **Click "Save Changes"**
2. **Service will automatically redeploy**
3. **Should work perfectly!**

## Expected Success Log:
```
==> Running 'npm start'
mongodb connected
Server running on port 10000
==> Your service is live 🎉
```
