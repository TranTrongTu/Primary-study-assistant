import { render } from '@testing-library/react'
import { ThemeContext } from '../components/theme/ThemeWrapper'

// Shared components read the day/night theme from context. Passing the provider as
// `wrapper` keeps it in place when a test calls rerender().
export const renderWithTheme = (ui, { isNight = false } = {}) =>
  render(ui, {
    wrapper: ({ children }) => (
      <ThemeContext.Provider value={{ isNight }}>{children}</ThemeContext.Provider>
    ),
  })
