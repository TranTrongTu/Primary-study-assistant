import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithTheme } from '../test/renderWithTheme'
import { ConfirmModal } from './ConfirmModal'
import ErrorBanner from './ErrorBanner'

describe('ErrorBanner', () => {
  it('renders nothing when there is no error', () => {
    const { container } = renderWithTheme(<ErrorBanner error={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('accepts a plain string as well as an error object', () => {
    renderWithTheme(<ErrorBanner error="Mất kết nối" />)

    expect(screen.getByText('Mất kết nối')).toBeInTheDocument()
  })

  it('shows a dismiss button only when a handler is given, and calls it', async () => {
    const onDismiss = vi.fn()
    const { rerender } = renderWithTheme(
      <ErrorBanner error={{ message: 'Tệp quá lớn', type: 'warning' }} />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(<ErrorBanner error={{ message: 'Tệp quá lớn', type: 'warning' }} onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Đã hiểu' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('falls back to the error style for an unknown type', () => {
    renderWithTheme(<ErrorBanner error={{ message: 'Lạ', type: 'something-new' }} />)

    expect(screen.getByText('Lạ').parentElement).toHaveClass('text-red-700')
  })
})

describe('ConfirmModal', () => {
  const setup = (props = {}) => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    renderWithTheme(
      <ConfirmModal isOpen onClose={onClose} onConfirm={onConfirm} title="Xóa sổ tay?" {...props} />,
    )
    return { onClose, onConfirm }
  }

  it('renders nothing while closed', () => {
    const { container } = renderWithTheme(
      <ConfirmModal isOpen={false} onClose={() => {}} onConfirm={() => {}} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('calls the matching handler for each button', async () => {
    const { onClose, onConfirm } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    await userEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    expect(screen.getByText('Xóa sổ tay?')).toBeInTheDocument()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('disables both buttons while the action is running, so it cannot be sent twice', async () => {
    const { onConfirm } = setup({ isLoading: true })
    const confirm = screen.getByRole('button', { name: 'Đang xử lý...' })

    await userEvent.click(confirm)

    expect(confirm).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
