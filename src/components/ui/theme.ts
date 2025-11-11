import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  strictTokens: true,
})

export default createSystem(defaultConfig, config)
