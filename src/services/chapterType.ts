type BaseChapterType = {
  /**
   * Unique identifier that will be used into the file declaration
   */
  id: string
  /**
   * Label to display the kind of node we are
   */
  label: string
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
  /**
   * Method to do the extraction of the different relevant chapters path
   * @param sourceId the chapter where we are
   * @param ids all the ids extracted from the current chapter
   * @returns all the relevant paths from the current chapter
   */
  extractPaths?: (sourceId: string, ids: string[]) => string[]
  /**
   * Explanation of the construction of this node
   */
  specification?: string
}

const storyChapter = {
  id: 'STORY',
  label: 'Story chapter',
} as const satisfies BaseChapterType

type SpecialChapter = Omit<BaseChapterType, 'id'> & {
  id: string | RegExp
}

const specialChapter = [
  {
    id: 'START',
    label: 'Start',
    className: 'chapter-start',
    style: 'fill:#fff,stroke:#333,color:#000,stroke-width:5px',
    shape: 'circle',
  },
  {
    id: 'END',
    label: 'End',
    className: 'chapter-end',
    style: 'fill:#fff,stroke:#333,color:#000,stroke-width:5px',
    shape: 'dbl-circ',
  },
  {
    id: 'QQ',
    label: 'Enigme',
    className: 'chapter-question',
    style: 'fill:#00f,stroke:#333,color:#fff,stroke-width:2px',
    shape: 'hex',
    extractPaths: (sourceId, ids) => ids.map(id => `${sourceId} ~~~ ${id}`),
    specification: `
      Only one value, it's the enigme solution chapter
    `,
  },
  {
    id: 'QS',
    label: 'Solution',
    className: 'chaper-solution',
    style: 'fill:#0f0,stroke:#333,color:#000,stroke-width:2px',
    shape: 'diamond',
    specification: `
      No value, indicates that this chapter is a solution to an enigme
    `,
  },
  {
    id: 'F',
    label: 'Combat',
    className: 'chapter-fight',
    style: 'fill:#f96,stroke:#333,stroke-width:2px',
    shape: 'bang',
    // extractPaths: (sourceId, ids) => ids.map(id => `${sourceId} -...-> ${id}`),
  },
  {
    id: 'S',
    label: 'Point de sauvegarde',
    className: 'chapter-savepoint',
    style:
      'fill:#fff,stroke:#333,color:#000,stroke-width:2px,stroke-dasharray: 5 5',
    shape: 'cylinder',
    extractPaths: (sourceId, ids) => [], // No links from savepoints
    specification: `
      Only one value, it's the checkpoint chapter to use when we restore from it
    `,
  },
  {
    id: 'C',
    label: 'Checkbox',
    className: 'chapter-checkbox',
    style: 'fill:#ff0,stroke:#333,color:#000,stroke-width:2px',
    shape: 'rect',
    specification: `
     No values, indicate the chapter contains a checkbox
    `,
  },
  {
    id: 'TC',
    label: 'Cocher les checkboxes',
    // className: 'action-to-check',
    // style: 'fill:#ff0,stroke:#333,color:#000,stroke-width:2px,stroke-dasharray: 5 5',
    // shape: 'rect',
    extractPaths: (sourceId, ids) => [], // Action to do, no path from here
    specification: `
      As many values as needed, each indicating a chapter that we need to tick the checkbox
    `,
  },
  {
    id: /T\d{2}/,
    label: 'Lien vers un autre tome',
    className: 'chapter-book-link',
    style: 'fill:#ccc,stroke:#333,color:#000,stroke-width:2px',
    shape: 'card',
    extractPaths: (sourceId, ids) => ids.map(id => `${sourceId} ===> ${id}`), // The path is oriented to another book, so no path from here
    specification: `
      Only one value, it's the chapter of the other book that is specified
    `,
  },
  {
    id: 'RO',
    label: 'Lien vers une extension',
    className: 'chapter-extension-link',
    style: 'fill:#666,stroke:#333,color:#fff,stroke-width:2px',
    shape: 'card',
    extractPaths: (sourceId, ids) =>
      ids.slice(-1).map(id => `${sourceId} --> ${id}`), // return back after going to the extension
    specification: `
      Three values are expected, separated by a dot:
      - TOME: the first one is the origin book number (2 or 3)
      - CHAPITRE: the second one is the origin initial chapter of the current adventure
      - RESURRECTION: the third one is the return chapter when we leave RO
    `,
  },
  {
    id: 'RRO',
    label: 'Royaume des Ombres - extension requise',
    className: 'requirement-royaume-des-ombres',
    style:
      'fill:#666,stroke:#333,color:#fff,stroke-width:2px,stroke-dasharray: 5 5',
    shape: 'card',
    specification: `
      Only one value, you need the RO book to access the specified chapter
    `,
  },
  {
    id: 'ROLOC',
    label: 'Royaume des Ombres - Localisation',
    className: 'action-royaume-des-ombres-localisation',
    style: 'fill:#fff,stroke:#333,color:#000,stroke-width:5px',
    shape: 'circle',
    extractPaths: (sourceId, ids) => ids.map(id => `${sourceId} --> ${id}`), // return next time we enter RO
    specification: `
      Only one value, it's the value to put in the localisation box for the next time we enter RO
    `,
  },
  {
    id: 'GT',
    label: 'Royaume des Ombres - Goutte du Temps',
    className: 'action-goutte-du-temps',
    style: 'fill:#0ff,stroke:#333,color:#000,stroke-width:2px',
    shape: 'dbl-circ',
    specification: `
      No value, indicates that we should get back to the chapter indicated by the time drop
    `,
  },
  {
    id: 'ROS',
    label: 'Royaume des Ombres - passage secret',
    className: 'action-royaume-des-ombres-secret',
    style: 'fill:#666,stroke:#333,color:#fff,stroke-width:2px',
    shape: 'card',
    extractPaths: (sourceId, ids) => [], // The path is oriented to the RO secret chapter, so no path from here
    specification: `
      Only one value, it's the chapter of RO that is specified, it's coupled with TXX of RO book
    `,
  },
] as const satisfies SpecialChapter[]

type StringIds = Extract<(typeof specialChapter)[number]['id'], string>

export type ChapterId = typeof storyChapter.id | StringIds | `T${string}`
export type ChapterType = Omit<BaseChapterType, 'id'> & { id: ChapterId }

export function getChapterType(id: string): ChapterType {
  const specialNode = specialChapter.find(node =>
    typeof node.id === 'string' ? node.id === id : node.id.test(id),
  )

  return specialNode ? { ...specialNode, id: id as ChapterId } : storyChapter
}
