import mermaid from 'mermaid'
import './mermaid.css'

mermaid.initialize({
  maxEdges: 1000,
  fontSize: 64,
  flowchart: {
    curve: 'basis',
    diagramPadding: 500,
    useMaxWidth: true,
  },
})
