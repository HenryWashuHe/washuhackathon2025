# SCDS Deployment Guide

## 🚀 Quick Deploy

### Backend (FastAPI on Render)

1. **Push backend to GitHub**
   ```bash
   cd backend
   git add .
   git commit -m "Add backend deployment config"
   git push origin main
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect your GitHub repo
   - Select the `/backend` directory as root
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add environment variable: `OPENAI_API_KEY=your_key_here`
   - Deploy!

3. **Custom Domain (optional)**
   - In Render settings → Custom Domain
   - Add `api.miaomiaobadcat.com`
   - Update DNS CNAME record to point to Render URL

### Frontend (Next.js on Vercel)

1. **Add environment variable**
   - In Vercel dashboard → Settings → Environment Variables
   - Add: `BACKEND_URL=https://api.miaomiaobadcat.com`
   - Or if using Render default: `BACKEND_URL=https://your-app.onrender.com`

2. **Redeploy**
   ```bash
   vercel --prod
   ```

## 🧪 Testing

### Test Local Development
```bash
# Start backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# In new terminal, start frontend
cd ..
npm run dev

# Test connections
./test-local.sh
```

### Test Production Deployment
```bash
./test-deployment.sh
```

## 🔍 Troubleshooting

### Backend not responding
1. Check Render logs for errors
2. Verify OPENAI_API_KEY is set
3. Check CORS origins include your frontend URL

### Frontend can't connect to backend
1. Check browser console for errors
2. Verify BACKEND_URL environment variable
3. Test backend directly: `curl https://api.miaomiaobadcat.com/`

### CORS errors
- Ensure backend CORS middleware includes frontend domain
- Check for trailing slashes in URLs
- Verify protocol (https vs http)

## 📝 Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=sk-...
LANGCHAIN_API_KEY=ls__...  # Optional
```

### Frontend (.env.local)
```
BACKEND_URL=https://api.miaomiaobadcat.com
NEXT_PUBLIC_MAPBOX_TOKEN=your_token
```

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐
│                 │  HTTPS  │                  │
│   Next.js App   ├────────►│  FastAPI Backend │
│   (Vercel)      │   SSE   │   (Render)       │
│                 │◄────────┤                  │
└─────────────────┘         └──────────────────┘
        │                            │
        │                            │
        ▼                            ▼
   [Mapbox API]               [OpenAI API]
                              [Open-Meteo API]
```

## 🔐 Security Notes

- Never commit API keys to git
- Use environment variables for all secrets
- Enable HTTPS for production
- Restrict CORS origins to your domains only
- Use rate limiting in production

## 📊 Monitoring

- Backend health: `https://api.miaomiaobadcat.com/`
- Frontend health: `https://miaomiaobadcat.com/api/health`
- Render dashboard for backend logs
- Vercel dashboard for frontend analytics

## 🚨 Common Issues & Fixes

### "Backend connection failed"
```bash
# Check if backend is deployed
curl https://api.miaomiaobadcat.com/

# If not, redeploy backend on Render
```

### "CORS policy error"
```python
# Update backend/main.py CORS origins
allow_origins=[
    "https://miaomiaobadcat.com",
    "https://www.miaomiaobadcat.com",
]
```

### "Stream timeout"
- Increase timeout in Render settings
- Or use background jobs for long-running analysis
