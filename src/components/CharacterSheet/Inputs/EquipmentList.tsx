import { Box, Button, Field, Group, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import type { Equipment } from 'services/characterSheet'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { ItemDialog } from './ItemDialog'
import { Section } from './Section'

export function EquipmentList({
  title,
  items,
  limit,
  colorPalette = 'gray',
  onChange,
}: {
  title: string
  items: Equipment[]
  limit?: number
  colorPalette?: string
  onChange: (items: Equipment[]) => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [effect, setEffect] = useState('')
  const itemName = title === 'Armes' ? 'l’arme' : 'la protection'

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
            description={`${title.toLocaleLowerCase()} ${item.name}`}
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
          Ajouter
        </Button>
      )}
      <ItemDialog
        title={
          title === 'Armes' ? 'Ajouter une arme' : 'Ajouter une protection'
        }
        submitLabel="Ajouter"
        open={dialogOpen}
        canSubmit={name.trim().length > 0}
        colorPalette={colorPalette}
        onOpenChange={setDialogOpen}
        onSubmit={submitItem}
      >
        <Field.Root>
          <Field.Label>Nom</Field.Label>
          <Input
            aria-label="Nom"
            placeholder={`Nom de ${itemName}`}
            value={name}
            onChange={event => setName(event.target.value)}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Effet</Field.Label>
          <Input
            aria-label="Effet"
            placeholder="Effet éventuel"
            value={effect}
            onChange={event => setEffect(event.target.value)}
          />
        </Field.Root>
      </ItemDialog>
    </Section>
  )
}
