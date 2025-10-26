# ⚡ Quick Setup Guide

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
npm install tailwindcss-animate
```

## Step 2: Configure Environment

Get `backend/.env`

## Step 3: Run the Application

Open **two terminals**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on port 5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Step 5: Access the Application

Open your browser and go to: **http://localhost:5173**

## Test Accounts

You can create your own accounts through the registration page, or use these test credentials:

**Test Learner:**
- Email: `learner@test.com`
- Password: `test123`

**Test Trainer:**
- Email: `trainer@test.com`
- Password: `test123`

## Common Issues

### MongoDB Connection Error
**Problem:** `MongooseError: connect ECONNREFUSED`

**Solution:**
- Make sure MongoDB is running
- Check if port 27017 is available
- Update MONGODB_URI in .env

### Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Won't Start
**Problem:** Missing dependencies

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm install tailwindcss-animate
npm run dev
```

## Development Tips

1. **Auto-reload**: Both servers support hot-reload. Save files to see changes instantly.

2. **API Testing**: Backend runs on port 5000. Test endpoints at `http://localhost:5000/api/health`

3. **MongoDB GUI**: Use MongoDB Compass or Studio 3T to view database:
   - Connection String: `mongodb://localhost:27017`

4. **Clear Database**: 
   ```bash
   # Connect to MongoDB
   mongosh
   
   # Drop database
   use peer-learning
   db.dropDatabase()
   ```

5. **Check Logs**: Watch terminal outputs for errors and API calls

6. **Seed Approved Roadmaps**: 
   ```bash
   cd backend
   npm run seed:roadmaps
   ```
   This will populate 6 platform-approved learning roadmaps.

## Demo Features to Test

✅ **Register** a new account  
✅ **Create** a learner hub  
✅ **Browse** trainers  
✅ **Explore** approved roadmaps  
✅ **Adopt** a learning roadmap  
✅ **Create** custom roadmap  
✅ **Track** roadmap progress  
✅ **Book** a session (mock payment)  
✅ **Join** the Zoom link  
✅ **Send** messages in hub chat  
✅ **Earn** points by participating  

## Tech Stack Versions

- Node.js: 16+
- MongoDB: 5.0+
- React: 18.x
- Vite: 5.x

## Need Help?

- **Setup Guide**: This file (SETUP.md)
- **Project Documentation**: PROJECT_README.md
- **Roadmap Feature**: ROADMAP_FEATURE.md

---

Happy Hacking! 🚀
