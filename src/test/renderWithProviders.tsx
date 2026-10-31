import { UIProvider } from 'components/ui/UIProvider'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

export function renderWithProviders(element: ReactElement) {
  return render(<UIProvider>{element}</UIProvider>)
}
