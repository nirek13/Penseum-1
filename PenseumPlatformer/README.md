# Educational Platformer Game Template 🎮📚

A web-based platformer game built with the MERN stack that combines education with gaming mechanics. Players jump between platforms representing multiple-choice answers, earning points for correct answers and collecting power-ups to enhance their gameplay.

## 🌟 Features

### Core Mechanics
- **Character Movement**: Smooth left/right movement and jumping mechanics with A/D or arrow keys
- **Platform-based Questions**: Platforms represent multiple-choice answers with visual feedback
- **Answer Validation**: Jump on correct answers for boosts, lose lives for wrong ones
- **Lives System**: 3 lives by default, with protection from power-ups
- **Scoring System**: Points based on question difficulty and multipliers

### Power-ups System
- 🛡️ **Shield**: Protects from wrong answer penalties
- 🚀 **Double Boost**: Extra jump height for easier navigation  
- ⭐ **Invincibility**: Temporary immunity from wrong answers
- 💎 **Score Multiplier**: 2x points for a limited time
- ❤️ **Extra Life**: Gain an additional life

### Visual Polish
- **Retro-styled Graphics**: Colorful and polished visual design inspired by Doodle Jump
- **Particle Effects**: Dynamic particles for jumps, successes, failures, and power-ups
- **Smooth Animations**: Tweened movements and visual feedback using Phaser.js
- **Responsive UI**: Clean interface showing score, lives, multiplier, and accuracy
- **Background Effects**: Animated stars and floating elements

### Educational Features
- **JSON-based Questions**: Easy topic swapping via configuration files
- **Difficulty Levels**: Easy (100pts), medium (150pts), and hard (200pts) questions
- **Subject Categories**: Questions organized by educational topics
- **Progress Tracking**: Questions answered, accuracy percentage, and statistics
- **Leaderboard System**: High scores with detailed player statistics

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone/Download the project**
   ```bash
   git clone <repository-url>
   cd PenseumPlatformer
   ```

2. **Install all dependencies**
   ```bash
   npm run install-deps
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```
   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend development server on `http://localhost:3000`

4. **Open your browser**
   Navigate to `http://localhost:3000` to play the game!

### 2. Backend Setup

Create the following structure in your `backend` directory:

```
backend/
├── server.js
├── package.json
├── questions/
│   ├── default.json
│   ├── history.json
│   ├── science.json
│   └── math.json
└── .env
```

**Create `backend/server.js`**: Use the provided server code from the artifacts above.

**Create `backend/.env`**:

```env
PORT=5000
NODE_ENV=development
```

**Start backend**:

```bash
cd backend
npm install
npm run dev  # or npm start
```

### 3. Frontend Setup

**Replace `frontend/src/App.js`**:

```javascript
import React from "react";
import EducationalPlatformer from "./components/EducationalPlatformer";
import "./App.css";

function App() {
  return (
    <div className="App">
      <EducationalPlatformer />
    </div>
  );
}

export default App;
```

**Create `frontend/src/components/EducationalPlatformer.js`**: Use the enhanced game component code from the artifacts above.

**Update `frontend/src/App.css`**:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
    "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

.App {
  text-align: center;
}

