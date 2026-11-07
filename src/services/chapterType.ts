export type ChapterShape =
  | 'card'
  | 'circle'
  | 'diamond'
  | 'double-circle'
  | 'hexagon'
  | 'teardrop'
  | 'map'

export type ChapterBadge =
  | 'fight'
  | 'checkbox'
  | 'checkbox-checked'
  | 'savepoint'
  | 'question'
  | 'solution'
  | 'tome'
  | 'localisation'
  | 'royaume'
  | 'royaume-key'
  | 'royaume-lock'
  | 'map'

export type ChapterPath = {
  target: string
  /**
   * Drawn in the tree, but conceals the target chapter's label until searched.
   */
  hidden?: boolean
}

export type ChapterType = {
  /** The DSL key, e.g. `QQ` in `QQ-7`. */
  id: string
  /** Matches keys that are not the literal `id`, e.g. `T04` for the tome type. */
  match?: RegExp
  /** Shown in the legend. */
  label: string
  className?: string
  shape?: ChapterShape
  badge?: ChapterBadge
  /**
   * Paths this marker contributes, from its dot-separated arguments. When
   * omitted, every argument becomes a path.
   */
  extractPaths?: (args: string[]) => ChapterPath[]
}

const noPath = (): ChapterPath[] => []

const firstArgument = (args: string[]): ChapterPath[] => {
  const target = args.at(0)
  return target ? [{ target }] : []
}

const chapterTypes: ChapterType[] = [
  {
    // START no arguments
    id: 'START',
    label: 'Départ',
    className: 'chapter-start',
    shape: 'circle',
    extractPaths: noPath,
  },
  {
    // END no arguments
    id: 'END',
    label: 'Fin',
    className: 'chapter-end',
    shape: 'double-circle',
    extractPaths: noPath,
  },
  {
    // QQ-<chapter to go to as a response>
    id: 'QQ',
    label: 'Énigme',
    className: 'chapter-enigma',
    shape: 'hexagon',
    badge: 'question',
    extractPaths: args => args.map(target => ({ target, hidden: true })),
  },
  {
    // QS no arguments
    id: 'QS',
    label: 'Solution',
    className: 'chapter-solution',
    shape: 'hexagon',
    badge: 'solution',
    extractPaths: noPath,
  },
  {
    // F-<enemy dexterity>.<enemy life points> except T05 whic is F-<enemy guard>.<enemy damage>
    id: 'F',
    label: 'Combat',
    className: 'chapter-fight',
    badge: 'fight',
    extractPaths: noPath,
  },
  {
    // S-<chapter on which we revive if we use the savepoint>
    id: 'S',
    label: 'Point de sauvegarde',
    className: 'chapter-savepoint',
    badge: 'savepoint',
    extractPaths: noPath,
  },
  {
    // C no arguments
    id: 'C',
    label: 'Checkbox',
    className: 'chapter-checkbox',
    badge: 'checkbox',
    extractPaths: noPath,
  },
  {
    // TC-<chapter to check>.<chapter to check> (or more)
    id: 'TC',
    label: 'Cocher les checkboxes',
    badge: 'checkbox-checked',
    extractPaths: noPath,
  },
  {
    // LC-<chapter>.<line label>
    id: 'LC',
    label: 'Line Checkbox',
    className: 'line-checkbox',
    badge: 'checkbox',
    extractPaths: firstArgument,
  },
  {
    // TLC-<chapter to check>.<line label if specified (otherwise label it with the current line number)>
    id: 'TLC',
    label: 'Cocher les checkboxes de ligne',
    badge: 'checkbox-checked',
    extractPaths: noPath,
  },
  {
    // T00-<chapter to go into that book>
    id: 'TOME',
    match: /^T\d{2}$/,
    label: 'Lien vers un autre tome',
    className: 'chapter-tome',
    shape: 'card',
    badge: 'tome',
    extractPaths: noPath,
  },
  {
    // RO-<originate book>.<chapter>.<get back chapter>
    id: 'RO',
    label: 'Lien vers une extension',
    className: 'chapter-royaume-des-ombres',
    shape: 'card',
    badge: 'royaume',
    extractPaths: args => {
      const resurrection = args.at(2)
      return resurrection ? [{ target: resurrection }] : []
    },
  },
  {
    // RRO-<chapter locked by the RO extension>
    id: 'RRO',
    label: 'Royaume des Ombres - extension requise',
    shape: 'card',
    badge: 'royaume-lock',
    extractPaths: firstArgument,
  },
  {
    // ROLOC-<localisation chapter that we resume from next time we go into the RO book>
    id: 'ROLOC',
    label: 'Royaume des Ombres - Localisation',
    className: 'chapter-royaume-des-ombres-localisation',
    badge: 'localisation',
    extractPaths: firstArgument,
  },
  {
    // GT no arguments
    id: 'GT',
    label: 'Royaume des Ombres - Goutte du Temps',
    className: 'chapter-goutte-du-temps',
    shape: 'teardrop',
    extractPaths: noPath,
  },
  {
    // ROS-<chapter to go into RO book which is the secret passage>
    id: 'ROS',
    label: 'Royaume des Ombres - passage secret',
    className: 'chapter-royaume-des-ombres-secret',
    shape: 'card',
    badge: 'royaume-key',
    extractPaths: noPath,
  },
  {
    // M no arguments
    // link to the map
    id: 'M',
    label: 'Aller à la carte du monde',
    className: 'map',
    extractPaths: () => [{ target: 'MAP' }],
  },
  {
    // HM-<chapter to reveal on the map>.<chapter label>
    id: 'HM',
    label: "Carte du monde - Ajout d'un chemin",
    className: 'map-hidden-path',
    badge: 'map',
    extractPaths: noPath,
  },
  {
    // MAP no arguments
    // Special chapter that is on the book cover
    id: 'MAP',
    label: 'Carte du monde',
    className: 'chapter-map',
    shape: 'map',
    extractPaths: noPath,
  },
]

export function getChapterType(key: string): ChapterType | undefined {
  return chapterTypes.find(type =>
    type.match ? type.match.test(key) : type.id === key,
  )
}

/**
 * Registry order, so the legend always lists types the same way.
 */
export function sortChapterTypes(types: Iterable<ChapterType>): ChapterType[] {
  const used = new Set(types)
  return chapterTypes.filter(type => used.has(type))
}

/**
 * Drawing size of each shape, shared by the layout engine and the renderer so
 * ELK reserves exactly the room a node takes on screen.
 */
export const chapterShapeSize: Record<
  ChapterShape,
  { width: number; height: number }
> = {
  card: { width: 104, height: 76 },
  circle: { width: 76, height: 76 },
  diamond: { width: 116, height: 116 },
  'double-circle': { width: 86, height: 86 },
  hexagon: { width: 116, height: 76 },
  teardrop: { width: 86, height: 104 },
  map: { width: 116, height: 116 },
}

export const chapterBadgeHeight = 28

export function chapterNodeSize(
  shape: ChapterShape,
  hasBadge: boolean,
): { width: number; height: number } {
  const size = chapterShapeSize[shape]
  return {
    width: size.width,
    height: size.height + (hasBadge ? chapterBadgeHeight : 0),
  }
}
