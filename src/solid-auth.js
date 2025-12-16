/**
 * Modern Solid authentication and data access module
 * Uses @inrupt/solid-client-authn-browser and @inrupt/solid-client
 */

import {
  login,
  logout,
  handleIncomingRedirect,
  getDefaultSession,
  fetch
} from '@inrupt/solid-client-authn-browser'

import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  getThing,
  getThingAll,
  setThing,
  createThing,
  getInteger,
  setInteger,
  getUrl
} from '@inrupt/solid-client'

// Predicate for storing scores
const SCORE_PREDICATE = 'urn:solid:game#score'

// Solid auth state
let isLoggedIn = false
let webId = null

/**
 * Initialize Solid auth - handle redirects from login
 */
export async function initSolidAuth() {
  await handleIncomingRedirect({ restorePreviousSession: true })

  const session = getDefaultSession()
  isLoggedIn = session.info.isLoggedIn
  webId = session.info.webId

  if (isLoggedIn) {
    localStorage.setItem('user', webId)
  }

  return { isLoggedIn, webId }
}

/**
 * Login to Solid Identity Provider
 */
export async function solidLogin(idpUrl = 'https://login.inrupt.com') {
  try {
    await login({
      oidcIssuer: idpUrl,
      redirectUrl: window.location.href,
      clientName: 'Solid 2048 Game'
    })
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}

/**
 * Logout from Solid
 */
export async function solidLogout() {
  await logout()
  isLoggedIn = false
  webId = null
  localStorage.removeItem('user')
}

/**
 * Get current login state
 */
export function getLoginState() {
  return { isLoggedIn, webId }
}

/**
 * Save high score to a Solid Pod
 * @param {string} scoreUrl - URL where scores are stored
 * @param {number} score - The score to save
 */
export async function saveHighScore(scoreUrl, score) {
  const currentUser = localStorage.getItem('user')
  if (!currentUser) {
    console.log('Not logged in, cannot save score')
    return false
  }

  try {
    // Try to get existing dataset or create new one
    let dataset
    try {
      dataset = await getSolidDataset(scoreUrl, { fetch })
    } catch (error) {
      if (error.response?.status === 404) {
        dataset = createSolidDataset()
      } else {
        throw error
      }
    }

    // Create or update the user's score entry
    const scoreThingUrl = `${scoreUrl}#${encodeURIComponent(currentUser)}`
    let scoreThing = getThing(dataset, scoreThingUrl) || createThing({ url: scoreThingUrl })

    // Get existing score to compare
    const existingScore = getInteger(scoreThing, SCORE_PREDICATE) || 0

    // Only update if new score is higher
    if (score > existingScore) {
      scoreThing = setInteger(scoreThing, SCORE_PREDICATE, score)
      dataset = setThing(dataset, scoreThing)
      await saveSolidDatasetAt(scoreUrl, dataset, { fetch })
      console.log('High score saved:', score)
      return true
    } else {
      console.log('Score not saved - existing score is higher:', existingScore)
      return false
    }
  } catch (error) {
    console.error('Error saving high score:', error)
    return false
  }
}

/**
 * Load high scores from a Solid Pod
 * @param {string} scoreUrl - URL where scores are stored
 * @returns {Array} Array of {webId, score} objects
 */
export async function loadHighScores(scoreUrl) {
  try {
    const dataset = await getSolidDataset(scoreUrl, { fetch })
    const things = getThingAll(dataset)

    const scores = things
      .map(thing => {
        const score = getInteger(thing, SCORE_PREDICATE)
        if (score !== null) {
          // Extract webId from thing URL
          const thingUrl = thing.url
          const hashIndex = thingUrl.lastIndexOf('#')
          const encodedWebId = hashIndex >= 0 ? thingUrl.slice(hashIndex + 1) : null
          const webId = encodedWebId ? decodeURIComponent(encodedWebId) : null
          return { webId, score }
        }
        return null
      })
      .filter(entry => entry !== null)
      .sort((a, b) => b.score - a.score)

    return scores
  } catch (error) {
    console.error('Error loading high scores:', error)
    return []
  }
}

// Export fetch for authenticated requests
export { fetch as solidFetch }
