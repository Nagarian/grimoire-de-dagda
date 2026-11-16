import { Box, Button, Dialog, Portal, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ItemId } from 'data/items'
import type { BookId } from 'services/books'
import type { BookCharacterSheet } from 'services/characterSheet'
import type { ItemDestination, LocalizedItem } from 'services/itemCatalog'
import { getItemsForChapter, isItemBookId } from 'services/itemCatalog'

type PendingAction = {
  item: LocalizedItem
  destination: ItemDestination
  mode: 'destination' | 'replace'
}

export function StoryItemActions({
  bookId,
  chapterNumber,
  sheet,
  onAddItem,
}: {
  bookId: BookId
  chapterNumber: string
  sheet?: BookCharacterSheet
  onAddItem: (itemId: ItemId, destination: ItemDestination) => boolean
}) {
  const { t } = useTranslation()
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  if (!isItemBookId(bookId)) {
    return null
  }

  const items = getItemsForChapter(bookId, chapterNumber)
  if (items.length === 0) {
    return null
  }

  function add(item: LocalizedItem, destination: ItemDestination) {
    const shouldReplace =
      sheet?.bookId === 'T05' &&
      ((destination === 'weapon' && sheet.weapons !== null) ||
        (destination === 'armor' && sheet.armor !== null))

    if (shouldReplace) {
      setPendingAction({ item, destination, mode: 'replace' })
      return
    }

    if (onAddItem(item.id, destination)) {
      setPendingAction(null)
    }
  }

  function chooseItem(item: LocalizedItem) {
    if (bookId === 'T05' && item.category === 'equipment' && item.effect) {
      setPendingAction({ item, destination: 'inventory', mode: 'destination' })
      return
    }

    const destination: ItemDestination =
      item.category === 'weapon' ||
      (bookId !== 'T05' && item.category === 'jewelry')
        ? 'weapon'
        : 'inventory'
    add(item, destination)
  }

  return (
    <>
      <Box display="flex" flexDirection="column" gap="2">
        {items.map(item => (
          <Button
            key={item.id}
            variant="subtle"
            justifyContent="space-between"
            whiteSpace="normal"
            height="auto"
            paddingY="3"
            onClick={() => chooseItem(item)}
          >
            <Box textAlign="left">
              <Text>{t('reader.addChapterItem', { name: item.name })}</Text>
              {item.effect && (
                <Text fontSize="sm" color="fg.muted">
                  {item.effect}
                </Text>
              )}
            </Box>
            <Text fontSize="sm" color="fg.muted">
              {item.categoryLabel}
            </Text>
          </Button>
        ))}
      </Box>
      <Dialog.Root
        open={pendingAction !== null}
        onOpenChange={details => {
          if (!details.open) {
            setPendingAction(null)
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner alignItems="center" justifyContent="center">
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                  {pendingAction?.mode === 'replace'
                    ? t('form.replaceEquipmentTitle')
                    : t('sheet.chooseEquipmentDestination')}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  {pendingAction?.mode === 'replace'
                    ? t('form.replaceEquipmentConfirm', {
                        name: pendingAction.item.name,
                      })
                    : t('sheet.equipmentDestinationDescription', {
                        name: pendingAction?.item.name ?? '',
                      })}
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => setPendingAction(null)}
                >
                  {t('form.cancel')}
                </Button>
                {pendingAction?.mode === 'replace' ? (
                  <Button
                    onClick={() => {
                      if (
                        onAddItem(
                          pendingAction.item.id,
                          pendingAction.destination,
                        )
                      ) {
                        setPendingAction(null)
                      }
                    }}
                  >
                    {t('form.replace')}
                  </Button>
                ) : (
                  <>
                    {pendingAction && (
                      <Button
                        variant="outline"
                        onClick={() => add(pendingAction.item, 'inventory')}
                      >
                        {t('sheet.storeInInventory')}
                      </Button>
                    )}
                    {pendingAction && (
                      <Button onClick={() => add(pendingAction.item, 'armor')}>
                        {t('sheet.useAsArmor')}
                      </Button>
                    )}
                  </>
                )}
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
