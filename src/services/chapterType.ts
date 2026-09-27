export type ChapterShape =
  | 'card'
  | 'circle'
  | 'diamond'
  | 'double-circle'
  | 'hexagon'
  | 'teardrop'

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

export type ChapterPath = {
  target: string
  /**
   * Kept in the layout so both chapters stay close to each other, but never
   * drawn.
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
    id: 'START',
    label: 'Départ',
    className: 'chapter-start',
    shape: 'circle',
  },
  {
    id: 'END',
    label: 'Fin',
    className: 'chapter-end',
    shape: 'double-circle',
  },
  {
    // The argument is the chapter holding the solution. The path is hidden so
    // the answer is not given away, but it still pulls both chapters together.
    id: 'QQ',
    label: 'Énigme',
    className: 'chapter-enigma',
    shape: 'hexagon',
    badge: 'question',
    extractPaths: args => args.map(target => ({ target, hidden: true })),
  },
  {
    id: 'QS',
    label: 'Solution',
    className: 'chapter-solution',
    shape: 'hexagon',
    badge: 'solution',
  },
  {
    id: 'F',
    label: 'Combat',
    className: 'chapter-fight',
    badge: 'fight',
  },
  {
    // The argument is the checkpoint chapter to restore from, not a path.
    id: 'S',
    label: 'Point de sauvegarde',
    className: 'chapter-savepoint',
    badge: 'savepoint',
    extractPaths: noPath,
  },
  {
    id: 'C',
    label: 'Checkbox',
    className: 'chapter-checkbox',
    badge: 'checkbox',
  },
  {
    // The arguments are the chapters whose checkbox to tick: an action, not a
    // path. Carries no shape, so it never shows up in the legend either.
    id: 'TC',
    label: 'Cocher les checkboxes',
    badge: 'checkbox-checked',
    extractPaths: noPath,
  },
  {
    // The argument points into another book, so it leads nowhere in this one.
    id: 'TOME',
    match: /^T\d{2}$/,
    label: 'Lien vers un autre tome',
    className: 'chapter-tome',
    shape: 'card',
    badge: 'tome',
    extractPaths: noPath,
  },
  {
    // Arguments are <tome>.<chapitre>.<résurrection>: only the last one, the
    // chapter we come back to when leaving the extension, is a path.
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
    id: 'RRO',
    label: 'Royaume des Ombres - extension requise',
    badge: 'royaume-lock',
  },
  {
    // The argument is the localisation to write down for the next RO visit,
    // and the chapter we resume from.
    id: 'ROLOC',
    label: 'Royaume des Ombres - Localisation',
    className: 'chapter-royaume-des-ombres-localisation',
    badge: 'localisation',
    extractPaths: firstArgument,
  },
  {
    id: 'GT',
    label: 'Royaume des Ombres - Goutte du Temps',
    className: 'chapter-goutte-du-temps',
    shape: 'teardrop',
  },
  {
    // The argument points into the RO book, so it leads nowhere in this one.
    id: 'ROS',
    label: 'Royaume des Ombres - passage secret',
    className: 'chapter-royaume-des-ombres-secret',
    shape: 'card',
    badge: 'royaume-key',
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
