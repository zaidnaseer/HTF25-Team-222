# 🎓 Peer Learning Exchange Platform

A modern, feature-rich MERN stack application that connects learners and trainers in a collaborative, gamified learning environment.

![Stack](https://img.shields.io/badge/Stack-MERN-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

### 🏫 Learner Hub
- **Community Management**: Create and join learning communities with customizable privacy settings (Public, Request to Join, Closed)
- **Real-time Chat**: Built-in chatrooms with Socket.IO for instant communication
- **Gamification**: Earn points, badges, and climb leaderboards through learning activities
- **Activities**: Participate in contests, quizzes, and challenges
- **Custom Roadmaps**: Follow pre-built learning paths or create your own
- **Calendar Integration**: Schedule meetings and track activities
- **Resources**: Industry mentors can share problem statements, documents, and learning materials

### 👨‍🏫 Trainers
- **Trainer Marketplace**: Browse trainers with advanced filtering (domain, rating, pricing)
- **Detailed Profiles**: View trainer expertise, ratings, reviews, and programs
- **Program Offerings**: Trainers can market structured programs (e.g., "2-month Web Dev Bootcamp")
- **Session Types**: Support for both 1-on-1 and group training sessions
- **Rating System**: Post-session reviews with detailed category ratings

### �️ Learning Roadmaps
- **Approved Roadmaps**: Platform-curated learning paths for popular domains
- **Trainer Roadmaps**: Custom programs with schedules and pricing
- **Custom Roadmaps**: Learners can create personalized learning paths
- **Progress Tracking**: Visual progress bars and milestone completion
- **Template Adoption**: One-click to copy and customize roadmaps

### �💻 Modern UI
- Built with **shadcn/ui** - Beautiful, accessible components
- **Tailwind CSS** for modern styling
- Fully responsive design
- Dark mode support
- Smooth animations and transitions

## 🚀 Tech Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **MongoDB** & **Mongoose** - Database
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router v6** - Routing
- **Axios** - HTTP client
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📦 Installation

**For detailed setup instructions, see [SETUP.md](SETUP.md)**

Quick reference:
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (in another terminal)
cd frontend && npm install && npm install tailwindcss-animate && npm run dev
```

## 🎯 Quick Start

After installation:
1. Open http://localhost:5173
2. Register a new account
3. Explore the features!

## 📖 Setup Guide

For detailed installation, environment configuration, troubleshooting, and test accounts, please refer to [SETUP.md](SETUP.md).

## 📱 Key Pages

- **Landing Page**: Beautiful hero section with features and stats
- **Dashboard**: Overview of hubs, sessions, and quick actions
- **Learner Hubs**: Browse, create, and join learning communities
- **Hub Detail**: Chat, view members, participate in activities
- **Trainers**: Search and filter expert trainers
- **Trainer Profile**: View details, programs, reviews, and book sessions
- **Sessions**: Manage upcoming and past learning sessions
- **Profile**: Update personal info, skills, and view achievements

## 🔐 Authentication

- JWT-based authentication
- Secure password hashing with bcryptjs
- Protected routes for authenticated users
- Token stored in localStorage

## 💳 Payment (Mock)

The platform includes a mock payment feature for demonstration:
- Session booking includes pricing
- "Pay Now" button triggers mock payment
- Transaction IDs generated for tracking

## 🎥 Video Calls

Sessions include Zoom integration:
- Automatically generated Zoom meeting links
- "Join on Zoom" button redirects to Zoom platform
- No embedded video calling (uses external Zoom)

## 🎮 Gamification

- **Points System**: Earn points through activities and participation
- **Leaderboards**: Compete with hub members
- **Levels**: Progress through levels based on points
- **Badges**: Unlock achievements for milestones

## 📊 Database Models

- **User**: Profile, skills, trainer info, gamification data
- **LearnerHub**: Community info, members, resources, activities
- **Session**: Trainer/learner bookings, schedules, meetings
- **Rating**: Trainer reviews and ratings
- **Activity**: Quizzes, contests, challenges
- **Message**: Real-time chat messages
- **Roadmap**: Learning paths and milestones

## 🛠️ Project Structure

```
HTF25-Team-222/
├── backend/
│   ├── config/          # Database configuration
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── server.js        # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   ├── services/    # API services
│   │   ├── lib/         # Utilities
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🎯 Future Enhancements

- [ ] Real payment integration (Stripe/PayPal)
- [ ] Embedded video calling (Jitsi/WebRTC)
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] AI-powered learning recommendations
- [ ] Certificate generation

---

**Built for HTF25 Hackathon by Team 222** 🚀
