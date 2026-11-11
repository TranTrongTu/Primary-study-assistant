import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loginUser } from '../api/authApi'
import { useLogin } from './useLogin'

const navigate = vi.fn()
const invalidateQueries = vi.fn()

vi.mock('../api/authApi', () => ({ loginUser: vi.fn() }))
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }))
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries }),
}))

const submitEvent = { preventDefault: () => {} }

// The hook waits two seconds before calling the API (the mascot animation)
const submit = async (result, callbacks) => {
  await act(async () => {
    const pending = result.current.handleSubmit(submitEvent, callbacks)
    await vi.advanceTimersByTimeAsync(2000)
    await pending
  })
}

describe('useLogin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores the token, refreshes the current user and goes to the dashboard', async () => {
    loginUser.mockResolvedValue({ access_token: 'token-123' })
    const { result } = renderHook(() => useLogin())
    act(() => {
      result.current.setEmail('be@example.com')
      result.current.setPassword('mat-khau')
    })

    await submit(result)

    expect(loginUser).toHaveBeenCalledWith('be@example.com', 'mat-khau')
    expect(localStorage.getItem('token')).toBe('token-123')
    expect(invalidateQueries).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('/dashboard')
    expect(result.current.isLoading).toBe(false)
  })

  it('lets the caller handle navigation when onSuccess is given', async () => {
    loginUser.mockResolvedValue({ access_token: 'token-123' })
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useLogin())

    await submit(result, { onSuccess })

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('shows a friendly message for wrong credentials and stores no token', async () => {
    loginUser.mockRejectedValue({ response: { status: 401 } })
    const onError = vi.fn()
    const { result } = renderHook(() => useLogin())

    await submit(result, { onError })

    expect(result.current.error).toMatch(/chưa đúng/)
    expect(onError).toHaveBeenCalledWith(result.current.error)
    expect(localStorage.getItem('token')).toBeNull()
    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it('reports a connection problem when the server cannot be reached', async () => {
    loginUser.mockRejectedValue(new Error('Network Error'))
    const { result } = renderHook(() => useLogin())

    await submit(result)

    expect(result.current.error).toMatch(/Lỗi kết nối/)
  })
})
