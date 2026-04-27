# 🚦 Smart AI-Based Traffic Management System

A full-stack real-time traffic management system that uses **AI-driven adaptive signal timing** to optimize traffic flow at intersections. Built with Node.js, Express, MongoDB, and Socket.IO.

---

## 📌 Features

- **Real-time traffic monitoring** via WebSockets (Socket.IO)
- **AI-powered adaptive signal control** — dynamically adjusts green/yellow timings based on live traffic
- **Traffic simulation engine** — generates realistic traffic data with time-of-day patterns
- **Interactive dashboard** — live visualization of intersection traffic data
- **User authentication** — JWT-based login/register with role-based access control (RBAC)
- **RESTful API** — CRUD operations for intersections, traffic logs, and signal control.

---

## 🧠 Algorithms & Logic

### 1. Weighted Proportional Allocation (Signal Timing)
The AI engine calculates optimal green-light durations using a **weighted demand scoring** algorithm:

```
Score(direction) = vehicleCount × 1.0 + queueLength × 1.5
```

- Green time is distributed **proportionally** to each direction's demand score
- Constrained between **10s (min)** and **60s (max)** green time per direction
- Total cycle time: **120 seconds** (including 5s yellow per direction)

### 2. Exponential Moving Average (Smoothing)
To prevent abrupt signal changes, timings are smoothed using EMA:

```
newGreen = 0.7 × calculatedGreen + 0.3 × previousGreen
```

This ensures gradual transitions and prevents traffic signal "thrashing."

### 3. Time-of-Day Traffic Multiplier
The simulator models realistic traffic patterns using time-based multipliers:

| Time Period       | Multiplier | Description      |
|-------------------|------------|------------------|
| 8–10 AM, 5–7 PM  | 1.8×       | Rush hour        |
| 6 AM – 10 PM     | 1.0×       | Normal daytime   |
| 10 PM – 6 AM     | 0.3×       | Nighttime        |

### 4. Congestion Classification
Traffic density is classified into four levels:

| Total Vehicles | Level      |
|----------------|------------|
| > 80           | 🔴 Critical |
| > 50           | 🟠 High     |
| > 25           | 🟡 Moderate |
| ≤ 25           | 🟢 Low      |

---

## 🛠️ Tech Stack

| Layer      | Technology                                      |
|------------|--------------------------------------------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript                |
| **Backend**  | Node.js, Express.js                            |
| **Database** | MongoDB (Mongoose ODM)                         |
| **Real-time**| Socket.IO (WebSockets)                         |
| **Auth**     | JWT (jsonwebtoken), bcryptjs                   |
| **Security** | Helmet, CORS, express-session, cookie-parser   |
| **Logging**  | Morgan, custom file stream logger              |
| **Other**    | Compression (zlib), dotenv, express-validator   |

---

## 📁 Project Structure

```
fullstack-project/
├── public/                  # Frontend (static files)
│   ├── css/                 # Stylesheets
│   ├── js/                  # Client-side JavaScript
│   ├── index.html           # Dashboard
│   ├── login.html           # Login page
│   └── register.html        # Registration page
├── server/
│   ├── config/
│   │   └── db.js            # MongoDB connection
│   ├── middleware/
│   │   ├── authMiddleware.js # JWT authentication
│   │   ├── errorHandler.js  # Global error handler
│   │   ├── logger.js        # Custom file logger (Streams)
│   │   └── rbac.js          # Role-based access control
│   ├── models/
│   │   ├── Intersection.js  # Intersection schema
│   │   ├── TrafficLog.js    # Traffic log schema
│   │   └── User.js          # User schema
│   ├── routes/
│   │   ├── auth.js          # Auth routes (login/register)
│   │   ├── intersections.js # Intersection CRUD
│   │   ├── signals.js       # Signal control routes
│   │   └── traffic.js       # Traffic data routes
│   ├── services/
│   │   ├── aiEngine.js      # AI signal optimization
│   │   ├── socketService.js # Socket.IO setup
│   │   └── trafficSimulator.js # Traffic data simulator
│   └── server.js            # Main entry point
├── .env                     # Environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (local or MongoDB Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/SONIC-007/Traffic_management.git
cd Traffic_management

# Install dependencies
npm install
```

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/traffic_management
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key
```

### Run the Application

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Open **http://localhost:3000** in your browser to access the dashboard.

---

## 📡 API Endpoints

| Method | Endpoint               | Description               |
|--------|------------------------|---------------------------|
| POST   | `/api/auth/register`   | Register a new user       |
| POST   | `/api/auth/login`      | Login & get JWT token     |
| GET    | `/api/intersections`   | List all intersections    |
| POST   | `/api/intersections`   | Create an intersection    |
| GET    | `/api/traffic/:id`     | Get traffic data          |
| POST   | `/api/signals/update`  | Update signal timings     |

---

## 👤 Author

**Arpit** — [@SONIC-007](https://github.com/SONIC-007)

---

## 📄 License

This project is licensed under the ISC License.
