import mermaid from 'mermaid'
import { useEffect } from 'react'
import mermaidFile from '../../../scripts/la-harpe-des-quatres-saisons.mermaid?raw'
import './mermaid.css'

export function StoryDisplayer() {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      //   logLevel: 'debug',
      maxEdges: 1000,
      fontSize: 64,
      darkMode: true,
      flowchart: {
        curve: 'basis',
      },
    })
    // mermaid.contentLoaded()
  }, [])

  return <pre className="mermaid">{mermaidFile}</pre>
}
