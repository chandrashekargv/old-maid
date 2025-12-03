# 🃏 Old Maid - Online Multiplayer Card Game

A complete implementation of the classic Old Maid card game with modern web technologies, featuring real-time multiplayer gameplay, custom game rooms, and authentic playing card graphics.

## 🎮 **Live Demo**

**🌐 Play Online Now**: https://chandrashekargv.github.io/old-maid

**🎯 How to Play with Friends**:
1. Visit the game URL above
2. Create a game with a custom ID (e.g., "friends-night")  
3. Share the Game ID with friends
4. Friends join using the same Game ID
5. Start playing together in real-time!

## ✨ **Features**

### 🎯 **Core Gameplay**
- **Traditional Old Maid Rules**: Classic card matching with the dreaded Joker
- **2-8 Players**: Flexible player count with intelligent card distribution
- **Sequential Picking**: Enforced clockwise turn order for authentic gameplay
- **Reverse Mode**: Optional variant where having the Joker wins!
- **Real-time Multiplayer**: Instant synchronization across all players

### 🎨 **Authentic Design**
- **Traditional Playing Cards**: Corner indices, pip arrangements, face cards
- **Professional Graphics**: Authentic card proportions and styling
- **Enhanced Typography**: Larger, readable fonts for better gameplay
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Card picking, hover effects, and transitions

### 🛠 **Modern Features**
- **Custom Game IDs**: Create memorable room names like "family-game-night"
- **Player Avatars**: Colorful initial-based avatars for each player
- **Drag & Drop**: Arrange cards in your hand as you prefer
- **New Game Function**: Restart without losing players
- **Turn Indicators**: Clear visual feedback for whose turn it is
- **Error Handling**: Helpful error messages and input validation

## 🚀 **Quick Start**

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chandrashekargv/old-maid.git
   cd old-maid
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd old-maid/server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Start the servers**
   
   **Backend Server (Terminal 1):**
   ```bash
   cd old-maid/server
   npm start
   ```
   Server runs on `http://localhost:4000`
   
   **Frontend Server (Terminal 2):**
   ```bash
   cd old-maid/client
   npm start
   ```
   Game runs on `http://localhost:3000`

4. **Play the game!**
   - Open `http://localhost:3000` in your browser
   - Create a game with a custom ID or join an existing one
   - Share the Game ID with friends
   - Start playing when 2-8 players are ready!

## 🎲 **How to Play**

### Game Setup
1. **Create or Join**: Use a custom Game ID or join an existing game
2. **Wait for Players**: Game supports 2-8 players
3. **Start Game**: Host starts when enough players have joined

### Gameplay
1. **Discard Pairs**: Remove matching rank pairs from your hand
2. **Pick Cards**: Take turns picking from the next player's hand
3. **Sequential Order**: You can only pick from the player after you
4. **Win Condition**: 
   - **Normal Mode**: Don't get stuck with the Joker (last player with Joker loses)
   - **Reverse Mode**: Try to get the Joker (Joker holder wins)

### Controls
- **Drag & Drop**: Rearrange cards in your hand
- **Click to Pick**: Select a face-down card from another player
- **Discard Pairs**: Use the button to remove matching pairs
- **New Game**: Start fresh while keeping the same players

## 🔧 **Technical Architecture**

### Backend (Node.js)
- **Express.js** server with WebSocket support
- **Real-time communication** with `ws` library
- **Game state management** with proper validation
- **Custom Game ID system** with collision detection
- **Comprehensive game-ending logic** for all scenarios

### Frontend (React)
- **React 18** with modern hooks
- **WebSocket client** for real-time updates
- **Responsive CSS** with mobile-first design
- **Traditional card graphics** with authentic styling
- **Smooth animations** and visual feedback

### Key Components
```
old-maid/
├── server/
│   ├── index.js          # Main server with game logic
│   └── package.json      # Server dependencies
├── client/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── index.css     # Styling and card graphics
│   │   └── index.js      # React entry point
│   └── public/
│       └── index.html    # HTML template
└── README.md             # This file
```

## 🐛 **Recent Fixes & Improvements**

### Critical Bug Fixes ✅
- **Fixed game-ending logic**: Games now properly end with correct winners/losers
- **Enhanced new game functionality**: Smooth reset without disconnecting players
- **Improved client-server sync**: Better state management and error handling

### New Features ✅
- **Custom Game IDs**: Create memorable room names instead of random strings
- **Enhanced UI**: Separated create/join sections, better typography, styled buttons
- **Mobile optimization**: Improved responsive design and touch interactions

### Performance Improvements ✅
- **Optimized card distribution**: Even distribution algorithm for fair gameplay
- **Better turn management**: Prevents infinite loops and handles edge cases
- **Memory management**: Proper cleanup and error handling

## 🎯 **Game Rules Reference**

### Traditional Old Maid Rules
1. **Goal**: Avoid being the last player holding the Joker
2. **Setup**: Remove one Queen, add a Joker, deal all cards evenly
3. **Play**: 
   - Discard pairs of matching ranks
   - Take turns picking cards from the next player
   - Continue until only one player has cards left
4. **End**: Player left with the Joker loses

### Reverse Mode (Optional)
- **Goal**: Try to GET the Joker and finish first
- **Winning**: Player who finishes first with the Joker wins
- **Strategy**: Completely different from traditional play!

## 🤝 **Contributing**

Contributions are welcome! Here are some ways to help:

- **Bug Reports**: Found an issue? [Open an issue](https://github.com/chandrashekargv/old-maid/issues)
- **Feature Requests**: Have an idea? Let's discuss it!
- **Code Contributions**: Fork, improve, and submit a PR
- **Documentation**: Help improve the docs and examples

## 📝 **License**

This project is licensed under the MIT License.

## 🙏 **Acknowledgments**

- Classic Old Maid card game rules and traditions
- React and Node.js communities for excellent documentation
- Playing card design inspiration from traditional decks
- WebSocket technology for real-time multiplayer gaming

---

**Made with ❤️ for card game lovers everywhere!**

🎉 **Ready to play? Fire up the servers and start a game with friends!** 🎉