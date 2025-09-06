# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

Educational Platformer Game is a web-based learning platform that combines education with gaming mechanics using the MERN stack. Players jump between platforms representing multiple-choice answers, earning points for correct responses and collecting power-ups to enhance gameplay.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Phaser.js 3.90
- Backend: Express.js + Node.js 
- Data Storage: JSON files (`backend/data/`)
- Game Engine: Phaser.js with custom systems architecture

## Common Commands

### Project Setup
```bash
# Install all dependencies (root, backend, frontend)
npm run install-deps

# Start both backend and frontend in development mode
npm run dev
```

### Development Servers
```bash
# Start backend only (port 5001)
npm run server
# Alternative: cd backend && npm run dev

# Start frontend only (port 3000)  
npm run client
# Alternative: cd frontend && npm start

# Build frontend for production
npm run build
# Alternative: cd frontend && npm run build
```

### Backend Commands
```bash
cd backend

# Development with auto-reload
npm run dev

# Production start
npm start

# Test API endpoints
curl http://localhost:5001/api/questions
curl http://localhost:5001/api/scores/leaderboard/10
```

### Frontend Commands
```bash
cd frontend

# Development server with hot reload
npm start

# Production build
npm run build

# Run tests (Jest + React Testing Library)
npm test

# TypeScript compilation check
npx tsc --noEmit
```

### Testing Individual Components
```bash
# Test specific frontend component
cd frontend && npm test -- --testNamePattern="StartScreen"

# Test backend routes manually
cd backend && node -e "console.log(require('./routes/questions'))"

# Validate questions JSON format
cd backend && node -e "console.log(JSON.parse(require('fs').readFileSync('./data/questions.json', 'utf8')).length + ' questions loaded')"
```

## Architecture Overview

### High-Level Structure
```
PenseumPlatformer/
├── backend/                 # Express.js API server
│   ├── routes/             # API route handlers
│   ├── data/               # JSON data storage
│   └── server.js           # Main server entry point
├── frontend/               # React + TypeScript client
│   └── src/
│       ├── components/     # React UI components
│       ├── game/           # Phaser.js game systems
│       ├── types/          # TypeScript definitions
│       └── utils/          # API client utilities
└── package.json            # Root project scripts
```

### Data Flow Architecture
1. **React App** (`App.tsx`) manages game state (start/playing/gameOver)
2. **Game Component** (`Game.tsx`) initializes Phaser.js and passes props
3. **MainGameScene** (`MainGameScene.ts`) orchestrates all game systems
4. **API Client** (`utils/api.ts`) handles all backend communication
5. **Express Routes** serve questions and store scores in JSON files

### React ↔ Phaser Integration
- React renders UI overlay and manages global state
- Phaser handles game mechanics, physics, and rendering  
- Communication via props passed to scene constructor
- Game events bubble up to React via callback functions

## Game Systems Architecture

The game uses a modular systems architecture within Phaser.js:

### Core Systems
- **PlayerEntity** (`entities/PlayerEntity.ts`) - Player movement, collision, state
- **PlatformSystem** (`systems/PlatformSystem.ts`) - Question platform generation and physics
- **PowerUpSystem** (`systems/PowerUpSystem.ts`) - Power-up spawning and collection
- **ParticleSystem** (`systems/ParticleSystem.ts`) - Visual effects and animations
- **UISystem** (`systems/UISystem.ts`) - In-game HUD and score display
- **EnemySystem** (`systems/EnemySystem.ts`) - Obstacles and enemy behavior
- **ProjectileSystem** (`systems/ProjectileSystem.ts`) - Projectile physics and collision

### Game Configuration
**GameConfig** (`game/config/GameConfig.ts`) centralizes all physics constants:
- Jump velocities and gravity settings
- Platform generation parameters (width, spacing, reachability)
- Power-up durations and effects
- Screen boundary definitions

Key methods:
- `getMaxJumpHeight()` - Calculates physics-based jump height
- `isPlatformReachable()` - Validates platform placement
- `getSafeJumpHeight()` - Ensures platforms are reachable

### Physics Tuning
To modify game difficulty, adjust constants in `GameConfig.ts`:
```typescript
static readonly GRAVITY = 300;           // Affects fall speed
static readonly JUMP_VELOCITY = 1000;    // Initial jump power  
static readonly PLATFORM_REACH_PERCENTAGE = 0.8;  // Platform difficulty
```

### Question Management
Questions flow from `backend/data/questions.json` → API → Game Scene → Platforms:
1. Scene fetches questions via `fetchRandomQuestions()`
2. `PlatformSystem` creates platforms for each answer choice
3. Player collision triggers answer validation
4. Correct answers boost player upward, wrong answers cost lives

## Backend API Reference

