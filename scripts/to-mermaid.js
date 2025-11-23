import { readFile, writeFile } from 'node:fs/promises'

const files = ['./01-la-harpe-des-quatres-saisons.txt', './02-la-confrerie-de-nuada.txt']

function generateMermaidDiagram(data) {
  // Split lines and filter out empty ones
  const lines = data.split('\n').filter(line => line.trim() !== '')

  const config = `---
config:
  theme: base
  themeVariables:
    primaryColor: '#f9f'
  flowchart:
    curve: basis
---`
  // Create Mermaid diagram content
  let mermaidContent = `flowchart TD\n`

  // First pass: create all nodes
  const specialNodes = [
    {
      id: 'START',
      name: 'start',
      className: 'start-node',
      style: 'fill:#fff,stroke:#333,color:#000,stroke-width:5px',
      shape: 'circle',
    },
    {
      id: 'END',
      name: 'end',
      className: 'finish-node',
      style: 'fill:#fff,stroke:#333,color:#000,stroke-width:5px',
      shape: 'dbl-circ',
    },
    {
      id: 'QQ',
      name: 'enigme',
      className: 'question-node',
      style: 'fill:#00f,stroke:#333,color:#000,stroke-width:2px',
      shape: 'hex',
    },
    {
      id: 'QS',
      name: 'enigme solution',
      className: 'solution-node',
      style: 'fill:#0f0,stroke:#333,color:#000,stroke-width:2px',
      shape: 'diamond',
    },
    {
      id: 'F',
      name: 'fight',
      className: 'fight-node',
      style: 'fill:#f96,stroke:#333,stroke-width:2px',
      shape: 'bang',
    },
    {
      id: 'C',
      name: 'check',
      className: 'check-node',
      style: 'fill:#ff0,stroke:#333,color:#000,stroke-width:2px',
      shape: 'square',
    },
    {
      id: 'TC',
      name: 'to-check',
      className: 'to-check-node',
      style: 'fill:#ff0,stroke:#333,color:#000,stroke-width:2px,stroke-dasharray: 5 5',
      shape: 'square',
    },
  ]

  specialNodes.forEach(n => {
    mermaidContent += `    classDef ${n.className} ${n.style};\n`
  })

  const getLineSpecialNode = line =>
    specialNodes.find(n => line.startsWith(n.id))

  lines.forEach((line, index) => {
    const nodeId = `${index + 1}`
    const special = getLineSpecialNode(line)
    const shape = special?.shape ?? (line.includes(',') ? 'diamond' : 'circle')
    // const style = special
    //     ? `    style ${nodeId} ${special.style}\n`
    //     : ''
    mermaidContent += `    ${nodeId}${special ? `:::${special.className}` : ''}@{shape: ${shape}}\n`
  })

  // Second pass: create connections
  const excludedNodes = new Set(specialNodes.map(n => n.id))
  lines.forEach((line, index) => {
    const sourceId = `${index + 1}`
    const values = line
      .split(',')
      .map(v => v.trim())
      .filter(v => !excludedNodes.has(v))

    // if (values.length === 0) { return }
    // mermaidContent += `    ${sourceId} --> ${values.join(' & ')}\n`

    values.forEach((targetValue, i) => {
      if (targetValue === '1') {
        return
      }
      const link =
        getLineSpecialNode(line)?.id === 'F' && i === values.length - 1
          ? '-...->'
          : getLineSpecialNode(line)?.id === 'QQ' && i === values.length - 1
            ? '~~~'
            : '-->'
      mermaidContent += `    ${sourceId} ${link} ${targetValue}\n`
    })
  })

  return mermaidContent
}

for (const file of files) {
  const data = await readFile(new URL(file, import.meta.url), 'utf-8')
  const mermaidContent = generateMermaidDiagram(data)
  const outputFile = file.replace(/.txt$/, '.mermaid')
  await writeFile(outputFile, mermaidContent, 'utf-8')
  console.log(`Mermaid diagram has been generated in ${outputFile}`)
}
