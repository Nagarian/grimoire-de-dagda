import {
  Box,
  Button,
  Field,
  Group,
  IconButton,
  Input,
  Text,
} from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuPencil } from 'react-icons/lu'
import type { ItemBookId, ItemId } from 'data/items'
import type { InventoryItem } from 'services/characterSheet'
import {
  addInventoryItem,
  getInventoryItemEffect,
  getInventoryItemName,
} from 'services/characterSheet'
import {
  getLocalizedItem,
  getManualItemSuggestions,
} from 'services/itemCatalog'
import { CatalogItemCombobox } from './CatalogItemCombobox'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { ItemDialog } from './ItemDialog'
import { NumberField } from './NumberField'
import { Section } from './Section'

export function InventoryList({
  bookId,
  inventory,
  limit,
  colorPalette = 'gray',
  onSelectEffectEquipment,
  onChange,
}: {
  bookId: ItemBookId
  inventory: InventoryItem[]
  limit: number
  colorPalette?: string
  onSelectEffectEquipment?: (item: InventoryItem) => void
  onChange: (inventory: InventoryItem[]) => void
}) {
  const { t, i18n } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftId, setDraftId] = useState<ItemId | undefined>()
  const [draftEffect, setDraftEffect] = useState('')
  const [draftQuantity, setDraftQuantity] = useState<number | null>(null)
  const suggestions = useMemo(
    () => getManualItemSuggestions(bookId, 'inventory', i18n.resolvedLanguage),
    [bookId, i18n.resolvedLanguage],
  )

  function openCreateDialog() {
    setEditingIndex(null)
    setDraftName('')
    setDraftId(undefined)
    setDraftEffect('')
    setDraftQuantity(1)
    setDialogOpen(true)
  }

  function openEditDialog(index: number, item: InventoryItem) {
    setEditingIndex(index)
    setDraftName(getInventoryItemName(item))
    setDraftId('id' in item ? item.id : undefined)
    setDraftEffect(getInventoryItemEffect(item))
    setDraftQuantity(item.quantity)
    setDialogOpen(true)
  }

  function submitItem() {
    const name = draftName.trim()
    if (!name || draftQuantity === null || draftQuantity < 1) {
      return false
    }

    const item: InventoryItem = draftId
      ? { id: draftId, quantity: draftQuantity }
      : {
          name,
          quantity: draftQuantity,
          ...(draftEffect && { effect: draftEffect.trim() }),
        }
    if (
      editingIndex === null &&
      bookId === 'T05' &&
      draftId &&
      getLocalizedItem(draftId).category === 'equipment' &&
      getLocalizedItem(draftId).effect &&
      onSelectEffectEquipment
    ) {
      onSelectEffectEquipment(item)
      setDraftName('')
      setDraftId(undefined)
      setDraftEffect('')
      setDraftQuantity(null)
      return
    }
    const remaining =
      editingIndex === null
        ? inventory
        : inventory.filter((_, index) => index !== editingIndex)
    onChange(addInventoryItem(remaining, item))
    setDraftName('')
    setDraftId(undefined)
    setDraftEffect('')
    setDraftQuantity(null)
  }

  return (
    <Section
      title={t('sheet.sections.inventory', {
        current: inventory.length,
        limit,
      })}
      columns={2}
    >
      {inventory.length > limit && (
        <Text role="status" gridColumn="1 / -1" color="fg.warning">
          {t('sheet.inventoryOverLimit', { current: inventory.length, limit })}
        </Text>
      )}
      {inventory.map((item, index) => (
        <Group
          key={index}
          w="full"
          display="grid"
          gridTemplateColumns="1fr auto auto"
          alignItems="center"
        >
          <Text minW="0" overflowWrap="anywhere">
            {getInventoryItemName(item)}
            {getInventoryItemEffect(item) && (
              <Text as="span" color="fg.muted">
                {' '}
                — {getInventoryItemEffect(item)}
              </Text>
            )}
          </Text>
          <Text>{item.quantity}</Text>
          <Box display="flex" gap="2">
            <IconButton
              variant="outline"
              aria-label={t('sheet.editInventoryItem', {
                number: index + 1,
              })}
              onClick={() => openEditDialog(index, item)}
            >
              <LuPencil />
            </IconButton>
            <ConfirmDeleteButton
              description={t('sheet.itemDescription', {
                name: getInventoryItemName(item),
              })}
              colorPalette={colorPalette}
              onConfirm={() =>
                onChange(
                  inventory.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            />
          </Box>
        </Group>
      ))}
      <Button variant="outline" gridColumn="1 / -1" onClick={openCreateDialog}>
        {t('form.addItem')}
      </Button>
      <ItemDialog
        title={editingIndex === null ? t('form.addItem') : t('form.editItem')}
        submitLabel={editingIndex === null ? t('form.add') : t('form.save')}
        open={dialogOpen}
        canSubmit={draftName.trim().length > 0 && (draftQuantity ?? 0) > 0}
        colorPalette={colorPalette}
        onOpenChange={setDialogOpen}
        onSubmit={submitItem}
      >
        <CatalogItemCombobox
          colorPalette={colorPalette}
          items={suggestions}
          label={t('sheet.fields.itemName')}
          placeholder={t('sheet.itemExample')}
          inputValue={draftName}
          selectedItemId={draftId}
          onInputValueChange={name => {
            const suggestion = suggestions.find(
              item =>
                item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
            )
            setDraftName(name)
            setDraftId(suggestion?.id)
            setDraftEffect('')
          }}
          onItemSelect={item => {
            setDraftName(item.name)
            setDraftId(item.id)
            setDraftEffect('')
          }}
        />
        {draftId ? (
          <Text fontSize="sm" color="fg.muted">
            {getLocalizedItem(draftId).effect}
          </Text>
        ) : (
          <Field.Root>
            <Field.Label>{t('sheet.fields.effect')}</Field.Label>
            <Input
              aria-label={t('sheet.fields.effect')}
              value={draftEffect}
              onChange={event => setDraftEffect(event.target.value)}
            />
          </Field.Root>
        )}
        <NumberField
          label={t('sheet.fields.quantity')}
          value={draftQuantity}
          min={1}
          placeholder="1"
          onChange={setDraftQuantity}
        />
      </ItemDialog>
    </Section>
  )
}
