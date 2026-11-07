import { Button, IconButton, Text } from '@chakra-ui/react'
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
  return (
    <PageHeader
      subtitle={trackName ?? 'Votre aventure'}
      title={bookTitle ?? 'Choisissez votre départ'}
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            disabled={!canUndo}
            onClick={onUndo}
            aria-label="Annuler la dernière étape"
          >
            <LuUndo2 />
            <Text hideBelow="sm">Annuler</Text>
          </Button>
          {trackName && (
            <IconButton
              aria-label="Afficher l’historique et les cases cochées"
              title="Historique et cases cochées"
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
