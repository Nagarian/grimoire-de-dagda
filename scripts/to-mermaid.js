import { readFile, writeFile } from 'node:fs/promises'

const files = [
  './T01-la-harpe-des-quatres-saisons.txt',
  './T02-la-confrerie-de-nuada.txt',
  './T03-les-entrailles-du-temps.txt',
  './E01-le-royaume-des-ombres.txt',
]

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
    linkStyle: '~~~',
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
    // linkStyle: '-...->',
  },
  {
    id: 'S',
    name: 'savepoint',
    className: 'savepoint-node',
    style: 'fill:#fff,stroke:#333,color:#000,stroke-width:2px,stroke-dasharray: 5 5',
    shape: 'cylinder',
    extractLink: (sourceId, ids) => [], // No links from savepoints
    specification: `
      Only one value, it's the checkpoint chapter to use when we restore from it
    `
  },
  {
    id: 'C',
    name: 'check',
    className: 'check-node',
    style: 'fill:#ff0,stroke:#333,color:#000,stroke-width:2px',
    shape: 'rect',
    specification: `
     No values, indicate the chapter contains a checkbox
    `
  },
  {
    id: 'TC',
    name: 'to-check',
    className: 'to-check-node',
    style: 'fill:#ff0,stroke:#333,color:#000,stroke-width:2px,stroke-dasharray: 5 5',
    shape: 'rect',
    specification: `
      As many values as needed, each indicating a chapter that we need to tick the checkbox
    `
  },
  {
    id: /T\d{2}/,
    name: 'tome',
    className: 'tome-node',
    style: 'fill:#ccc,stroke:#333,color:#000,stroke-width:2px',
    shape: 'card',
    // linkStyle: '===>',
    extractLink: (sourceId, ids) => [], // The link is oriented to another book, so no link from here
    specification: `
      Only one value, it's the chapter of the 2nd book that is specified
    `
  },
  {
    id: 'RO',
    name: 'royaume-des-ombres',
    className: 'royaume-des-ombres-node',
    style: 'fill:#666,stroke:#333,color:#000,stroke-width:2px',
    shape: 'card',
    extractLink: (sourceId, ids) => [`${sourceId} --> ${ids[2]}`], // return back after going to the extension
    specification: `
      Three values are expected, separated by a dot:
      - TOME: the first one is the origin book number (2 or 3)
      - CHAPITRE: the second one is the origin initial chapter of the current adventure
      - RESURRECTION: the third one is the return chapter when we leave RO
    `
  },
  {
    id: 'ROS',
    name: 'royaume-des-ombres-secret',
    className: 'royaume-des-ombres-secret-node',
    style: 'fill:#666,stroke:#333,color:#000,stroke-width:2px',
    shape: 'card',
    extractLink: (sourceId, ids) => [], // The link is oriented to the RO secret chapter, so no link from here
    specification: `
      Only one value, it's the chapter of RO that is specified, it's coupled with TXX of RO book
    `
  },
  {
    id: 'RRO',
    name: 'required-royaume-des-ombres',
    className: 'required-royaume-des-ombres-node',
    style: 'fill:#666,stroke:#333,color:#000,stroke-width:2px,stroke-dasharray: 5 5',
    shape: 'card',
    specification: `
      Only one value, you need the RO book to access the specified chapter
    `
  },
  {
    id: 'ROLOC',
    name: 'royaume-des-ombres-localisation',
    className: 'royaume-des-ombres-localisation-node',
    style: 'fill:#fff,stroke:#333,color:#000,stroke-width:5px',
    shape: 'dbl-circ',
    extractLink: (sourceId, ids) => [`${sourceId} --> ${ids[0]}`], // return next time we enter RO
    specification: `
      Only one value, it's the value to put in the localisation box for the next time we enter RO
    `
  },
  {
    id: 'GT',
    name: 'goutte-du-temps',
    className: 'goutte-du-temps-node',
    style: 'fill:#0ff,stroke:#333,color:#000,stroke-width:2px',
    shape: 'card',
    specification: `
      No value, indicates that we should get back to the chapter indicated by the time drop
    `
  },
]

function findSpecialNodeById(id) {
  return specialNodes.find(n => (typeof n.id === 'string' && n.id === id) || (n.id instanceof RegExp && n.id.test(id)))
}

function convertToObject(data) {
  // Convert specific format to object representation
  return data
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
    .map(line => line
      .split(',')
      .map(link => link.trim())
      .filter(link => link !== '')
      .map(link => link.includes('-')
        ? ({
          type: findSpecialNodeById(link.split('-')[0]),
          ids: link.split('-')[1].split('.'),
          linkRaw: link,
        })
        : findSpecialNodeById(link)
          ? ({ type: findSpecialNodeById(link), ids: [] })
          : ({ id: link })
      )
    )
}

function generateMermaidDiagram(lines) {
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

  // First pass: define styles
  specialNodes.forEach(n => {
    mermaidContent += `    classDef ${n.className} ${n.style};\n`
  })

  // Second pass: create all nodes

  lines.forEach((nodes, index) => {
    const nodeId = `${index + 1}`
    const specials = nodes.filter(link => link.type).map(link => link.type)
    const shape = specials.find(s => s.shape)?.shape ?? (nodes.length > 1 ? 'diamond' : 'circle')
    const classNames = specials
      .filter(s => s.className)
      .map(s => s.className)
      .join(',')

    // console.log('Processing node:', nodeId, nodes, '-> shape:', shape, 'classNames:', classNames)
    mermaidContent += `    ${nodeId}${classNames ? `:::${classNames}` : ''}@{shape: ${shape}}\n`
  })

  const filterDeadState = (targetId) => targetId !== '1'

  // Third pass: create connections
  lines.forEach((nodes, index) => {
    const sourceId = `${index + 1}`

    // console.log('Processing node:', sourceId, nodes)

    nodes.filter(link => filterDeadState(link.id)).forEach(link => {
      if (link.id && !link.type) {
        mermaidContent += `    ${sourceId} --> ${link.id}\n`
      } else if (link.type.linkStyle) {
        link.ids.filter(filterDeadState).forEach(targetId => {
          mermaidContent += `    ${sourceId} ${link.type.linkStyle} ${targetId}\n`
        })
      } else if (link.type.extractLink) {
        const extractedLinks = link.type.extractLink(sourceId, link.ids.filter(filterDeadState))
        extractedLinks.forEach(extractedLink => {
          mermaidContent += `    ${extractedLink}\n`
        })
      } else {
        link.ids.filter(filterDeadState).forEach(targetId => {
          mermaidContent += `    ${sourceId} --> ${targetId}\n`
        })
      }
    })
  })

  return mermaidContent
}

for (const file of files) {
  const data = await readFile(new URL(file, import.meta.url), 'utf-8')
  const lines = convertToObject(data)
  const mermaidContent = generateMermaidDiagram(lines)
  const outputFile = file.replace(/.txt$/, '.mermaid')
  await writeFile(outputFile, mermaidContent, 'utf-8')
  console.log(`Mermaid diagram has been generated in ${outputFile}`)
}
