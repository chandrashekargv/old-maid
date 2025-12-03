import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let games = {};
let playerSockets = {};

function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let deck = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  deck.push({ suit: 'Joker', rank: 'Joker' });
  return deck;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function dealCards(deck, numPlayers) {
  if (!Number.isInteger(numPlayers) || numPlayers < 2) throw new Error('Invalid number of players');
  
  // Create hands array
  let hands = Array.from({ length: numPlayers }, () => []);
  
  // Calculate base cards per player and remainder
  const totalCards = deck.length;
  const baseCardsPerPlayer = Math.floor(totalCards / numPlayers);
  const remainder = totalCards % numPlayers;
  
  // Distribute cards more evenly
  let cardIndex = 0;
  
  // First, give everyone the base number of cards
  for (let player = 0; player < numPlayers; player++) {
    for (let card = 0; card < baseCardsPerPlayer; card++) {
      hands[player].push(deck[cardIndex]);
      cardIndex++;
    }
  }
  
  // Then distribute the remaining cards one by one to different players
  for (let extra = 0; extra < remainder; extra++) {
    hands[extra].push(deck[cardIndex]);
    cardIndex++;
  }
  
  // Log the distribution for debugging
  console.log('Card distribution:', hands.map((hand, i) => `Player ${i + 1}: ${hand.length} cards`).join(', '));
  
  return hands;
}

function findPairs(hand) {
  let pairs = [];
  let counts = {};
  for (let card of hand) {
    if (card.suit === 'Joker') continue;
    let key = card.rank;
    counts[key] = counts[key] ? counts[key] + 1 : 1;
  }
  for (let rank in counts) {
    let count = counts[rank];
    let pairCount = Math.floor(count / 2);
    for (let i = 0; i < pairCount; i++) {
      pairs.push(rank);
    }
  }
  return pairs;
}

function discardPairs(hand) {
  let rankCount = {};
  for (let card of hand) {
    if (card.suit === 'Joker') continue;
    rankCount[card.rank] = (rankCount[card.rank] || 0) + 1;
  }
  let newHand = [];
  let used = {};
  for (let card of hand) {
    if (card.suit === 'Joker') {
      newHand.push(card);
      continue;
    }
    if (rankCount[card.rank] >= 2 && (!used[card.rank] || used[card.rank] < 2)) {
      used[card.rank] = (used[card.rank] || 0) + 1;
      if (used[card.rank] <= 2) continue;
    }
    newHand.push(card);
  }
  return newHand;
}

function getGameState(gameId) {
  const game = games[gameId];
  if (!game) return null;
  return {
    players: game.players.map(p => ({ 
      id: p.id, 
      name: p.name, 
      finished: p.finished,
      handCount: p.hand ? p.hand.length : 0,
      hand: p.hand || [] // Include the actual hand for displaying face-down cards
    })),
    currentTurn: game.currentTurn,
    reverse: game.reverse,
    started: game.started,
    loser: game.loser,
    winner: game.winner
  };
}

function broadcastGame(gameId) {
  const game = games[gameId];
  if (!game) return;
  for (const player of game.players) {
    const ws = playerSockets[player.id];
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'game_state', state: getGameState(gameId) }));
    }
  }
}

function checkGameEnd(game) {
  // Check if game has already ended
  if (game.winner || game.loser) return true;
  
  const activePlayers = game.players.filter(p => !p.finished);
  
  // Case 1: Only one player left
  if (activePlayers.length === 1) {
    const lastPlayer = activePlayers[0];
    const hasJoker = lastPlayer.hand.some(c => c.suit === 'Joker');
    
    if (game.reverse) {
      // In reverse mode: having joker = winner, no joker = no result
      if (hasJoker) {
        game.winner = lastPlayer.name;
      }
    } else {
      // In normal mode: having joker = loser, no joker = winner
      if (hasJoker) {
        game.loser = lastPlayer.name;
      } else {
        game.winner = lastPlayer.name;
      }
    }
    return true;
  }
  
  // Case 2: All players finished (shouldn't happen in Old Maid, but handle it)
  if (activePlayers.length === 0) {
    // Find who has the joker among finished players
    const playerWithJoker = game.players.find(p => p.hand.some(c => c.suit === 'Joker'));
    if (playerWithJoker) {
      if (game.reverse) {
        game.winner = playerWithJoker.name;
      } else {
        game.loser = playerWithJoker.name;
      }
    }
    return true;
  }
  
  return false;
}

