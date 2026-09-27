import {
  LuBook,
  LuKey,
  LuLock,
  LuMapPin,
  LuMoon,
  LuSave,
  LuSquare,
  LuSquareCheck,
  LuSwords,
} from 'react-icons/lu'
import type { ChapterBadge } from 'services/chapterType'

type ChapterBadgeGlyphProps = {
  badge: ChapterBadge
  x: number
}

export function ChapterBadgeGlyph({ badge, x }: ChapterBadgeGlyphProps) {
  const common = {
    className: 'chapter-badge',
    x: x + 2,
    y: 4,
    width: 20,
    height: 20,
  }

  switch (badge) {
    case 'fight':
      return <LuSwords {...common} />
    case 'checkbox':
      return <LuSquare {...common} />
    case 'checkbox-checked':
      return <LuSquareCheck {...common} />
    case 'savepoint':
      return <LuSave {...common} />
    case 'localisation':
      return <LuMapPin {...common} />
    case 'royaume':
      return <LuMoon {...common} />
    case 'royaume-key':
      return <LuKey {...common} />
    case 'royaume-lock':
      return <LuLock {...common} />
    case 'tome':
      return <LuBook {...common} />
    case 'question':
      return (
        <text className="chapter-badge-text" x={x + 12} y="20">
          ?
        </text>
      )
    case 'solution':
      return (
        <text className="chapter-badge-text" x={x + 12} y="20">
          !
        </text>
      )
  }
}
