import { Box, Button, Field, Group, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Weapon } from 'services/characterSheet'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { ItemDialog } from './ItemDialog'
import { Section } from './Section'

export function WeaponList({
  weapons,
  colorPalette = 'gray',
  onChange,
}: {
  weapons: Weapon[]
  colorPalette?: string
  onChange: (weapons: Weapon[]) => void
}) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [bonus, setBonus] = useState('')

  function submitWeapon() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return false
    }

    const weapon = { name: trimmedName, bonus: bonus.trim() }
    onChange([...weapons, weapon])
    setName('')
    setBonus('')
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
            <Text overflowWrap="anywhere">{weapon.name}</Text>
            {weapon.bonus && (
              <Text fontSize="sm" color="fg.muted">
                {weapon.bonus}
              </Text>
            )}
          </Box>
          <ConfirmDeleteButton
            description={t('form.removeWeapon', { name: weapon.name })}
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
          setBonus('')
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
        <Field.Root>
          <Field.Label>{t('sheet.fields.weaponName')}</Field.Label>
          <Input
            aria-label={t('sheet.fields.weaponName')}
            placeholder={t('sheet.fields.weaponName')}
            value={name}
            onChange={event => setName(event.target.value)}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>{t('sheet.fields.bonus')}</Field.Label>
          <Input
            aria-label={t('sheet.fields.bonus')}
            placeholder={t('sheet.optionalBonus')}
            value={bonus}
            onChange={event => setBonus(event.target.value)}
          />
        </Field.Root>
      </ItemDialog>
    </Section>
  )
}
