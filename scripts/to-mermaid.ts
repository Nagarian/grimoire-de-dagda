import { readFile, writeFile } from 'node:fs/promises'

type FileType = {
  fileName: string
  id: string
  name: string
  chapterToSkip: string[]
}

const files: FileType[] = [
  {
    fileName: './T01-la-harpe-des-quatres-saisons.txt',
    id: 'T01',
    name: '1 - La Harpe des Quatre Saisons',
    chapterToSkip: ['1'],
  },
  {
    fileName: './T02-la-confrerie-de-nuada.txt',
    id: 'T02',
    name: '2 - La Confrérie de Nuada',
    chapterToSkip: ['42'],
  },
  {
    fileName: './T03-les-entrailles-du-temps.txt',
    id: 'T03',
    name: '3 - Les Entrailles du Temps',
    chapterToSkip: ['42'],
  },
  {
    fileName: './E01-le-royaume-des-ombres.txt',
    id: 'E01',
    name: 'Extension - Le Royaume des Ombres',
    chapterToSkip: ['1'],
  },
]

type SpecialNode = {
  /**
   * Unique identifier that will be used into the file declaration
   * If it's a RegExp check the specification for more detail
   */
  id: string | RegExp
  /**
   * Label to display the kind of node we are
   */
  name: string
  /**
   * classname that will be used onto each node
   */
  className?: string
  /**
   * the style associated to the className
   */
  style?: string
  /**
   * The shape of the node defined by mermaid
   */
  shape?: string
  // to remove
  linkStyle?: string
  /**
   * Method to do the extraction of the different relevant chapters link
   * @param sourceId the chapter where we are
   * @param ids all the ids extracted from the current chapter
   * @returns all the relevant links from the current chapter
   */
  extractLink?: (sourceId: string, ids: string[]) => string[]
  /**
   * Explanation of the construction of this node
   */
  specification?: string
}

