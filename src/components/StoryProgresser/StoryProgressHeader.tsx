import { Button, IconButton, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuList, LuUndo2 } from 'react-icons/lu'
import { PageHeader } from 'components/ui/PageHeader'

export function StoryProgressHeader({
  trackName,
  bookTitle,
  canUndo,
  onUndo,
  onOpenProgressDetails,
}: {
  trackName?: string
  bookTitle?: string
  canUndo: boolean
  onUndo: () => void
  onOpenProgressDetails?: () => void
}) {
  const { t } = useTranslation()
  return (
    <PageHeader
      subtitle={trackName ?? t('story.yourAdventure')}
      title={bookTitle ?? t('story.chooseStart')}
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            disabled={!canUndo}
            onClick={onUndo}
            aria-label={t('story.undo')}
          >
            <LuUndo2 />
            <Text hideBelow="sm">{t('common.cancel')}</Text>
          </Button>
          {trackName && (
            <IconButton
              aria-label={t('story.showHistoryAndCheckboxes')}
              title={t('story.historyAndCheckboxes')}
              variant="ghost"
              onClick={onOpenProgressDetails}
            >
              <LuList />
            </IconButton>
          )}
        </>
      }
    />
  )
}