### Question Endpoints
- `GET /api/questions` - Fetch all questions
- `GET /api/questions/random/:count` - Get random subset (default 10)
- `GET /api/questions/difficulty/:level` - Filter by easy/medium/hard
- `POST /api/questions/validate` - Validate answer submission

### Score Endpoints  
- `GET /api/scores/leaderboard/:limit` - Top scores (default 10)
- `POST /api/scores` - Submit new score
- `DELETE /api/scores/:id` - Remove score entry

### Data Models

**Question Format** (`backend/data/questions.json`):
```json
{
  "id": 1,
  "question": "When did World War II end?",
  "answers": ["1945", "1944", "1946", "1943"],
  "correct": "1945", 
  "difficulty": "easy",
  "subject": "History",
  "explanation": "World War II ended in 1945...",
  "points": 100
}
```

**Score Submission** (POST `/api/scores`):
```json
{
  "playerName": "string",
  "score": "number", 
  "questionsAnswered": "number",
  "correctAnswers": "number",
  "lives": "number",
  "powerUpsUsed": "number",
  "gameMode": "standard",
  "difficulty": "mixed"
}
```

## TypeScript Type System

### Shared Types (`frontend/src/types/GameTypes.ts`)
- **Question** - Question data structure matching backend
- **Player** - Player state including position, lives, power-ups
- **Platform** - Answer platform properties and positioning  
- **PowerUp** - Power-up types and effects (shield, boost, invincibility, etc.)
- **GameStats** - Score tracking and performance metrics
- **ScoreData** - Leaderboard entry format

### API Contract (`frontend/src/utils/api.ts`)
All backend communication is typed and includes fallbacks:
```typescript
export const fetchRandomQuestions = async (count: number = 10): Promise<Question[]>
export const saveScore = async (scoreData: Omit<ScoreData, 'id' | 'timestamp' | 'accuracy'>): Promise<ScoreData>
```

### Game Configuration Types
**GameConfig** uses static methods ensuring type safety:
- Physics calculations are strongly typed
- Platform generation respects numeric constraints  
- Power-up durations and effects use enums

## Key Configuration Files

### Root Level
- `package.json` - Main project scripts and concurrently setup
- `DEPLOYMENT.md` - Production deployment instructions
- `README.md` - User-facing documentation

### Backend Config  
- `backend/.env` - Environment variables (PORT, NODE_ENV)
- `backend/package.json` - Express dependencies and dev scripts
- `backend/server.js` - CORS, routing, static file serving

### Frontend Config
- `frontend/tsconfig.json` - TypeScript compiler settings (strict mode enabled)
- `frontend/package.json` - React scripts, Phaser dependency
- `frontend/src/App.tsx` - Main component with game state management

### Game Engine Config
- `game/config/GameConfig.ts` - Physics constants and gameplay tuning
- `game/scenes/MainGameScene.ts` - Scene initialization and system coordination

## Development Workflow

### Adding New Questions
1. Edit `backend/data/questions.json` directly
2. Follow exact JSON format with all required fields
3. Restart backend server to reload questions
4. Questions automatically appear in random rotation

### Modifying Game Physics
1. Adjust constants in `GameConfig.ts` 
2. Use `GameConfig.getJumpPhysicsInfo()` to debug changes
3. Test platform reachability with various configurations
4. Frontend hot-reloads automatically reflect changes

### Creating New Power-ups
1. Add power-up type to `PowerUp` interface in `GameTypes.ts`
2. Implement behavior in `PowerUpSystem.ts`
3. Add visual representation in sprite creation methods
4. Update collection and duration logic

### Backend Route Development
1. Add new routes in `backend/routes/` directory
2. Follow existing patterns for error handling and JSON responses
3. Update `server.js` to register new route modules
4. Test endpoints with curl or API client

### Frontend Component Testing
```bash
cd frontend
npm test -- --watch
```

Run specific test suites:
```bash
npm test -- --testPathPattern="components"
```

### Type Safety Validation
```bash  
cd frontend
npx tsc --noEmit --strict
```

### Production Build Testing
```bash
npm run build
cd backend && npm start
# Test production build at http://localhost:5001
```

## Common Issues & Solutions

### Backend Won't Start
- Verify Node.js version (requires v14+)
- Check if port 5001 is available: `lsof -i :5001` 
- Ensure `backend/data/` directory exists with valid JSON files

### Frontend Build Errors
- Clear TypeScript cache: `rm -rf frontend/node_modules/.cache`
- Check for type mismatches in game systems
- Verify Phaser.js version compatibility

### Game Performance Issues
- Reduce particle count in `ParticleSystem`
- Lower physics iteration rate in Phaser config
- Disable debug mode in production builds

### API Connection Failures
- Check `REACT_APP_API_URL` environment variable
- Verify CORS configuration in backend
- Test API endpoints directly with curl

### Questions Not Loading
- Validate JSON syntax in `questions.json`
- Check file permissions on data directory
- Review console errors in browser dev tools
