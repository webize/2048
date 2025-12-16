/**
 * Modern Solid authentication and data access module
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
  setThing,
  createThing,
  getInteger,
  setInteger
} from '@inrupt/solid-client'

// High score storage URL
const HIGH_SCORE_URL = 'https://melvincarvalho.solidcommunity.net/public/games/2048-scores.ttl'
const SCORE_PREDICATE = 'urn:solid:game#score'

let isLoggedIn = false
let webId = null

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

export async function solidLogout() {
  await logout()
  isLoggedIn = false
  webId = null
  localStorage.removeItem('user')
}

export function getLoginState() {
  return { isLoggedIn, webId }
}

export async function saveHighScore(score) {
  const currentUser = localStorage.getItem('user')
  if (!currentUser) {
    console.log('Not logged in, cannot save score')
    return false
  }

  try {
    let dataset
    try {
      dataset = await getSolidDataset(HIGH_SCORE_URL, { fetch })
    } catch (error) {
      if (error.response?.status === 404) {
        dataset = createSolidDataset()
      } else {
        throw error
      }
    }

    const scoreThingUrl = `${HIGH_SCORE_URL}#${encodeURIComponent(currentUser)}`
    let scoreThing = getThing(dataset, scoreThingUrl) || createThing({ url: scoreThingUrl })

    const existingScore = getInteger(scoreThing, SCORE_PREDICATE) || 0

    if (score > existingScore) {
      scoreThing = setInteger(scoreThing, SCORE_PREDICATE, score)
      dataset = setThing(dataset, scoreThing)
      await saveSolidDatasetAt(HIGH_SCORE_URL, dataset, { fetch })
      console.log('High score saved:', score)
      return true
    }

    return false
  } catch (error) {
    console.error('Error saving high score:', error)
    return false
  }
}
