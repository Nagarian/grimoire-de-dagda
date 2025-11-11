import { ChakraProvider } from '@chakra-ui/react'
import type { PropsWithChildren } from 'react'
import theme from './theme'

export function UIProvider({ children }: PropsWithChildren) {
  return <ChakraProvider value={theme}>{children}</ChakraProvider>
}
