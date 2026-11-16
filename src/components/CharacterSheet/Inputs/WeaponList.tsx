import { Box, Button, Field, Group, Input, Text } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ItemBookId, ItemId } from 'data/items'
import type { InventoryItem } from 'services/characterSheet'
import {
  addInventoryItem,
  getInventoryItemEffect,
  getInventoryItemName,
} from 'services/characterSheet'
import { getManualItemSuggestions } from 'services/itemCatalog'
import { CatalogItemCombobox } from './CatalogItemCombobox'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { ItemDialog } from './ItemDialog'
import { Section } from './Section'

export function WeaponList({
  bookId,
  weapons,
  colorPalette = 'gray',
  onChange,
}: {
  bookId: ItemBookId
  weapons: InventoryItem[]
  colorPalette?: string
  onChange: (weapons: InventoryItem[]) => void
}) {
  const { t, i18n } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [itemId, setItemId] = useState<ItemId | undefined>()
  const [effect, setEffect] = useState('')
  const suggestions = useMemo(
    () => getManualItemSuggestions(bookId, 'weapon', i18n.resolvedLanguage),
    [bookId, i18n.resolvedLanguage],
  )

  function submitWeapon() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return false
    }

    const weapon: InventoryItem = itemId
      ? { id: itemId, quantity: 1 }
      : {
          name: trimmedName,
          quantity: 1,
          ...(effect.trim() && { effect: effect.trim() }),
        }
    onChange(addInventoryItem(weapons, weapon))
    setName('')
    setItemId(undefined)
    setEffect('')
  }

  return (
    <Section title={t('sheet.sections.weapons')}>
      {weapons.map((weapon, index) => (
        <Group
          key={index}
          display="flex"
          w="full"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box minW="0">
            <Text overflowWrap="anywhere">{getInventoryItemName(weapon)}</Text>
            {getInventoryItemEffect(weapon) && (
              <Text fontSize="sm" color="fg.muted">
                {getInventoryItemEffect(weapon)}
              </Text>
            )}
          </Box>
          <ConfirmDeleteButton
            description={t('form.removeWeapon', {
              name: getInventoryItemName(weapon),
            })}
            colorPalette={colorPalette}
            onConfirm={() =>
              onChange(
                weapons.filter((_, weaponIndex) => weaponIndex !== index),
              )
            }
          />
        </Group>
      ))}
      <Button
        variant="outline"
        alignSelf="flex-start"
        onClick={() => {
          setName('')
          setItemId(undefined)
          setEffect('')
          setDialogOpen(true)
        }}
      >
        {t('form.addWeapon')}
      </Button>
      <ItemDialog
        title={t('form.addWeapon')}
        submitLabel={t('form.add')}
        open={dialogOpen}
        canSubmit={name.trim().length > 0}
        colorPalette={colorPalette}
        onOpenChange={setDialogOpen}
        onSubmit={submitWeapon}
      >
        <CatalogItemCombobox
          colorPalette={colorPalette}
          items={suggestions}
          label={t('sheet.fields.weaponName')}
          placeholder={t('sheet.fields.weaponName')}
          inputValue={name}
          selectedItemId={itemId}
          onInputValueChange={nextName => {
            const suggestion = suggestions.find(
              item =>
                item.name.toLocaleLowerCase() === nextName.toLocaleLowerCase(),
            )
            setName(nextName)
            setItemId(suggestion?.id)
            setEffect('')
          }}
          onItemSelect={item => {
            setName(item.name)
            setItemId(item.id)
            setEffect('')
          }}
        />
        {itemId ? (
          <Text fontSize="sm" color="fg.muted">
            {suggestions.find(item => item.id === itemId)?.effect}
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
    </Section>
  )
}
