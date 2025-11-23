import { Box, Skeleton } from '@chakra-ui/react'
import mermaid from 'mermaid'
import { useEffect, useId, useRef, useTransition } from 'react'
import mermaidFile from '../../../scripts/la-harpe-des-quatres-saisons.mermaid?raw'
import './mermaid.css'

mermaid.initialize({
  // startOnLoad: true,
  // logLevel: 'error',
  maxEdges: 1000,
  fontSize: 64,
  flowchart: {
    curve: 'basis',
  },
})

export function StoryDisplayer() {
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)
  // const id = useId()

  useEffect(() => {
    startTransition(async () => {
      const result = await mermaid.render(
        'id',
        mermaidFile,
        // ref.current ?? undefined,
      )
      if (!ref.current) {
        return
      }

      ref.current.innerHTML = result.svg
    })
  }, [])

  return (
    <Box display="grid" gridTemplateRows="1fr" placeItems="center">
      {isPending && <Skeleton flex="1" overflow="auto" padding="4" />}
      <div ref={ref}></div>
    </Box>
  )
}
