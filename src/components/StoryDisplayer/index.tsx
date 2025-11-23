import { Box, Skeleton } from '@chakra-ui/react'
import mermaid from 'mermaid'
import { useEffect, useRef, useTransition } from 'react'
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

export type StoryDisplayerProps = {
  marmaidContent: string
}
export function StoryDisplayer({
  marmaidContent
}: StoryDisplayerProps) {
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)
  // const id = useId()

  useEffect(() => {
    startTransition(async () => {
      const result = await mermaid.render(
        'id',
        marmaidContent,
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
