import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axiosClient from './axiosClient'

// The adapter is the last step of an axios request: replacing it lets the real
// interceptors run without any network.
const respondWith = (status, data = {}) => {
  const adapter = vi.fn(async (config) => {
    const response = { status, data, config, headers: {}, statusText: '' }
    if (status >= 400) {
      const error = new Error(`Request failed with status code ${status}`)
      error.response = response
      error.config = config
      throw error
    }
    return response
  })
  axiosClient.defaults.adapter = adapter
  return adapter
}

const settlesWithin = (promise, ms) =>
  Promise.race([
    promise.then(
      () => 'resolved',
      () => 'rejected',
    ),
    new Promise((resolve) => setTimeout(() => resolve('pending'), ms)),
  ])

describe('axiosClient', () => {
  beforeEach(() => {
    window.location.hash = '#/dashboard'
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends the stored token as a Bearer header', async () => {
    localStorage.setItem('token', 'abc123')
    const adapter = respondWith(200)

    await axiosClient.get('/user/me')

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer abc123')
  })

  it('sends no Authorization header when there is no token', async () => {
    const adapter = respondWith(200)

    await axiosClient.get('/health')

    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined()
  })

  it('on 401 removes the token and goes to the login page', async () => {
    localStorage.setItem('token', 'expired')
    respondWith(401)

    const request = axiosClient.get('/user/me')

    // The promise is left pending on purpose so callers do not also show an error
    expect(await settlesWithin(request, 50)).toBe('pending')
    expect(localStorage.getItem('token')).toBeNull()
    expect(window.location.hash).toBe('#/login')
  })

  it('passes other errors on to the caller and keeps the token', async () => {
    localStorage.setItem('token', 'abc123')
    respondWith(500)

    await expect(axiosClient.get('/user/me')).rejects.toMatchObject({
      response: { status: 500 },
    })
    expect(localStorage.getItem('token')).toBe('abc123')
    expect(window.location.hash).toBe('#/dashboard')
  })
})