const specialNodes: SpecialNode[] = [
  {
    id: 'START',
    name: 'Start',
    className: 'start-node',
    style: 'fill:#fff,stroke:#333,color:#000,stroke-width:5px',
    shape: 'circle',
  },
  {
    id: 'END',
    name: 'End',
    className: 'finish-node',
    style: 'fill:#fff,stroke:#333,color:#000,stroke-width:5px',
    shape: 'dbl-circ',
  },
  {
    id: 'QQ',
    name: 'Enigme',
    className: 'question-node',
    style: 'fill:#00f,stroke:#333,color:#fff,stroke-width:2px',
    shape: 'hex',
    linkStyle: '~~~',
  },
  {
    id: 'QS',
    name: 'Solution',
    className: 'solution-node',
    style: 'fill:#0f0,stroke:#333,color:#000,stroke-width:2px',
    shape: 'diamond',
  },
  {
    id: 'F',
    name: 'Combat',
    className: 'fight-node',
    style: 'fill:#f96,stroke:#333,stroke-width:2px',
    shape: 'bang',
    // linkStyle: '-...->',
  },
  {
    id: 'S',
    name: 'Point de sauvegarde',
    className: 'savepoint-node',
    style:
      'fill:#fff,stroke:#333,color:#000,stroke-width:2px,stroke-dasharray: 5 5',
    shape: 'cylinder',
    extractLink: (sourceId, ids) => [], // No links from savepoints
    specification: `
      Only one value, it's the checkpoint chapter to use when we restore from it
    `,
  },
  {
    id: 'C',
    name: 'Checkbox',
    className: 'check-node',
    style: 'fill:#ff0,stroke:#333,color:#000,stroke-width:2px',
    shape: 'rect',
    specification: `
     No values, indicate the chapter contains a checkbox
    `,
  },
  {
    id: 'TC',
    name: 'Cocher les checkboxes',
    // className: 'to-check-node',
    // style: 'fill:#ff0,stroke:#333,color:#000,stroke-width:2px,stroke-dasharray: 5 5',
    // shape: 'rect',
    extractLink: (sourceId, ids) => [], // Action to do, no link from here
    specification: `
      As many values as needed, each indicating a chapter that we need to tick the checkbox
    `,
  },
  {
    id: /T\d{2}/,
    name: 'Lien vers un autre tome',
    className: 'tome-node',
    style: 'fill:#ccc,stroke:#333,color:#000,stroke-width:2px',
    shape: 'card',
    // linkStyle: '===>',
    extractLink: (sourceId, ids) => [], // The link is oriented to another book, so no link from here
    specification: `
      Only one value, it's the chapter of the 2nd book that is specified
    `,
  },
  {
    id: 'RO',
    name: 'Lien vers une extension',
    className: 'royaume-des-ombres-node',
    style: 'fill:#666,stroke:#333,color:#fff,stroke-width:2px',
    shape: 'card',
    extractLink: (sourceId, ids) => [`${sourceId} --> ${ids[2]}`], // return back after going to the extension
    specification: `
      Three values are expected, separated by a dot:
      - TOME: the first one is the origin book number (2 or 3)
      - CHAPITRE: the second one is the origin initial chapter of the current adventure
      - RESURRECTION: the third one is the return chapter when we leave RO
    `,
  },
  {
    id: 'RRO',
    name: 'Royaume des Ombres - extension requise',
    className: 'required-royaume-des-ombres-node',
    style:
      'fill:#666,stroke:#333,color:#fff,stroke-width:2px,stroke-dasharray: 5 5',
    shape: 'card',
    specification: `
      Only one value, you need the RO book to access the specified chapter
    `,
  },
  {
    id: 'ROLOC',
    name: 'Royaume des Ombres - Localisation',
    className: 'royaume-des-ombres-localisation-node',
    style: 'fill:#fff,stroke:#333,color:#000,stroke-width:5px',
    shape: 'circle',
    extractLink: (sourceId, ids) => [`${sourceId} --> ${ids[0]}`], // return next time we enter RO
    specification: `
      Only one value, it's the value to put in the localisation box for the next time we enter RO
    `,
  },
  {
    id: 'GT',
    name: 'Royaume des Ombres - Goutte du Temps',
    className: 'goutte-du-temps-node',
    style: 'fill:#0ff,stroke:#333,color:#000,stroke-width:2px',
    shape: 'dbl-circ',
    specification: `
      No value, indicates that we should get back to the chapter indicated by the time drop
    `,
  },
  {
    id: 'ROS',
    name: 'Royaume des Ombres - passage secret',
    className: 'royaume-des-ombres-secret-node',
    style: 'fill:#666,stroke:#333,color:#fff,stroke-width:2px',
    shape: 'card',
    extractLink: (sourceId, ids) => [], // The link is oriented to the RO secret chapter, so no link from here
    specification: `
      Only one value, it's the chapter of RO that is specified, it's coupled with TXX of RO book
    `,
  },
]

function findSpecialNodeById(id: string): SpecialNode | undefined {
  return specialNodes.find(
    n =>
      (typeof n.id === 'string' && n.id === id) ||
      (n.id instanceof RegExp && n.id.test(id)),
  )
}

type SimpleChapter = {
  id: string
}

type SpecialChapter = {
  type: SpecialNode
  ids: string[]
}

type Chapter = SimpleChapter | SpecialChapter

function isSpecialChapter(chapter: Chapter): chapter is SpecialChapter {
  return (chapter as SpecialChapter).type !== undefined
}

function isSimpleChapter(chapter: Chapter): chapter is SimpleChapter {
  return (chapter as SimpleChapter).id !== undefined
}

function deserializeBookChapters(data: string): Chapter[][] {
  // Convert specific format to object representation
  return (
    data
      .split('\n')
      .map(line => line.trim())
      // .filter(line => line !== '')
      .map(line =>
        line
          .split(',')
          .map(link => link.trim())
          .filter(link => link !== '')
          .map(link =>
            link.includes('-')
              ? ({
                  type: findSpecialNodeById(link.split('-')[0])!,
                  ids: link.split('-')[1].split('.'),
                } satisfies SpecialChapter)
              : findSpecialNodeById(link)
                ? ({
                    type: findSpecialNodeById(link)!,
                    ids: [],
                  } satisfies SpecialChapter)
                : ({ id: link } satisfies SimpleChapter),
          ),
      )
  )
}

