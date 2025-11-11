import { Box } from '@chakra-ui/react'
import { StoryDisplayer } from 'components/StoryDisplayer'
import { UIProvider } from 'components/ui/UIProvider'

export function App() {
  return (
    <UIProvider>
      <Box
        display="grid"
        gridTemplateRows="1fr"
        height="100vh"
        minWidth="320px"
      >
        <StoryDisplayer />
      </Box>
    </UIProvider>
  )
}
