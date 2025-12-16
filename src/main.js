/**
 * Main entry point - bridges modern Solid modules with the game
 */

import {
  initSolidAuth,
  solidLogin,
  solidLogout,
  getLoginState,
  saveHighScore,
  loadHighScores
} from './solid-auth.js'

// Default high score storage URL (can be customized)
const HIGH_SCORE_URL = 'https://melvincarvalho.solidcommunity.net/public/games/2048-scores.ttl'

// Expose Solid functions globally for the game to use
window.SolidAuth = {
  login: async function(idpUrl) {
    const url = idpUrl || document.getElementById('solid-idp')?.value || 'https://login.inrupt.com'
    try {
      await solidLogin(url)
    } catch (error) {
      alert('Login failed: ' + error.message)
    }
  },

  logout: async function() {
    await solidLogout()
    alert('Logged out successfully')
    window.location.reload()
  },

  getState: getLoginState,

  saveScore: async function(score) {
    const saved = await saveHighScore(HIGH_SCORE_URL, score)
    if (saved) {
      console.log('Score saved to Solid Pod!')
    }
    return saved
  },

  loadScores: async function() {
    return await loadHighScores(HIGH_SCORE_URL)
  },

  isLoggedIn: function() {
    return getLoginState().isLoggedIn
  },

  getWebId: function() {
    return getLoginState().webId || localStorage.getItem('user')
  }
}

// Initialize auth when the module loads
initSolidAuth().then(({ isLoggedIn, webId }) => {
  if (isLoggedIn) {
    console.log('Logged in as:', webId)
    // Update UI if login button exists
    const loginText = document.getElementById('login-text')
    if (loginText) {
      loginText.textContent = '✓'
    }
  }
}).catch(error => {
  console.error('Auth initialization failed:', error)
})