function generateMermaidDiagram(chapters: Chapter[][], file: FileType): string {
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
  specialNodes
    .filter(n => n.className && n.style)
    .forEach(n => {
      mermaidContent += `    classDef ${n.className} ${n.style};\n`
    })
  mermaidContent += `\n`

  // Legend generation
  mermaidContent += `    subgraph mermaid-legend["📋 LÉGENDE"]\n`
  specialNodes
    .filter(node => node.className && node.shape)
    .filter(node =>
      chapters.some(links =>
        links.some(link => isSpecialChapter(link) && link.type === node),
      ),
    )
    .forEach((n, idx) => {
      const nodeId = `L${idx + 1}`
      const nextNodeId = `L${idx + 1}t`
      mermaidContent += `        ${nodeId}:::${n.className}@{shape: ${n.shape}}\n`
      mermaidContent += `        ${nodeId} --> ${nextNodeId}["${n.name}"]\n`
    })
  mermaidContent += `    end\n\n`

  // Main subgraph wrapper
  mermaidContent += `    subgraph main["${file.name}"]\n`
  mermaidContent += `        direction TB\n\n`

  // Second pass: create all nodes
  chapters.forEach((nodes, index) => {
    const nodeId = `${index + 1}`
    const specials = nodes.filter(isSpecialChapter).map(link => link.type)
    const shape =
      specials.find(s => s.shape)?.shape ??
      (nodes.length > 1 ? 'diamond' : 'circle')
    const classNames = specials
      .filter(s => s.className)
      .map(s => s.className)
      .join(',')

    // console.log('Processing node:', nodeId, nodes, '-> shape:', shape, 'classNames:', classNames)
    mermaidContent += `        ${nodeId}${classNames ? `:::${classNames}` : ''}@{shape: ${shape}}\n`
  })
  mermaidContent += `\n`

  const filterSkippedChapter = (targetId: string) =>
    !file.chapterToSkip.includes(targetId)

  // Third pass: create connections
  chapters.forEach((nodes, index) => {
    const sourceId = `${index + 1}`

    // console.log('Processing node:', sourceId, nodes)

    nodes
      .filter(link =>
        isSimpleChapter(link) ? filterSkippedChapter(link.id) : true,
      )
      .forEach(link => {
        if (isSimpleChapter(link)) {
          mermaidContent += `        ${sourceId} --> ${link.id}\n`
        } else if (link.type.linkStyle) {
          link.ids.filter(filterSkippedChapter).forEach(targetId => {
            mermaidContent += `        ${sourceId} ${link.type.linkStyle} ${targetId}\n`
          })
        } else if (link.type.extractLink) {
          const extractedLinks = link.type.extractLink(
            sourceId,
            link.ids.filter(filterSkippedChapter),
          )
          extractedLinks.forEach(extractedLink => {
            mermaidContent += `        ${extractedLink}\n`
          })
        } else {
          link.ids.filter(filterSkippedChapter).forEach(targetId => {
            mermaidContent += `        ${sourceId} --> ${targetId}\n`
          })
        }
      })
  })

  // Close main subgraph
  mermaidContent += `    end\n`

  return mermaidContent
}

for (const file of files) {
  const data = await readFile(new URL(file.fileName, import.meta.url), 'utf-8')
  const lines = deserializeBookChapters(data)
  const mermaidContent = generateMermaidDiagram(lines, file)
  const outputFile = file.fileName.replace(/.txt$/, '.mermaid')
  await writeFile(outputFile, mermaidContent, 'utf-8')
  console.log(`Mermaid diagram has been generated in ${outputFile}`)
}
