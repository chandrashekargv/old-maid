# ✨ New Features: Leave Game & Auto-shuffle

## 🚪 **Feature 1: Leave Game Button**

### **What was added:**
- **Leave Game button** in the lobby for players to exit games
- **Server-side handler** for managing player departures
- **Clean state management** when players leave

### **How it works:**
1. Players see "🚪 Leave Game" button in lobby
2. Clicking sends `leave_game` WebSocket message
3. Server removes player from game and updates all remaining players
4. Player returns to main menu
5. Game continues with remaining players (if 2+ left)

### **Code Implementation:**

**Client-side (App.js)**:
```javascript
function leaveGame() {
  setError("");
  if (!ws || ws.readyState !== ws.OPEN) {
    setError("WebSocket not connected. Please refresh and try again.");
    return;
  }
  ws.send(JSON.stringify({ type: 'leave_game', gameId, playerId }));
  
  // Reset local state
  setStep('menu');
  setGameId('');
  setPlayerId('');
  setPlayers([]);
  setHand([]);
  setWinner(null);
  setLoser(null);
  setStarted(false);
  setCurrentTurn(0);
}
```

**Server-side (index.js)**:
```javascript
} else if (data.type === 'leave_game') {
  // Player leaves the game
  const { gameId, playerId } = data;
  const game = games[gameId];
  
  if (!game) {
    ws.send(JSON.stringify({ error: 'Game not found.' }));
    return;
  }
  
  // Remove player from game
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  if (playerIndex !== -1) {
    game.players.splice(playerIndex, 1);
    console.log(`Player ${playerId} left game ${gameId}`);
    
    // Handle turn advancement if current player left
    if (game.currentTurn >= game.players.length) {
      game.currentTurn = 0;
    }
    
    // End game if too few players
    if (game.players.length < 2) {
      game.started = false;
    }
  }
  
  // Clean up empty games
  if (game.players.length === 0) {
    delete games[gameId];
  } else {
    broadcastGame(gameId);
  }
  
  ws.send(JSON.stringify({ type: 'left_game' }));
}
```

---

## 🔀 **Feature 2: Auto-shuffle After Card Actions**

### **What was added:**
- **Auto-shuffle hands** after picking cards from other players
- **Auto-shuffle hands** after discarding pairs
- **Better game dynamics** and prevents card memorization

### **How it works:**
1. When player picks a card: both picker and target hands are shuffled
2. When player discards pairs: their hand is shuffled
3. Uses existing `shuffle()` function for consistency
4. Improves gameplay by randomizing card positions

### **Code Implementation:**

**After Card Pick**:
```javascript
const card = target.hand.splice(cardIndex, 1)[0];
player.hand.push(card);
player.hand = discardPairs(player.hand);

// Auto-shuffle both players' hands after card pick
player.hand = shuffle([...player.hand]);
if (target.hand.length > 0) {
  target.hand = shuffle([...target.hand]);
}
```

**After Discard Pairs**:
```javascript
player.hand = discardPairs(player.hand);

// Auto-shuffle hand after discarding pairs
if (player.hand.length > 0) {
  player.hand = shuffle([...player.hand]);
}
```

---

## 🎨 **UI Improvements**

### **Lobby Actions Styling**:
```css
.lobby-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .lobby-actions {
    gap: 3vw;
    margin-top: 3vw;
  }
  .lobby-actions .main-btn, .lobby-actions .secondary-btn {
    font-size: 0.9rem;
    padding: 2.5vw 4vw;
  }
}
```

### **Button Layout**:
- **Start Game** (main button) and **Leave Game** (secondary button)
- Centered layout with proper spacing
- Mobile-responsive design
- Consistent with existing UI theme

---

## ✅ **Benefits**

### **Leave Game Feature:**
- ✅ **Player flexibility**: Can exit lobby without closing browser
- ✅ **Game continuity**: Other players continue uninterrupted  
- ✅ **Clean state**: Proper cleanup prevents orphaned games
- ✅ **Edge case handling**: Works with ongoing games and turn management

### **Auto-shuffle Feature:**
- ✅ **Better gameplay**: Prevents card position memorization
- ✅ **More randomness**: Increases game unpredictability
- ✅ **Fair play**: Equal randomization for all players
- ✅ **Authentic feel**: More like physical card shuffling

---

## 🚀 **Deployment Status**

**✅ LIVE**: https://chandrashekargv.github.io/old-maid

### **Testing Checklist:**
- ✅ Leave game button appears in lobby
- ✅ Clicking leave game returns to menu
- ✅ Other players see updated player list
- ✅ Cards shuffle after picking/discarding
- ✅ Mobile responsive design works
- ✅ Server handles edge cases properly

---

## 🎮 **How to Test**

### **Leave Game:**
1. Create or join a game
2. See "🚪 Leave Game" button in lobby
3. Click it to return to main menu
4. Other players see you've left

### **Auto-shuffle:**
1. Start a game with multiple players
2. Pick cards from other players
3. Notice your hand order changes (shuffled)
4. Discard pairs and see hand reshuffled

---

*Features implemented and deployed: December 3, 2024*  
*Status: Fully functional and live*  
*Impact: Enhanced multiplayer experience and gameplay dynamics*
