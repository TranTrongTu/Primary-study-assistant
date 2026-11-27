import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerUser } from '../api/authApi'
import { MIN_PASSWORD_LENGTH, useRegister } from './useRegister'

vi.mock('../api/authApi', () => ({ registerUser: vi.fn() }))
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))

const submitEvent = { preventDefault: () => {} }

describe('useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refuses a short password before calling the API', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useRegister())
    act(() => {
      result.current.setPassword('x'.repeat(MIN_PASSWORD_LENGTH - 1))
    })

    await act(async () => {
      await result.current.handleSubmit(submitEvent, { onError })
    })

    expect(registerUser).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Mật khẩu cần ít nhất 8 ký tự.')
    expect(onError).toHaveBeenCalledWith('Mật khẩu cần ít nhất 8 ký tự.')
  })

  it('uses the same minimum as the backend', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8)
  })
})