wss.on('connection', (ws) => {
  let playerId = null;
  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
      return;
    }
    if (data.type === 'create_game') {
      // Create a new game
      let gameId;
      
      console.log('Received create_game request:', JSON.stringify(data));
      
      // Use custom game ID if provided, otherwise generate random one
      if (data.customGameId && typeof data.customGameId === 'string') {
        gameId = data.customGameId.trim();
        
        console.log('Using custom game ID:', gameId);
        
        // Validate custom game ID
        if (gameId.length < 3 || gameId.length > 20) {
          ws.send(JSON.stringify({ error: 'Game ID must be between 3 and 20 characters.' }));
          return;
        }
        
        // Check if game ID already exists
        if (games[gameId]) {
          ws.send(JSON.stringify({ error: 'Game ID already exists. Please choose a different one.' }));
          return;
        }
        
        // Only allow alphanumeric characters and basic symbols
        if (!/^[a-zA-Z0-9_-]+$/.test(gameId)) {
          ws.send(JSON.stringify({ error: 'Game ID can only contain letters, numbers, hyphens, and underscores.' }));
          return;
        }
      } else {
        // Generate random game ID
        gameId = Math.random().toString(36).substr(2, 8);
        console.log('Generated random game ID:', gameId);
      }
      
      games[gameId] = {
        players: [],
        started: false,
        currentTurn: 0,
        reverse: !!data.reverse,
        loser: null,
        winner: null
      };
      
      // Auto-join the creator if creatorName is provided
      if (data.creatorName && typeof data.creatorName === 'string' && data.creatorName.trim().length > 0) {
        const creatorName = data.creatorName.trim();
        const creatorPlayerId = Math.random().toString(36).substr(2, 8);
        playerId = creatorPlayerId; // Set the connection's playerId
        games[gameId].players.push({ id: creatorPlayerId, name: creatorName, hand: [], finished: false });
        playerSockets[creatorPlayerId] = ws;
        console.log(`Creator ${creatorName} auto-joined game ${gameId} with ID ${creatorPlayerId}`);
        ws.send(JSON.stringify({ type: 'game_created', gameId, joined: true, playerId: creatorPlayerId }));
        broadcastGame(gameId);
      } else {
        ws.send(JSON.stringify({ type: 'game_created', gameId }));
      }
    } else if (data.type === 'join_game') {
      // Join an existing game
      const { gameId, name } = data;
      if (!games[gameId]) {
        ws.send(JSON.stringify({ error: 'Game not found.' }));
        return;
      }
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        ws.send(JSON.stringify({ error: 'Player name is required.' }));
        return;
      }
      if (games[gameId].players.length >= 8) {
        ws.send(JSON.stringify({ error: 'Game is full (max 8 players).' }));
        return;
      }
      const newPlayerId = Math.random().toString(36).substr(2, 8);
      playerId = newPlayerId; // Set the connection's playerId
      games[gameId].players.push({ id: newPlayerId, name, hand: [], finished: false });
      playerSockets[newPlayerId] = ws;
      console.log(`Player ${name} joined game ${gameId} with ID ${newPlayerId}`);
      ws.send(JSON.stringify({ type: 'joined', playerId: newPlayerId, gameId }));
      broadcastGame(gameId);
    } else if (data.type === 'start_game') {
      // Start the game
      const { gameId } = data;
      const game = games[gameId];
      if (!game || game.started) return;
      if (game.players.length < 2 || game.players.length > 8) {
        ws.send(JSON.stringify({ error: 'Number of players must be between 2 and 8.' }));
        return;
      }
      const deck = shuffle(createDeck());
      const hands = dealCards(deck, game.players.length);
      game.started = true;
      game.currentTurn = 0;
      game.loser = null;
      game.winner = null;
      for (let i = 0; i < game.players.length; i++) {
        game.players[i].hand = discardPairs(hands[i]);
        
        // Check if player finished immediately after initial discard
        if (game.players[i].hand.length === 0) {
          game.players[i].finished = true;
        }
        
        playerSockets[game.players[i].id].send(JSON.stringify({ type: 'hand', hand: game.players[i].hand }));
      }
      
      // Check for immediate game end condition after initial setup
      checkGameEnd(game);
      broadcastGame(gameId);
    } else if (data.type === 'new_game') {
      // Start a new game (reset current game state)
      const { gameId } = data;
      const game = games[gameId];
      if (!game) {
        ws.send(JSON.stringify({ error: 'Game not found.' }));
        return;
      }
      
      // Reset game state but keep players
      game.started = false;
      game.currentTurn = 0;
      game.loser = null;
      game.winner = null;
      
      // Reset all players
      for (let player of game.players) {
        player.hand = [];
        player.finished = false;
      }
      
      // Notify all players that game is reset
      broadcastGame(gameId);
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
        
        // If game was started and player had cards, redistribute them
        if (game.started && game.players.length > 0) {
          // If current turn player left, advance turn
          if (game.currentTurn >= game.players.length) {
            game.currentTurn = 0;
          }
          
          // Check if game should end due to too few players
          if (game.players.length < 2) {
            game.started = false;
            game.winner = null;
            game.loser = null;
          }
        }
        
        // If no players left, clean up the game
        if (game.players.length === 0) {
          delete games[gameId];
          console.log(`Game ${gameId} deleted - no players remaining`);
        } else {
          // Broadcast updated game state
          broadcastGame(gameId);
        }
      }
      
      // Remove player socket
      if (playerSockets[playerId]) {
        delete playerSockets[playerId];
      }
      
      // Send confirmation to leaving player
      ws.send(JSON.stringify({ type: 'left_game' }));
      
    } else if (data.type === 'discard_pairs') {
      // Discard pairs from hand
      const { gameId, playerId } = data;
      const game = games[gameId];
      if (!game) {
        ws.send(JSON.stringify({ error: 'Game not found.' }));
        return;
      }
      const player = game.players.find(p => p.id === playerId);
      if (!player) {
        ws.send(JSON.stringify({ error: 'Player not found.' }));
        return;
      }
      player.hand = discardPairs(player.hand);
      
      // Auto-shuffle hand after discarding pairs
      if (player.hand.length > 0) {
        player.hand = shuffle([...player.hand]);
      }
      
      // Check if player finished after discarding pairs
      if (player.hand.length === 0) {
        player.finished = true;
      }
      
      // Check for game end condition
      checkGameEnd(game);
      
      playerSockets[playerId].send(JSON.stringify({ type: 'hand', hand: player.hand }));
      broadcastGame(gameId);
    } else if (data.type === 'pick_card') {
      // Pick a card from another player
      const { gameId, playerId, targetId, cardIndex } = data;
      const game = games[gameId];
      if (!game) {
        ws.send(JSON.stringify({ error: 'Game not found.' }));
        return;
      }
      const player = game.players.find(p => p.id === playerId);
      const target = game.players.find(p => p.id === targetId);
      if (!player) {
        ws.send(JSON.stringify({ error: 'Player not found.' }));
        return;
      }
      if (!target) {
        ws.send(JSON.stringify({ error: 'Target player not found.' }));
        return;
      }
      
      // Check if it's the player's turn
      if (game.players[game.currentTurn].id !== playerId) {
        ws.send(JSON.stringify({ error: 'Not your turn!' }));
        return;
      }
      
      // Check if picking from themselves
      if (playerId === targetId) {
        ws.send(JSON.stringify({ error: 'Cannot pick from yourself!' }));
        return;
      }
      
      // Enforce sequential picking: can only pick from the next player in turn order
      const currentPlayerIndex = game.players.findIndex(p => p.id === playerId);
      const targetPlayerIndex = game.players.findIndex(p => p.id === targetId);
      const expectedNextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
      
      if (targetPlayerIndex !== expectedNextPlayerIndex) {
        const nextPlayerName = game.players[expectedNextPlayerIndex].name;
        ws.send(JSON.stringify({ error: `You can only pick from the next player: ${nextPlayerName}` }));
        return;
      }
      
      // Skip finished players in sequence
      let nextValidPlayerIndex = expectedNextPlayerIndex;
      while (game.players[nextValidPlayerIndex].finished && nextValidPlayerIndex !== currentPlayerIndex) {
        nextValidPlayerIndex = (nextValidPlayerIndex + 1) % game.players.length;
      }
      
      if (targetPlayerIndex !== nextValidPlayerIndex) {
        const nextValidPlayerName = game.players[nextValidPlayerIndex].name;
        ws.send(JSON.stringify({ error: `You must pick from the next available player: ${nextValidPlayerName}` }));
        return;
      }
      if (!Array.isArray(target.hand) || target.hand.length === 0) {
        ws.send(JSON.stringify({ error: 'Target player has no cards.' }));
        return;
      }
      if (typeof cardIndex !== 'number' || cardIndex < 0 || cardIndex >= target.hand.length) {
        ws.send(JSON.stringify({ error: 'Invalid card index.' }));
        return;
      }
      const card = target.hand.splice(cardIndex, 1)[0];
      player.hand.push(card);
      player.hand = discardPairs(player.hand);
      
      // Auto-shuffle both players' hands after card pick
      player.hand = shuffle([...player.hand]);
      if (target.hand.length > 0) {
        target.hand = shuffle([...target.hand]);
      }
      
      playerSockets[playerId].send(JSON.stringify({ type: 'hand', hand: player.hand }));
      playerSockets[targetId].send(JSON.stringify({ type: 'hand', hand: target.hand }));
      // Check for finish
      if (player.hand.length === 0) player.finished = true;
      if (target.hand.length === 0) target.finished = true;
      
      // Check for game end condition
      const gameEnded = checkGameEnd(game);
      
      // Only advance turn if game hasn't ended
      if (!gameEnded) {
        // Advance turn to next active player
        let attempts = 0;
        const maxAttempts = game.players.length;
        const activePlayers = game.players.filter(p => !p.finished);
        
        do {
          game.currentTurn = (game.currentTurn + 1) % game.players.length;
          attempts++;
          // Prevent infinite loop in case all players somehow finish
          if (attempts >= maxAttempts) {
            console.error('Could not find next active player');
            break;
          }
        } while (game.players[game.currentTurn].finished && activePlayers.length > 1);
      }
      broadcastGame(gameId);
    }
  });
  ws.on('close', () => {
    if (playerId) delete playerSockets[playerId];
  });
});

app.get('/', (req, res) => {
  res.send('Old Maid Game Server Running');
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
