import { ChakraProvider } from '@chakra-ui/react'
import type { PropsWithChildren } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from 'services/i18n'
import { ColorModeProvider } from './color-mode'
import { system } from './theme'

export function UIProvider({ children }: PropsWithChildren) {
  return (
    <I18nextProvider i18n={i18n}>
      <ChakraProvider value={system}>
        <ColorModeProvider>{children}</ColorModeProvider>
      </ChakraProvider>
    </I18nextProvider>
  )
}
