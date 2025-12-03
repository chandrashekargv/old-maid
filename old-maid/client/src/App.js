import React, { useState, useEffect, useRef } from "react";
import "./index.css";

function Avatar({ name }) {
  // Simple avatar: use initials and color
  const colors = ["#7c5fe6", "#e63946", "#457b9d", "#f9c74f", "#2e8b57", "#4b2e83", "#ffb703", "#fb8500"];
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
  const color = colors[(name.charCodeAt(0) + name.length) % colors.length];
  return (
    <div className="avatar" style={{ background: color }}>
      {initials}
    </div>
  );
}

function Card({ card, onClick, faceDown, draggable, dragIndex, onDragStart, onDrop, animate }) {
  const suitSymbols = {
    '♠': '♠',
    '♥': '♥',
    '♦': '♦',
    '♣': '♣',
    'Joker': '★'
  };
  
  const suitColors = {
    '♠': '#000',     // Traditional black
    '♣': '#000',     // Traditional black
    '♥': '#dc3545',  // Traditional red
    '♦': '#dc3545',  // Traditional red
    'Joker': '#8b00ff' // Purple for joker
  };
  
  const handleClick = () => {
    if (onClick) onClick();
  };
  
  // When face-down, all cards should look identical to prevent Joker detection
  const cardClasses = `playing-card${faceDown ? ' facedown' : ''}${!faceDown && card.suit === 'Joker' ? ' joker' : ''}${animate ? ' animate' : ''}${onClick ? ' clickable' : ''}`;
  const cardStyle = faceDown ? {} : { color: suitColors[card.suit] };
  
  const renderCardFace = () => {
    if (card.suit === 'Joker') {
      return (
        <div className="joker-content">
          <div className="corner-index top-left">
            <div className="rank">★</div>
            <div className="suit">JOKER</div>
          </div>
          <div className="center-content">
            <div className="joker-symbol">🃏</div>
            <div className="joker-text">JOKER</div>
          </div>
          <div className="corner-index bottom-right">
            <div className="rank">★</div>
            <div className="suit">JOKER</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="card-content">
        {/* Top-left corner index */}
        <div className="corner-index top-left">
          <div className="rank">{card.rank}</div>
          <div className="suit">{suitSymbols[card.suit]}</div>
        </div>
        
        {/* Center content - pip arrangement or face card */}
        <div className="center-content">
          {['J', 'Q', 'K'].includes(card.rank) ? (
            <div className="face-card">
              <div className="face-rank">{card.rank}</div>
              <div className="face-suit">{suitSymbols[card.suit]}</div>
            </div>
          ) : (
            <div className="pip-content">
              {renderPips(card.rank, suitSymbols[card.suit])}
            </div>
          )}
        </div>
        
        {/* Bottom-right corner index (rotated) */}
        <div className="corner-index bottom-right">
          <div className="rank">{card.rank}</div>
          <div className="suit">{suitSymbols[card.suit]}</div>
        </div>
      </div>
    );
  };
  
  const renderPips = (rank, suitSymbol) => {
    const pipCount = rank === 'A' ? 1 : parseInt(rank) || 0;
    if (pipCount === 0) return null;
    
    const pips = [];
    for (let i = 0; i < Math.min(pipCount, 10); i++) {
      pips.push(
        <span key={i} className={`pip pip-${i + 1} pip-count-${pipCount}`}>
          {suitSymbol}
        </span>
      );
    }
    return pips;
  };
  
  return (
    <div
      className={cardClasses}
      style={cardStyle}
      onClick={handleClick}
      draggable={draggable}
      onDragStart={e => onDragStart && onDragStart(e, dragIndex)}
      onDrop={e => onDrop && onDrop(e, dragIndex)}
      onDragOver={e => e.preventDefault()}
    >
      {faceDown ? (
        <div className="card-back">
          <div className="back-pattern">
            <div className="back-border"></div>
            <div className="back-design"></div>
          </div>
        </div>
      ) : (
        renderCardFace()
      )}
    </div>
  );
}

function Dashboard({ step, setStep, onCreate, onJoin, gameId, setGameId, customGameId, setCustomGameId, name, setName, reverse, setReverse, error }) {
  return (
    <div className="dashboard">
      <h1 className="title">🃏 Old Maid Online</h1>
      {error && <div className="error">{error}</div>}
      <nav className="nav">
        <button className="nav-btn" onClick={() => setStep('menu')}>Home</button>
        <button className="nav-btn" onClick={() => setStep('lobby')}>Lobby</button>
        <button className="nav-btn" onClick={() => setStep('game')}>Game</button>
      </nav>
      {step === 'menu' && (
        <div className="menu-card vertical">
          <h2>Create a New Game</h2>
          <input 
            className="input" 
            placeholder="Custom Game ID (optional)" 
            value={customGameId} 
            onChange={e => setCustomGameId(e.target.value)}
            maxLength={20}
            title="3-20 characters, letters, numbers, hyphens, and underscores only"
          />
          <label className="checkbox-label">
            <input type="checkbox" checked={reverse} onChange={e => setReverse(e.target.checked)} /> Reverse Mode (Joker wins)
          </label>
          <input className="input" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
          <button className="main-btn" onClick={onCreate}>Create Game</button>
          
          <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid #ddd'}} />
          
          <h2>Join an Existing Game</h2>
          <input className="input" placeholder="Game ID to join" value={gameId} onChange={e => setGameId(e.target.value)} />
          <input className="input" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
          <button className="main-btn" onClick={onJoin}>Join Game</button>
        </div>
      )}
    </div>
  );
}

function App() {
  const [step, setStep] = useState('menu');
  const [ws, setWs] = useState(null);
  const [gameId, setGameId] = useState('');
  const [customGameId, setCustomGameId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [name, setName] = useState('');
  const [hand, setHand] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [winner, setWinner] = useState(null);
  const [loser, setLoser] = useState(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [animateIdx, setAnimateIdx] = useState(null);
  const wsRef = useRef(null);
  const nameRef = useRef('');

  // Keep nameRef in sync with name state
  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  // Automatically connect to WebSocket on mount
  useEffect(() => {
    if (wsRef.current) return;
    
    // Production-ready WebSocket connection
    const getWebSocketUrl = () => {
      if (process.env.NODE_ENV === 'production') {
        // Use environment variable if available, otherwise use Railway URL
        return process.env.REACT_APP_BACKEND_URL || 'wss://old-maid-production.up.railway.app';
      }
      // Development mode
      return 'ws://' + window.location.hostname + ':4000';
    };
    
    const socket = new window.WebSocket(getWebSocketUrl());
    socket.onopen = () => {
      setWs(socket);
      wsRef.current = socket;
    };
    socket.onerror = () => {
      setWs(null);
      wsRef.current = null;
    };
    socket.onclose = () => {
      setWs(null);
      wsRef.current = null;
    };
    // Clean up on unmount
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (!ws) return;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        setError(data.error);
        return;
      }
      setError("");
      if (data.type === 'game_created') {
        setGameId(data.gameId);
        // Auto-join as host with current name from ref
        const currentName = nameRef.current.trim();
        if (currentName) {
          ws.send(JSON.stringify({ type: 'join_game', gameId: data.gameId, name: currentName }));
        } else {
          setError("Please enter your name first.");
        }
      } else if (data.type === 'joined') {
        setPlayerId(data.playerId);
        setGameId(data.gameId);
        setStep('lobby');
      } else if (data.type === 'game_state') {
        setPlayers(data.state.players);
        setCurrentTurn(data.state.currentTurn);
        setReverse(data.state.reverse);
        setWinner(data.state.winner);
        setLoser(data.state.loser);
        setStarted(data.state.started);
        // Auto-switch to game view when game starts
        if (data.state.started && step !== 'game') {
          setStep('game');
        }
        // Auto-switch to lobby when game is reset (new game)
        if (!data.state.started && step === 'game') {
          setStep('lobby');
        }
      } else if (data.type === 'hand') {
        setHand(data.hand);
      }
    };
    ws.onerror = () => {
      setError("Connection error. Please refresh and try again.");
    };
  }, [ws]);

  function createGame() {
    setError("");
    if (!name || !name.trim()) {
      setError("Please enter your name first.");
      return;
    }
    if (!ws || ws.readyState !== ws.OPEN) {
      setError("WebSocket not connected. Please refresh and try again.");
      return;
    }
    
    // Send custom game ID if provided
    const gameData = { type: 'create_game', reverse };
    if (customGameId && customGameId.trim()) {
      gameData.customGameId = customGameId.trim();
    }
    
    ws.send(JSON.stringify(gameData));
  }

  function joinGame() {
    setError("");
    if (!gameId || !name) {
      setError("Game ID and Name are required.");
      return;
    }
    if (!ws || ws.readyState !== ws.OPEN) {
      setError("WebSocket not connected. Please refresh and try again.");
      return;
    }
    ws.send(JSON.stringify({ type: 'join_game', gameId: gameId.trim(), name: name.trim() }));
  }

  function startGame() {
    setError("");
    ws.send(JSON.stringify({ type: 'start_game', gameId }));
  }

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

  function startNewGame() {
    setError("");
    // Reset local game state
    setHand([]);
    setWinner(null);
    setLoser(null);
    setStarted(false);
    setCurrentTurn(0);
    setAnimateIdx(null);
    setDraggedIdx(null);
    
    // Request new game from server
    ws.send(JSON.stringify({ type: 'new_game', gameId }));
    
    // Don't immediately go back to lobby - wait for server response
    // The game_state message will handle the UI transition
  }

  function discardPairs() {
    setError("");
    ws.send(JSON.stringify({ type: 'discard_pairs', gameId, playerId }));
  }

  function pickCard(targetId, cardIndex) {
    setError("");
    setAnimateIdx(cardIndex);
    setTimeout(() => setAnimateIdx(null), 700);
    ws.send(JSON.stringify({ type: 'pick_card', gameId, playerId, targetId, cardIndex }));
  }

  function onDragStart(e, idx) {
    setDraggedIdx(idx);
  }

  function onDrop(e, idx) {
    if (draggedIdx === null || draggedIdx === idx) return;
    const newHand = [...hand];
    const [moved] = newHand.splice(draggedIdx, 1);
    newHand.splice(idx, 0, moved);
    setHand(newHand);
    setDraggedIdx(null);
  }

  // Lock mode after game creation
  useEffect(() => {
    if (step === 'lobby' && started) {
      setReverse(reverse); // lock mode
    }
  }, [step, started]);

  function handleCreate() {
    createGame();
    setStep('lobby');
  }
  function handleJoin() {
    joinGame();
    setStep('lobby');
  }

  // Vertical mobile layout for game
  return (
    <div className="container pro-ui vertical-layout">
      <Dashboard
        step={step}
        setStep={setStep}
        onCreate={handleCreate}
        onJoin={handleJoin}
        gameId={gameId}
        setGameId={setGameId}
        customGameId={customGameId}
        setCustomGameId={setCustomGameId}
        name={name}
        setName={setName}
        reverse={reverse}
        setReverse={setReverse}
        error={error}
      />
      {ws && step === 'lobby' && (
        <div className="lobby-card vertical">
          <h2>Lobby</h2>
          <div><strong>Game ID:</strong> {gameId}</div>
          <div><strong>Players:</strong> {players.map((p, idx) => idx === 0 ? `${p.name} (Host)` : p.name).join(', ')}</div>
          <div className="lobby-info">
            <div>👥 <strong>{players.length}</strong> players ready</div>
            {players.length >= 2 && (
              <div>🃏 Cards per player: <strong>{Math.floor(53 / players.length)}-{Math.ceil(53 / players.length)}</strong></div>
            )}
            <div>🎯 <strong>Sequential picking:</strong> Clockwise turn order</div>
          </div>
          <div className="lobby-actions">
            <button className="main-btn" onClick={startGame} disabled={started}>Start Game</button>
            <button className="secondary-btn" onClick={leaveGame}>🚪 Leave Game</button>
          </div>
        </div>
      )}
      {ws && step === 'game' && started && (
        <div className="game-area">
          {(winner || loser) ? (
            <div className="result-card">
              <h2>Game Over</h2>
              {winner && <div className="winner">🏆 Winner: {winner}</div>}
              {loser && <div className="loser">💀 Loser: {loser}</div>}
              <div className="game-over-actions">
                <button className="main-btn" onClick={startNewGame}>🆕 Start New Game</button>
                <button className="secondary-btn" onClick={() => setStep('menu')}>🏠 Back to Menu</button>
              </div>
            </div>
          ) : (
            <>
              <div className="hand-card">
                <h2>Your Hand ({hand.length} cards)</h2>
                <div className="cards pro-cards horizontal">
                  {hand.map((card, i) => (
                    <Card
                      key={i}
                      card={card}
                      faceDown={false}
                      draggable={true}
                      dragIndex={i}
                      onDragStart={onDragStart}
                      onDrop={onDrop}
                    />
                  ))}
                </div>
                <div className="arrange-tip">Drag and drop to arrange your cards</div>
                {playerId === players[currentTurn]?.id ? (
                  <div className="turn-message">🎯 Your turn! Pick a card from the next player in sequence.</div>
                ) : (
                  <div className="wait-message">⏳ Waiting for {players[currentTurn]?.name}'s turn...</div>
                )}
                <button className="secondary-btn" onClick={discardPairs}>Discard Pairs</button>
              </div>
              <div className="players-card">
                <h3>Other Players</h3>
                <div className="sequence-info">
                  <div className="sequence-label">🔄 Turn Order: Clockwise Sequential Picking</div>
                  {playerId === players[currentTurn]?.id && (
                    <div className="next-player-hint">
                      You can only pick from: {(() => {
                        const currentPlayerIndex = players.findIndex(player => player.id === playerId);
                        let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
                        while (players[nextPlayerIndex].finished && nextPlayerIndex !== currentPlayerIndex) {
                          nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
                        }
                        return players[nextPlayerIndex]?.name || 'No available player';
                      })()}
                    </div>
                  )}
                </div>
                <div className="all-players horizontal">
                  {players.map((p, idx) => {
                    if (p.id === playerId) return null; // Don't show current player here
                    return (
                      <div key={p.id} className={`player-section ${idx === currentTurn ? "current-turn-player" : ""}`}>
                        <div className="player-info">
                          <div className="player-position">{idx + 1}</div>
                          <Avatar name={p.name} />
                          <span className="player-name">
                            {p.name}
                            {idx === 0 && <span className="host-indicator"> (Host)</span>}
                          </span>
                          <span className="card-count">({p.handCount} cards)</span>
                          {idx === currentTurn && <span className="turn-indicator"> ⏳</span>}
                          {p.finished && <span className="finished"> (Finished)</span>}
                        </div>
                        
                        {!p.finished && p.hand && p.hand.length > 0 && (
                          <div className="opponent-cards horizontal">
                            {p.hand.map((card, cardIdx) => {
                              // Sequential picking: can only pick from the next active player in turn order
                              const currentPlayerIndex = players.findIndex(player => player.id === playerId);
                              
                              // Find next active (unfinished) player
                              let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
                              while (players[nextPlayerIndex].finished && nextPlayerIndex !== currentPlayerIndex) {
                                nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
                              }
                              
                              const canPickFromThisPlayer = playerId === players[currentTurn]?.id && idx === nextPlayerIndex;
                              
                              return (
                                <Card
                                  key={cardIdx}
                                  card={card}
                                  faceDown={true}
                                  onClick={canPickFromThisPlayer ? () => pickCard(p.id, cardIdx) : undefined}
                                  animate={animateIdx === cardIdx && p.id === players.find(pl => pl.hand && pl.hand.some((c, i) => i === cardIdx))?.id}
                                />
                              );
                            })}
                          </div>
                        )}
                        
                        {!p.finished && p.hand && p.hand.length > 0 && playerId === players[currentTurn]?.id && (
                          <div className="pick-instruction">
                            {(() => {
                              const currentPlayerIndex = players.findIndex(player => player.id === playerId);
                              
                              // Find next active (unfinished) player
                              let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
                              while (players[nextPlayerIndex].finished && nextPlayerIndex !== currentPlayerIndex) {
                                nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
                              }
                              
                              const isNextPlayer = idx === nextPlayerIndex;
                              
                              if (isNextPlayer) {
                                return <div className="can-pick">👆 Pick a card from {p.name}</div>;
                              } else {
                                return <div className="cannot-pick">⏳ Wait your turn</div>;
                              }
                            })()}
                          </div>
                        )}
                        
                        {p.finished && (
                          <div className="finished-message">Player finished!</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
