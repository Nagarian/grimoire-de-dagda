import {
  Box,
  Button,
  Dialog,
  Field,
  Group,
  IconButton,
  Input,
  Portal,
  Text,
} from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuPencil } from 'react-icons/lu'
import type { ItemId } from 'data/items'
import type { InventoryItem } from 'services/characterSheet'
import {
  getInventoryItemEffect,
  getInventoryItemName,
} from 'services/characterSheet'
import { getManualItemSuggestions } from 'services/itemCatalog'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { CatalogItemCombobox } from './CatalogItemCombobox'
import { ItemDialog } from './ItemDialog'
import { Section } from './Section'

export function EquipmentList({
  title,
  itemType,
  item,
  colorPalette = 'gray',
  onChange,
}: {
  title: string
  itemType: 'weapon' | 'protection'
  item: InventoryItem | null
  colorPalette?: string
  onChange: (item: InventoryItem | null) => void
}) {
  const { t, i18n } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [itemId, setItemId] = useState<ItemId | undefined>()
  const [effect, setEffect] = useState('')
  const [pendingItem, setPendingItem] = useState<InventoryItem | null>(null)
  const suggestions = useMemo(
    () =>
      getManualItemSuggestions(
        'T05',
        itemType === 'weapon' ? 'weapon' : 'armor',
        i18n.resolvedLanguage,
      ),
    [itemType, i18n.resolvedLanguage],
  )
  const itemLabel =
    itemType === 'weapon'
      ? t('sheet.fields.weaponName')
      : t('sheet.fields.protectionName')

  function openDialog() {
    setName(item ? getInventoryItemName(item) : '')
    setItemId(item && 'id' in item ? item.id : undefined)
    setEffect(item ? getInventoryItemEffect(item) : '')
    setDialogOpen(true)
  }

  function submitItem() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return false
    }

    const nextItem: InventoryItem = itemId
      ? { id: itemId, quantity: 1 }
      : {
          name: trimmedName,
          quantity: 1,
          effect: effect.trim(),
        }
    if (item) {
      setPendingItem(nextItem)
      return true
    }
    onChange(nextItem)
    return true
  }

  function closeConfirmation() {
    setPendingItem(null)
  }

  return (
    <Section title={title}>
      {item && (
        <Group
          display="flex"
          w="full"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box minW="0">
            <Text overflowWrap="anywhere">{getInventoryItemName(item)}</Text>
            {getInventoryItemEffect(item) && (
              <Text fontSize="sm" color="fg.muted">
                {getInventoryItemEffect(item)}
              </Text>
            )}
          </Box>
          <Box display="flex" gap="2">
            <IconButton
              variant="outline"
              aria-label={t('sheet.editInventoryItem', { number: 1 })}
              onClick={openDialog}
            >
              <LuPencil />
            </IconButton>
            <ConfirmDeleteButton
              description={t('form.removeEquipment', {
                type:
                  itemType === 'weapon'
                    ? t('sheet.fields.weapon')
                    : t('sheet.fields.protection'),
                name: getInventoryItemName(item),
              })}
              colorPalette={colorPalette}
              onConfirm={() => onChange(null)}
            />
          </Box>
        </Group>
      )}
      {!item && (
        <Button variant="outline" alignSelf="flex-start" onClick={openDialog}>
          {t('form.add')}
        </Button>
      )}
      <ItemDialog
        title={
          item
            ? t('form.replaceEquipment', { name: getInventoryItemName(item) })
            : itemType === 'weapon'
              ? t('form.addWeapon')
              : t('form.addProtection')
        }
        submitLabel={item ? t('form.replace') : t('form.add')}
        open={dialogOpen}
        canSubmit={name.trim().length > 0}
        colorPalette={colorPalette}
        onOpenChange={setDialogOpen}
        onSubmit={submitItem}
      >
        <CatalogItemCombobox
          colorPalette={colorPalette}
          items={suggestions}
          label={t('form.name')}
          placeholder={itemLabel}
          inputValue={name}
          selectedItemId={itemId}
          onInputValueChange={nextName => {
            const suggestion = suggestions.find(
              candidate =>
                candidate.name.toLocaleLowerCase() ===
                nextName.toLocaleLowerCase(),
            )
            setName(nextName)
            setItemId(suggestion?.id)
            setEffect('')
          }}
          onItemSelect={candidate => {
            setName(candidate.name)
            setItemId(candidate.id)
            setEffect('')
          }}
        />
        {itemId ? (
          <Text fontSize="sm" color="fg.muted">
            {suggestions.find(candidate => candidate.id === itemId)?.effect}
          </Text>
        ) : (
          <Field.Root>
            <Field.Label>{t('sheet.fields.effect')}</Field.Label>
            <Input
              aria-label={t('sheet.fields.effect')}
              value={effect}
              onChange={event => setEffect(event.target.value)}
            />
          </Field.Root>
        )}
      </ItemDialog>
      <Dialog.Root
        open={pendingItem !== null}
        onOpenChange={details => {
          if (!details.open) {
            closeConfirmation()
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner alignItems="center" justifyContent="center">
            <Dialog.Content colorPalette={colorPalette}>
              <Dialog.Header>
                <Dialog.Title>{t('form.replaceEquipmentTitle')}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  {t('form.replaceEquipmentConfirm', {
                    name: pendingItem ? getInventoryItemName(pendingItem) : '',
                  })}
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={closeConfirmation}>
                  {t('form.cancel')}
                </Button>
                <Button
                  onClick={() => {
                    if (pendingItem) {
                      onChange(pendingItem)
                    }
                    closeConfirmation()
                  }}
                >
                  {t('form.replace')}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Section>
  )
}
