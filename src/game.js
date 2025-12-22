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
let isAnimating = false

// Tile tracking
let tileIdCounter = 0
let tiles = new Map() // id -> { element, row, col, value }

// DOM elements (initialized in init)
let tileContainer, scoreEl, bestEl, gameMessage, messageText
let newGameBtn, retryBtn, loginBtn, loginText

// Solid auth (loaded dynamically)
let solidAuth = null

// Tile size calculation
let tileSize = 0
const tileGap = 10
const ANIMATION_DURATION = 150 // ms

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

  window.addEventListener('resize', refreshAllTilePositions)

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

  // Start game after layout is complete
  bestEl.textContent = best
  requestAnimationFrame(() => {
    requestAnimationFrame(newGame)
  })
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
  // Clear existing tiles
  tiles.forEach(tile => tile.element.remove())
  tiles.clear()
  tileIdCounter = 0

  grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  score = 0
  gameOver = false
  won = false
  isAnimating = false

  scoreEl.textContent = score
  gameMessage.classList.remove('active')

  addRandomTile()
  addRandomTile()
}

function addRandomTile() {
  const empty = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) empty.push({ r, c })
    }
  }

  if (empty.length === 0) return false

  const { r, c } = empty[Math.floor(Math.random() * empty.length)]
  const value = Math.random() < 0.9 ? 2 : 4
  const id = ++tileIdCounter

  // Create tile object
  const tile = { id, value, row: r, col: c, element: null }
  grid[r][c] = tile
  tiles.set(id, tile)

  // Create DOM element
  createTileElement(tile, true)
  return true
}

function createTileElement(tile, isNew = false) {
  calculateTileSize()
  const el = document.createElement('div')
  el.className = `tile tile-${tile.value > 2048 ? 'super' : tile.value}`
  if (isNew) el.classList.add('tile-new')
  el.textContent = tile.value
  el.style.width = `${tileSize}px`
  el.style.height = `${tileSize}px`
  el.style.left = `${tile.col * (tileSize + tileGap)}px`
  el.style.top = `${tile.row * (tileSize + tileGap)}px`
  tileContainer.appendChild(el)
  tile.element = el
}

function updateTilePosition(tile) {
  calculateTileSize()
  tile.element.style.left = `${tile.col * (tileSize + tileGap)}px`
  tile.element.style.top = `${tile.row * (tileSize + tileGap)}px`
}

function updateTileValue(tile, newValue) {
  tile.value = newValue
  tile.element.textContent = newValue
  tile.element.className = `tile tile-${newValue > 2048 ? 'super' : newValue}`
  tile.element.classList.add('tile-merged')
  setTimeout(() => tile.element.classList.remove('tile-merged'), ANIMATION_DURATION)
}

function refreshAllTilePositions() {
  calculateTileSize()
  tiles.forEach(tile => {
    tile.element.style.width = `${tileSize}px`
    tile.element.style.height = `${tileSize}px`
    tile.element.style.left = `${tile.col * (tileSize + tileGap)}px`
    tile.element.style.top = `${tile.row * (tileSize + tileGap)}px`
  })
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
  if (gameOver || isAnimating) return

  let moved = false
  const merges = [] // { survivor, consumed, newValue }
  const tilesToRemove = []

  // Get traversal order based on direction
  const vectors = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 }
  }
  const { dr, dc } = vectors[direction]

  // Process tiles in correct order
  const rows = [...Array(GRID_SIZE).keys()]
  const cols = [...Array(GRID_SIZE).keys()]
  if (dr === 1) rows.reverse() // down: start from bottom
  if (dc === 1) cols.reverse() // right: start from right

  // Track which cells have already received a merge this move
  const mergedThisMove = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))

  for (const r of rows) {
    for (const c of cols) {
      const tile = grid[r][c]
      if (!tile) continue

      // Find farthest position
      let newR = r
      let newC = c

      while (true) {
        const nextR = newR + dr
        const nextC = newC + dc

        if (nextR < 0 || nextR >= GRID_SIZE || nextC < 0 || nextC >= GRID_SIZE) break

        const nextTile = grid[nextR][nextC]

        if (nextTile === null) {
          // Empty cell, can move there
          newR = nextR
          newC = nextC
        } else if (nextTile.value === tile.value && !mergedThisMove[nextR][nextC]) {
          // Can merge
          newR = nextR
          newC = nextC
          break
        } else {
          // Blocked by different tile or already merged
          break
        }
      }

      if (newR !== r || newC !== c) {
        moved = true
        const targetTile = grid[newR][newC]

        // Clear old position
        grid[r][c] = null

        if (targetTile) {
          // Merge
          const newValue = tile.value * 2
          merges.push({ survivor: targetTile, consumed: tile, newValue })
          mergedThisMove[newR][newC] = true
          score += newValue
          if (newValue === 2048 && !won) won = true
        } else {
          // Just move
          grid[newR][newC] = tile
          tile.row = newR
          tile.col = newC
          updateTilePosition(tile)
        }
      }
    }
  }

  // Process merges after all movements calculated
  for (const { survivor, consumed, newValue } of merges) {
    // Move consumed tile to merge position, then remove after animation
    consumed.row = survivor.row
    consumed.col = survivor.col
    updateTilePosition(consumed)
    tilesToRemove.push(consumed)

    // Update survivor after animation
    setTimeout(() => {
      updateTileValue(survivor, newValue)
    }, ANIMATION_DURATION)
  }

  // Remove consumed tiles after animation
  setTimeout(() => {
    for (const tile of tilesToRemove) {
      tile.element.remove()
      tiles.delete(tile.id)
    }
  }, ANIMATION_DURATION)

  if (moved) {
    isAnimating = true
    // Add new tile after animation completes
    setTimeout(() => {
      addRandomTile()
      updateScore()
      isAnimating = false
      if (!canMove()) {
        endGame()
      }
    }, ANIMATION_DURATION)
  }
}

function canMove() {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) return true
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = grid[r][c]
      if (!tile) continue
      const val = tile.value
      if (r < GRID_SIZE - 1 && grid[r + 1][c]?.value === val) return true
      if (c < GRID_SIZE - 1 && grid[r][c + 1]?.value === val) return true
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