canvas {
  display: block;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
```

**Start frontend**:

```bash
cd frontend
npm start
```

## 📁 Project Structure

```
educational-platformer/
├── backend/
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   ├── questions/          # Question JSON files
│   │   ├── default.json
│   │   ├── history.json
│   │   ├── science.json
│   │   └── math.json
│   └── .env               # Environment variables
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── EducationalPlatformer.js
    │   ├── App.js
    │   └── App.css
    ├── public/
    └── package.json        # Frontend dependencies
```

## 🎯 Question Format

Questions are stored in JSON files in the `backend/questions/` directory. Each topic is a separate file:

```json
[
  {
    "question": "When did World War II end?",
    "answers": ["1945", "1944", "1946", "1943"],
    "correct": "1945",
    "difficulty": "easy"
  },
  {
    "question": "What is the heaviest naturally occurring element?",
    "answers": ["Uranium", "Lead", "Plutonium", "Osmium"],
    "correct": "Uranium",
    "difficulty": "hard"
  }
]
```

### Question Properties:

- **question**: The question text (string)
- **answers**: Array of 2-4 possible answers (string array)
- **correct**: The correct answer (must match one in answers array)
- **difficulty**: "easy", "medium", or "hard" (affects scoring and power-ups)

## 🎮 Game Mechanics

### Core Gameplay

- **Movement**: Arrow keys or WASD
- **Jumping**: Space, W, or Up arrow
- **Objective**: Jump on platforms with correct answers
- **Lives**: Start with 3 lives, lose one for wrong answers (unless protected)
- **Scoring**: 100 points for easy, 200 for hard questions (affected by multipliers)

### Power-ups (appear on hard questions)

- **🛡️ Shield**: Protects from one wrong answer
- **⚡ Double Boost**: Stronger jump boost for 15 seconds
- **✨ Invincible**: Immune to wrong answers for 8 seconds
- **💎 Score Multiplier**: 3x score for 12 seconds

### Visual Effects

- **Particle Systems**: Explosions, trails, and environmental effects
- **Animated Backgrounds**: Dynamic gradients and floating elements
- **Platform Glows**: Pulsing effects on active platforms
- **Power-up Animations**: Rotating and pulsing collectibles

## 🔧 Customization Guide

### Adding New Topics

1. Create a new JSON file in `backend/questions/`:

```bash
# Example: creating biology questions
touch backend/questions/biology.json
```

2. Add questions in the standard format:

```json
[
  {
    "question": "What is the powerhouse of the cell?",
    "answers": ["Mitochondria", "Nucleus", "Ribosome", "Chloroplast"],
    "correct": "Mitochondria",
    "difficulty": "easy"
  }
]
```

3. Restart the backend server - the new topic will appear automatically!

### Customizing Game Mechanics

**In `EducationalPlatformer.js`, modify these constants:**

```javascript
// Game physics
const GRAVITY = 0.8; // How fast player falls
const JUMP_FORCE = -15; // Initial jump strength
const BOOST_FORCE = -25; // Correct answer boost
const MOVE_SPEED = 8; // Horizontal movement speed

// Scoring
const baseScore = questions[gameState.level].difficulty === "hard" ? 200 : 100;

// Power-up durations (in milliseconds)
setTimeout(() => {
  /* doubleBoost */
}, 15000);
setTimeout(() => {
  /* invincible */
}, 8000);
setTimeout(() => {
  /* scoreMultiplier */
}, 12000);
```

### Visual Customization

**Player appearance** (in the render section):

```javascript
// Change player color
player.color = "#FF6B6B"; // Red (default)

// Add custom player sprite rendering
ctx.fillStyle = playerGradient;
ctx.fillRect(player.x, player.y, player.width, player.height);
```

**Platform styles**:

```javascript
// Platform colors by difficulty
const platformColor =
  currentQuestion.difficulty === "hard" ? "#9B59B6" : "#3498DB";

// Custom platform effects
ctx.shadowBlur = 15 * platform.glowIntensity;
```

### Adding New Power-ups

1. **Add to power-up types**:

```javascript
const powerUpTypes = [
  "shield",
  "doubleBoost",
  "invincible",
  "scoreMultiplier",
  "yourNewPowerUp",
];
```

2. **Define power-up behavior**:

```javascript
case 'yourNewPowerUp':
  newPowerUps.yourNewPowerUp = true;
  // Add your custom logic here
  setTimeout(() => {
    setGameState(current => ({
      ...current,
      powerUps: { ...current.powerUps, yourNewPowerUp: false }
    }));
  }, 10000);
  break;
```

3. **Add visual representation**:

```javascript
const icons = {
  shield: "🛡️",
  doubleBoost: "⚡",
  invincible: "✨",
  scoreMultiplier: "💎",
  yourNewPowerUp: "🆕", // Add your icon
};
```

## 🌐 API Endpoints

### Question Management

- `GET /api/topics` - Get all available topics
- `GET /api/questions/:topic` - Get questions for a topic
- `POST /api/questions/:topic` - Upload new question set

### Score Management

- `GET /api/scores/:topic` - Get high scores for a topic
- `POST /api/scores` - Submit a new score

### Game Statistics

- `GET /api/stats` - Get overall game statistics
- `GET /api/health` - Server health check

## 🚀 Deployment

### Local Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Production Deployment

**Build for production:**

```bash
# Build frontend
cd frontend
npm run build

# Copy build to backend
cp -r build/ ../backend/

# Set environment
cd ../backend
echo "NODE_ENV=production" > .env
```

**Deploy options:**

- **Heroku**: Use provided `Procfile`
- **Vercel**: Deploy frontend separately, backend as API
- **DigitalOcean**: Use Docker containers
- **AWS**: EC2 instance with PM2

### Environment Variables

**Production `.env`:**

```env
NODE_ENV=production
PORT=5000
# Add database URL for persistent scores
# DATABASE_URL=your_database_connection_string
```

## 🎨 Advanced Features

### Database Integration

Replace in-memory high scores with MongoDB:

```javascript
// In server.js
const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  playerName: String,
  score: Number,
  topic: String,
  level: Number,
  date: { type: Date, default: Date.now },
});

const Score = mongoose.model("Score", scoreSchema);
```

### Authentication System

Add user accounts and progress tracking:

```javascript
// Add JWT authentication
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// User registration/login endpoints
app.post("/api/register", async (req, res) => {
  // User registration logic
});

app.post("/api/login", async (req, res) => {
  // User login logic
});
```

### Mobile Controls

Add touch controls for mobile devices:

```javascript
// In EducationalPlatformer.js
useEffect(() => {
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;

    if (x < CANVAS_WIDTH / 3) {
      // Left side - move left
      setKeys((prev) => ({ ...prev, ArrowLeft: true }));
    } else if (x > (CANVAS_WIDTH * 2) / 3) {
      // Right side - move right
      setKeys((prev) => ({ ...prev, ArrowRight: true }));
    } else {
      // Center - jump
      setKeys((prev) => ({ ...prev, " ": true }));
    }
  };

  const canvas = canvasRef.current;
  canvas.addEventListener("touchstart", handleTouchStart);

  return () => canvas.removeEventListener("touchstart", handleTouchStart);
}, []);
```

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**

- Check Node.js version (need v14+)
- Verify all dependencies installed: `npm install`
- Check port 5000 isn't in use: `lsof -i :5000`

**Frontend can't connect to backend:**

- Ensure backend is running on port 5000
- Check proxy setting in `frontend/package.json`
- Verify CORS is enabled in backend

**Questions not loading:**

- Check JSON format is valid
- Ensure `questions/` directory exists
- Verify file permissions

**Game performance issues:**

- Reduce particle count in `createParticles()`
- Lower canvas resolution
- Disable some visual effects

### Performance Optimization

**Reduce particle effects:**

```javascript
// Lower particle counts
createParticles(x, y, color, 5, "explosion"); // Instead of 20
```

**Optimize rendering:**

```javascript
// Use requestAnimationFrame more efficiently
if (Date.now() - lastRender > 16) {
  // 60 FPS cap
  render();
  lastRender = Date.now();
}
```

## 📜 License

MIT License - Feel free to use this template for educational purposes, commercial projects, or modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your enhancements
4. Submit a pull request

---

## 🎉 You're Ready!

Your educational platformer template is now complete
