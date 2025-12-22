/**
 * Modern 2048 Game - Works standalone, Solid integration optional
 */

// Game state
const GRID_SIZE = 4
let grid = []
let score = 0
let best = parseInt(localStorage.getItem('2048-best')) || 0
let gameOver = false
let won = false

// DOM elements (initialized in init)
let tileContainer, scoreEl, bestEl, gameMessage, messageText
let newGameBtn, retryBtn, loginBtn, loginText

// Solid auth (loaded dynamically)
let solidAuth = null

// Tile size calculation
let tileSize = 0
const tileGap = 10

function calculateTileSize() {
  if (!tileContainer) return
  const containerWidth = tileContainer.offsetWidth
  tileSize = (containerWidth - tileGap * 3) / 4
}

// Initialize game
function init() {
  // Get DOM elements
  tileContainer = document.getElementById('tile-container')
  scoreEl = document.getElementById('score')
  bestEl = document.getElementById('best')
  gameMessage = document.getElementById('game-message')
  messageText = gameMessage.querySelector('p')
  newGameBtn = document.getElementById('new-game')
  retryBtn = document.getElementById('retry-btn')
  loginBtn = document.getElementById('login-btn')
  loginText = document.getElementById('login-text')

  calculateTileSize()

  window.addEventListener('resize', () => {
    calculateTileSize()
    render()
  })

  // Event listeners
  newGameBtn.addEventListener('click', newGame)
  retryBtn.addEventListener('click', newGame)
  loginBtn.addEventListener('click', handleLogin)

  // Keyboard controls
  document.addEventListener('keydown', handleKeyDown)

  // Touch controls
  let touchStartX, touchStartY
  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
  }, { passive: true })

  document.addEventListener('touchend', e => {
    if (!touchStartX || !touchStartY) return

    const deltaX = e.changedTouches[0].clientX - touchStartX
    const deltaY = e.changedTouches[0].clientY - touchStartY
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (Math.max(absX, absY) < 30) return

    if (absX > absY) {
      move(deltaX > 0 ? 'right' : 'left')
    } else {
      move(deltaY > 0 ? 'down' : 'up')
    }

    touchStartX = null
    touchStartY = null
  }, { passive: true })

  // Load Solid auth dynamically (optional)
  loadSolidAuth()

  // Start game immediately
  bestEl.textContent = best
  newGame()
}

async function loadSolidAuth() {
  try {
    solidAuth = await import('./solid-auth.js')
    const { isLoggedIn } = await solidAuth.initSolidAuth()
    if (isLoggedIn) {
      loginText.textContent = 'Logged In ✓'
      loginBtn.classList.add('logged-in')
    }
  } catch (err) {
    console.log('Solid auth not available:', err.message)
    // Game works fine without Solid
  }
}

function newGame() {
  grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
  score = 0
  gameOver = false
  won = false

  scoreEl.textContent = score
  gameMessage.classList.remove('active')
  tileContainer.innerHTML = ''

  addRandomTile()
  addRandomTile()
  render()
}

function addRandomTile() {
  const empty = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) empty.push({ r, c })
    }
  }

  if (empty.length === 0) return false

  const { r, c } = empty[Math.floor(Math.random() * empty.length)]
  grid[r][c] = Math.random() < 0.9 ? 2 : 4
  return true
}

function render() {
  if (!tileContainer) return
  tileContainer.innerHTML = ''
  calculateTileSize()

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const value = grid[r][c]
      if (value === 0) continue

      const tile = document.createElement('div')
      tile.className = `tile tile-${value > 2048 ? 'super' : value}`
      tile.textContent = value
      tile.style.width = `${tileSize}px`
      tile.style.height = `${tileSize}px`
      tile.style.left = `${c * (tileSize + tileGap)}px`
      tile.style.top = `${r * (tileSize + tileGap)}px`

      tileContainer.appendChild(tile)
    }
  }
}

function handleKeyDown(e) {
  if (gameOver) return

  const keyMap = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up', W: 'up',
    s: 'down', S: 'down',
    a: 'left', A: 'left',
    d: 'right', D: 'right'
  }

  const direction = keyMap[e.key]
  if (direction) {
    e.preventDefault()
    move(direction)
  }
}

function move(direction) {
  if (gameOver) return

  const oldGrid = grid.map(row => [...row])
  let moved = false

  const rotations = { up: 3, right: 2, down: 1, left: 0 }
  const times = rotations[direction]

  for (let i = 0; i < times; i++) rotateGrid()

  for (let r = 0; r < GRID_SIZE; r++) {
    const row = grid[r].filter(v => v !== 0)
    const newRow = []

    for (let i = 0; i < row.length; i++) {
      if (i < row.length - 1 && row[i] === row[i + 1]) {
        const merged = row[i] * 2
        newRow.push(merged)
        score += merged
        if (merged === 2048 && !won) {
          won = true
        }
        i++
      } else {
        newRow.push(row[i])
      }
    }

    while (newRow.length < GRID_SIZE) newRow.push(0)
    grid[r] = newRow
  }

  for (let i = 0; i < (4 - times) % 4; i++) rotateGrid()

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== oldGrid[r][c]) moved = true
    }
  }

  if (moved) {
    addRandomTile()
    render()
    updateScore()

    if (!canMove()) {
      endGame()
    }
  }
}

function rotateGrid() {
  const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      newGrid[c][GRID_SIZE - 1 - r] = grid[r][c]
    }
  }
  grid = newGrid
}

function canMove() {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return true
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const val = grid[r][c]
      if (r < GRID_SIZE - 1 && grid[r + 1][c] === val) return true
      if (c < GRID_SIZE - 1 && grid[r][c + 1] === val) return true
    }
  }

  return false
}

function updateScore() {
  scoreEl.textContent = score

  if (score > best) {
    best = score
    bestEl.textContent = best
    localStorage.setItem('2048-best', best)
  }
}

function endGame() {
  gameOver = true
  messageText.textContent = won ? 'You Win!' : 'Game Over!'
  gameMessage.classList.add('active')

  // Save to Solid if available
  if (solidAuth) {
    const { isLoggedIn } = solidAuth.getLoginState()
    if (isLoggedIn) {
      solidAuth.saveHighScore(score).then(saved => {
        if (saved) console.log('Score saved to Solid Pod!')
      })
    }
  }
}

async function handleLogin() {
  if (!solidAuth) {
    alert('Solid authentication is not available. You can still play the game!')
    return
  }

  const { isLoggedIn } = solidAuth.getLoginState()

  if (isLoggedIn) {
    await solidAuth.solidLogout()
    loginText.textContent = 'Login with Solid'
    loginBtn.classList.remove('logged-in')
    window.location.reload()
  } else {
    const idp = prompt('Enter your Solid Identity Provider:', 'https://login.inrupt.com')
    if (idp) {
      await solidAuth.solidLogin(idp)
    }
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
