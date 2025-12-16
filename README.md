# 2048 - Solid Edition

The classic 2048 tile puzzle game with [Solid](https://solidproject.org/) integration for decentralized high score storage.

[Play Now](https://webize.github.io/2048/)

## Features

- Classic 2048 gameplay with smooth animations
- Login with any Solid Identity Provider (OIDC)
- High scores saved to your personal Solid Pod
- Works on desktop and mobile (touch/swipe support)
- Keyboard controls (arrow keys)

## Tech Stack

- [Hilo](https://github.com/nicholaszhang24/Hilo) - 2D game engine
- [@inrupt/solid-client-authn-browser](https://www.npmjs.com/package/@inrupt/solid-client-authn-browser) - Authentication
- [@inrupt/solid-client](https://www.npmjs.com/package/@inrupt/solid-client) - Data access
- [Vite](https://vitejs.dev/) - Build tool

## Getting Started

### Prerequisites

- Node.js 18+
- A Solid Pod ([get one here](https://solidproject.org/users/get-a-pod))

### Install

```bash
git clone https://github.com/webize/2048
cd 2048
npm install
```

### Development

```bash
npm run dev
```

Opens at http://localhost:3000

### Build

```bash
npm run build
```

Output is in `dist/` folder.

## How to Play

1. Use **arrow keys** or **swipe** to move tiles
2. When two tiles with the same number touch, they merge into one
3. Create a tile with the number **2048** to win
4. Click **Login** to save your high score to your Solid Pod

## Solid Integration

When logged in, your high score is automatically saved to your Solid Pod when the game ends. Scores are stored as RDF data, enabling decentralized leaderboards.

## License

MIT

## Credits

- Original 2048 game concept by Gabriele Cirulli
- Hilo game engine by Alibaba
- Solid integration for decentralized web
