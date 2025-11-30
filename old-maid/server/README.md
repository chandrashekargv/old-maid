# Old Maid Game - Backend

This is the WebSocket server for the Old Maid multiplayer card game.

## Environment Variables

Set these in your Railway dashboard:

- `PORT`: Automatically set by Railway
- `NODE_ENV`: Set to "production"

## Deployment

This server is configured to run on Railway with WebSocket support for real-time multiplayer gameplay.

The server handles:
- Game room creation and management
- Real-time card game logic
- Player synchronization
- Custom game ID validation
