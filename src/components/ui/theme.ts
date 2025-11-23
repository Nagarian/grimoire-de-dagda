import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

export const config = defineConfig({
  strictTokens: true,
})

export const system = createSystem(defaultConfig, config)

export default system
