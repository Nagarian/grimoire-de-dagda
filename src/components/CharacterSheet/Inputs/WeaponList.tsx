import { Box, Button, Field, Group, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
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
    <Section title="Armes">
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
            description={`l’arme ${weapon.name}`}
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
        Ajouter une arme
      </Button>
      <ItemDialog
        title="Ajouter une arme"
        submitLabel="Ajouter"
        open={dialogOpen}
        canSubmit={name.trim().length > 0}
        colorPalette={colorPalette}
        onOpenChange={setDialogOpen}
        onSubmit={submitWeapon}
      >
        <Field.Root>
          <Field.Label>Nom de l’arme</Field.Label>
          <Input
            aria-label="Nom de l’arme"
            placeholder="Nom de l’arme"
            value={name}
            onChange={event => setName(event.target.value)}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Bonus</Field.Label>
          <Input
            aria-label="Bonus"
            placeholder="Bonus éventuel"
            value={bonus}
            onChange={event => setBonus(event.target.value)}
          />
        </Field.Root>
      </ItemDialog>
    </Section>
  )
}
