import { describe, expect, it } from 'vitest'
import { parseBackendError } from './backendError'

const httpError = (status, data = {}) => ({ response: { status, data } })

describe('parseBackendError', () => {
  it('treats a request with no response as a connection problem', () => {
    const parsed = parseBackendError(new Error('Network Error'))

    expect(parsed.status).toBeUndefined()
    expect(parsed.type).toBe('error')
    expect(parsed.message).toMatch(/Không kết nối được máy chủ/)
  })

  it('marks mistakes the user can fix as warnings', () => {
    expect(parseBackendError(httpError(400)).type).toBe('warning')
    expect(parseBackendError(httpError(404)).type).toBe('warning')
  })

  it('distinguishes the two kinds of 409 by exception type', () => {
    const submitted = parseBackendError(httpError(409, { exception_type: 'SUBMITTED_EXERCISE' }))
    const taken = parseBackendError(httpError(409, { exception_type: 'TAKEN_INFO' }))

    expect(submitted.message).toMatch(/đã được nộp/)
    expect(taken.message).toMatch(/đã tồn tại/)
  })

  it('never shows the raw backend text for a 500', () => {
    const parsed = parseBackendError(
      httpError(500, { message: 'IntegrityError: duplicate key value violates unique constraint' }),
    )

    expect(parsed.message).not.toMatch(/IntegrityError/)
    expect(parsed.type).toBe('error')
  })

  it('uses the backend message for a status it has no wording for', () => {
    expect(parseBackendError(httpError(418, { message: 'Trà đang pha' })).message).toBe('Trà đang pha')
  })

  it('keeps the original error for logging', () => {
    const error = httpError(503)

    expect(parseBackendError(error).rawError).toBe(error)
  })
})
