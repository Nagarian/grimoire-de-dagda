import { Box, Button, Field, Group, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Equipment } from 'services/characterSheet'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { ItemDialog } from './ItemDialog'
import { Section } from './Section'

export function EquipmentList({
  title,
  itemType,
  items,
  limit,
  colorPalette = 'gray',
  onChange,
}: {
  title: string
  itemType: 'weapon' | 'protection'
  items: Equipment[]
  limit?: number
  colorPalette?: string
  onChange: (items: Equipment[]) => void
}) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [effect, setEffect] = useState('')
  const itemLabel =
    itemType === 'weapon'
      ? t('sheet.fields.weaponName')
      : t('sheet.fields.protectionName')

  function submitItem() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return false
    }
    onChange([...items, { name: trimmedName, effect: effect.trim() }])
    setName('')
    setEffect('')
  }

  return (
    <Section title={title}>
      {items.map((item, index) => (
        <Group
          key={index}
          display="flex"
          w="full"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box minW="0">
            <Text overflowWrap="anywhere">{item.name}</Text>
            {item.effect && (
              <Text fontSize="sm" color="fg.muted">
                {item.effect}
              </Text>
            )}
          </Box>
          <ConfirmDeleteButton
            description={t('form.removeEquipment', {
              type:
                itemType === 'weapon'
                  ? t('sheet.fields.weapon')
                  : t('sheet.fields.protection'),
              name: item.name,
            })}
            colorPalette={colorPalette}
            onConfirm={() =>
              onChange(items.filter((_, itemIndex) => itemIndex !== index))
            }
          />
        </Group>
      ))}
      {(limit === undefined || items.length < limit) && (
        <Button
          variant="outline"
          alignSelf="flex-start"
          onClick={() => {
            setName('')
            setEffect('')
            setDialogOpen(true)
          }}
        >
          {t('form.add')}
        </Button>
      )}
      <ItemDialog
        title={
          itemType === 'weapon' ? t('form.addWeapon') : t('form.addProtection')
        }
        submitLabel={t('form.add')}
        open={dialogOpen}
        canSubmit={name.trim().length > 0}
        colorPalette={colorPalette}
        onOpenChange={setDialogOpen}
        onSubmit={submitItem}
      >
        <Field.Root>
          <Field.Label>{t('form.name')}</Field.Label>
          <Input
            aria-label={t('form.name')}
            placeholder={itemLabel}
            value={name}
            onChange={event => setName(event.target.value)}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>{t('sheet.fields.effect')}</Field.Label>
          <Input
            aria-label={t('sheet.fields.effect')}
            placeholder={t('sheet.optionalEffect')}
            value={effect}
            onChange={event => setEffect(event.target.value)}
          />
        </Field.Root>
      </ItemDialog>
    </Section>
  )
}
