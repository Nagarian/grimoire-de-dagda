import classNames from 'classnames'
import type { ChapterBadge } from 'services/chapterType'
import { chapterBadgeHeight } from 'services/chapterType'
import type { LayoutNode } from 'services/graphLayout'
import { ChapterBadgeGlyph } from './ChapterBadgeGlyph'
import { ChapterShape } from './ChapterShape'

export type ChapterNodeProps = {
  node: LayoutNode
  hideLabel?: boolean
}

export function ChapterNode({ node, hideLabel = false }: ChapterNodeProps) {
  const shapeY = node.badges.length > 0 ? chapterBadgeHeight : 0
  const shapeHeight = node.height - shapeY

  return (
    <g
      id={`chapter-${node.id}`}
      className={classNames('chapter', node.classNames)}
      transform={`translate(${node.x} ${node.y})`}
    >
      <g transform={`translate(0 ${shapeY})`}>
        <ChapterShape
          shape={node.shape}
          width={node.width}
          height={shapeHeight}
        />
      </g>
      <ChapterBadges badges={node.badges} width={node.width} />
      <text
        className={classNames('chapter-label', {
          'chapter-label-hidden': hideLabel,
        })}
        x={node.width / 2}
        y={shapeY + shapeHeight / 2 + (node.bookId ? 12 : 0)}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {node.label}
      </text>
      {node.bookId && (
        <text
          className="chapter-book-label"
          x={node.width / 2}
          y={shapeY + shapeHeight / 2 - 13}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {node.bookId}
        </text>
      )}
    </g>
  )
}

function ChapterBadges({
  badges,
  width,
}: {
  badges: ChapterBadge[]
  width: number
}) {
  const badgeWidth = 24
  const totalWidth = badges.length * badgeWidth
  const startX = (width - totalWidth) / 2

  return (
    <g className="chapter-badges" aria-hidden="true">
      {badges.map((badge, index) => (
        <ChapterBadgeGlyph
          key={`${badge}-${index}`}
          badge={badge}
          x={startX + index * badgeWidth}
        />
      ))}
    </g>
  )
}
