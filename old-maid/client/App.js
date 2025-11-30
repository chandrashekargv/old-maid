import React, { useState, useEffect } from "react";
import './index.css';

function App() {
  const [step, setStep] = useState('menu');
  const [ws, setWs] = useState(null);
  const [gameId, setGameId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [name, setName] = useState('');
  const [hand, setHand] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [winner, setWinner] = useState(null);
  const [loser, setLoser] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ws) return;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'game_created') {
        setGameId(data.gameId);
        setStep('join');
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
      } else if (data.type === 'hand') {
        setHand(data.hand);
      }
    };
  }, [ws]);

  function connect() {
    setWs(new window.WebSocket('ws://localhost:4000'));
  }

  function createGame() {
    ws.send(JSON.stringify({ type: 'create_game', reverse }));
  }

  function joinGame() {
    ws.send(JSON.stringify({ type: 'join_game', gameId, name }));
  }

  function startGame() {
    ws.send(JSON.stringify({ type: 'start_game', gameId }));
  }

  function discardPairs() {
    ws.send(JSON.stringify({ type: 'discard_pairs', gameId, playerId }));
  }

  function pickCard(targetId, cardIndex) {
    ws.send(JSON.stringify({ type: 'pick_card', gameId, playerId, targetId, cardIndex }));
  }

  // UI rendering logic
  if (!ws) {
    return (
      <div>
        <h1>Old Maid Online</h1>
        <button onClick={connect}>Connect</button>
      </div>
    );
  }
  if (step === 'menu') {
    return (
      <div>
        <h1>Old Maid Online</h1>
        <button onClick={createGame}>Create Game</button>
        <label>
          <input type="checkbox" checked={reverse} onChange={e => setReverse(e.target.checked)} /> Reverse Mode (Joker wins)
        </label>
        <br />
        <input placeholder="Game ID to join" value={gameId} onChange={e => setGameId(e.target.value)} />
        <input placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={joinGame}>Join Game</button>
      </div>
    );
  }
  if (step === 'join' || step === 'lobby') {
    return (
      <div>
        <h2>Lobby</h2>
        <div>Game ID: {gameId}</div>
        <div>Players: {players.map(p => p.name).join(', ')}</div>
        <button onClick={startGame} disabled={started}>Start Game</button>
      </div>
    );
  }
  if (started) {
    if (winner || loser) {
      return (
        <div>
          <h2>Game Over</h2>
          {winner && <div>Winner: {winner}</div>}
          {loser && <div>Loser: {loser}</div>}
        </div>
      );
    }
    return (
      <div>
        <h2>Your Hand</h2>
        <div>{hand.map((card, i) => <span key={i}>{card.suit} {card.rank} | </span>)}</div>
        <button onClick={discardPairs}>Discard Pairs</button>
        <h3>Players</h3>
        <ul>
          {players.map((p, idx) => (
            <li key={p.id}>
              {p.name} {idx === currentTurn ? '(Current Turn)' : ''} {p.finished ? '(Finished)' : ''}
              {p.id !== playerId && !p.finished && idx === currentTurn && (
                <button onClick={() => pickCard(p.id, 0)}>Pick Card (Random)</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return <div>Loading...</div>;
}

export default App;
