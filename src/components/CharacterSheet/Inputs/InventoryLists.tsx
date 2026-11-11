import {
  Box,
  Button,
  Field,
  Group,
  IconButton,
  Input,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuPencil } from 'react-icons/lu'
import type { InventoryItem } from 'services/characterSheet'
import { updateAt } from '../utils'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { ItemDialog } from './ItemDialog'
import { NumberField } from './NumberField'
import { Section } from './Section'

export function InventoryList({
  inventory,
  overflow,
  limit,
  colorPalette = 'gray',
  onChange,
}: {
  inventory: InventoryItem[]
  overflow: InventoryItem[]
  limit: number
  colorPalette?: string
  onChange: (inventory: InventoryItem[], overflow: InventoryItem[]) => void
}) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<{
    list: 'inventory' | 'overflow'
    index: number
  } | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftQuantity, setDraftQuantity] = useState<number | null>(null)

  function openCreateDialog() {
    setEditingItem(null)
    setDraftTitle('')
    setDraftQuantity(1)
    setDialogOpen(true)
  }

  function openEditDialog(
    list: 'inventory' | 'overflow',
    index: number,
    item: InventoryItem,
  ) {
    setEditingItem({ list, index })
    setDraftTitle(item.title)
    setDraftQuantity(item.quantity)
    setDialogOpen(true)
  }

  function submitItem() {
    const title = draftTitle.trim()
    if (!title || draftQuantity === null || draftQuantity < 1) {
      return false
    }

    const item = { title, quantity: draftQuantity }
    const nextInventory =
      editingItem === null
        ? [...inventory, item]
        : editingItem.list === 'inventory'
          ? updateAt(inventory, editingItem.index, item)
          : inventory
    const nextOverflow =
      editingItem?.list === 'overflow'
        ? updateAt(overflow, editingItem.index, item)
        : overflow
    onChange(nextInventory, nextOverflow)
    setDraftTitle('')
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
      {inventory.map((item, index) => (
        <Group
          key={index}
          w="full"
          display="grid"
          gridTemplateColumns="1fr auto auto"
          alignItems="center"
        >
          <Text minW="0" overflowWrap="anywhere">
            {item.title}
          </Text>
          <Text>{item.quantity}</Text>
          <Box display="flex" gap="2">
            <IconButton
              variant="outline"
              aria-label={t('sheet.editInventoryItem', {
                number: index + 1,
              })}
              onClick={() => openEditDialog('inventory', index, item)}
            >
              <LuPencil />
            </IconButton>
            <ConfirmDeleteButton
              description={t('sheet.itemDescription', { name: item.title })}
              colorPalette={colorPalette}
              onConfirm={() =>
                onChange(
                  inventory.filter((_, itemIndex) => itemIndex !== index),
                  overflow,
                )
              }
            />
          </Box>
        </Group>
      ))}
      {overflow.length > 0 && (
        <Box
          borderWidth="1px"
          borderRadius="md"
          padding="3"
          gridColumn="1 / -1"
        >
          <Text fontWeight="semibold">
            {t('sheet.sections.transferredItems')}
          </Text>
          <Text fontSize="sm" color="fg.muted" marginBottom="2">
            {t('sheet.transferredCapacity')}
          </Text>
          {overflow.map((item, index) => (
            <Box
              key={index}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap="2"
            >
              <Text>
                {item.title} × {item.quantity}
              </Text>
              <Box display="flex" gap="2">
                <IconButton
                  variant="outline"
                  aria-label={t('sheet.editTransferredItem', {
                    number: index + 1,
                  })}
                  onClick={() => openEditDialog('overflow', index, item)}
                >
                  <LuPencil />
                </IconButton>
                <Button
                  variant="outline"
                  disabled={inventory.length >= limit}
                  onClick={() =>
                    onChange(
                      [...inventory, item],
                      overflow.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  {t('form.add')}
                </Button>
                <ConfirmDeleteButton
                  description={t('sheet.transferredItemDescription', {
                    name: item.title,
                  })}
                  colorPalette={colorPalette}
                  onConfirm={() =>
                    onChange(
                      inventory,
                      overflow.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}
      {inventory.length < limit && (
        <Button
          variant="outline"
          gridColumn="1 / -1"
          onClick={openCreateDialog}
        >
          {t('form.addItem')}
        </Button>
      )}
      <ItemDialog
        title={editingItem === null ? t('form.addItem') : t('form.editItem')}
        submitLabel={editingItem === null ? t('form.add') : t('form.save')}
        open={dialogOpen}
        canSubmit={draftTitle.trim().length > 0 && (draftQuantity ?? 0) > 0}
        colorPalette={colorPalette}
        onOpenChange={setDialogOpen}
        onSubmit={submitItem}
      >
        <Field.Root>
          <Field.Label>{t('sheet.fields.itemName')}</Field.Label>
          <Input
            aria-label={t('sheet.fields.itemName')}
            placeholder={t('sheet.itemExample')}
            value={draftTitle}
            onChange={event => setDraftTitle(event.target.value)}
          />
        </Field.Root>
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

export function StringList({
  title,
  values,
  limit,
  colorPalette = 'gray',
  onChange,
}: {
  title: string
  values: string[]
  limit: number
  colorPalette?: string
  onChange: (values: string[]) => void
}) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draftValue, setDraftValue] = useState('')

  function openCreateDialog() {
    setEditingIndex(null)
    setDraftValue('')
    setDialogOpen(true)
  }

  function openEditDialog(index: number, value: string) {
    setEditingIndex(index)
    setDraftValue(value)
    setDialogOpen(true)
  }

  function submitValue() {
    const value = draftValue.trim()
    if (!value) {
      return false
    }
    onChange(
      editingIndex === null
        ? [...values, value]
        : updateAt(values, editingIndex, value),
    )
    setDraftValue('')
  }

  return (
    <Section
      title={t('sheet.amount', {
        title,
        current: values.length,
        limit,
      })}
    >
      {values.map((value, index) => (
        <Group
          key={index}
          w="full"
          display="grid"
          gridTemplateColumns="1fr auto auto"
          alignItems="center"
        >
          <Text minW="0" overflowWrap="anywhere">
            {value}
          </Text>
          <IconButton
            variant="outline"
            aria-label={t('sheet.editInventoryItem', {
              number: index + 1,
            })}
            onClick={() => openEditDialog(index, value)}
          >
            <LuPencil />
          </IconButton>
          <ConfirmDeleteButton
            description={t('sheet.itemDescription', { name: value })}
            colorPalette={colorPalette}
            onConfirm={() =>
              onChange(values.filter((_, valueIndex) => valueIndex !== index))
            }
          />
        </Group>
      ))}
      {values.length < limit && (
        <Button variant="outline" onClick={openCreateDialog}>
          {t('form.addItem')}
        </Button>
      )}
      <ItemDialog
        title={editingIndex === null ? t('form.addItem') : t('form.editItem')}
        submitLabel={editingIndex === null ? t('form.add') : t('form.save')}
        open={dialogOpen}
        canSubmit={draftValue.trim().length > 0}
        colorPalette={colorPalette}
        onOpenChange={setDialogOpen}
        onSubmit={submitValue}
      >
        <Field.Root>
          <Field.Label>{t('sheet.fields.itemName')}</Field.Label>
          <Input
            aria-label={t('sheet.fields.itemName')}
            placeholder={t('sheet.itemExample')}
            value={draftValue}
            onChange={event => setDraftValue(event.target.value)}
          />
        </Field.Root>
      </ItemDialog>
    </Section>
  )
}
