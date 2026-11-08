import { Button, Field, Group, IconButton, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { LuArrowDownAZ } from 'react-icons/lu'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { ItemDialog } from './ItemDialog'
import { Section } from './Section'

export function MemoriesList({
  memories,
  sortMemories,
  onSortChange,
  colorPalette = 'gray',
  onChange,
}: {
  memories: string[]
  sortMemories: boolean
  onSortChange: (sortMemories: boolean) => void
  colorPalette?: string
  onChange: (memories: string[]) => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newMemory, setNewMemory] = useState('')
  const displayedMemories = memories
    .map((memory, index) => ({ memory, index }))
    .sort((left, right) =>
      sortMemories
        ? left.memory.localeCompare(right.memory)
        : left.index - right.index,
    )

  function submitMemory() {
    const memory = newMemory.trim()
    if (!memory) {
      return false
    }
    onChange([...memories, memory])
    setNewMemory('')
  }

  return (
    <Section
      title="Souvenirs"
      headerAction={
        <IconButton
          aria-label={
            sortMemories ? 'Afficher dans l’ordre enregistré' : 'Trier par nom'
          }
          variant="ghost"
          size="sm"
          onClick={() => onSortChange(!sortMemories)}
        >
          <LuArrowDownAZ />
        </IconButton>
      }
    >
      {displayedMemories.map(({ memory, index }) => (
        <Group
          key={index}
          w="full"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text minW="0" overflowWrap="anywhere">
            {memory}
          </Text>
          <ConfirmDeleteButton
            description={`le souvenir ${memory}`}
            colorPalette={colorPalette}
            onConfirm={() =>
              onChange(
                memories.filter((_, memoryIndex) => memoryIndex !== index),
              )
            }
          />
        </Group>
      ))}
      <Button
        variant="outline"
        alignSelf="flex-start"
        onClick={() => {
          setNewMemory('')
          setDialogOpen(true)
        }}
      >
        Ajouter un souvenir
      </Button>
      <ItemDialog
        title="Ajouter un souvenir"
        submitLabel="Ajouter"
        open={dialogOpen}
        canSubmit={newMemory.trim().length > 0}
        colorPalette={colorPalette}
        onOpenChange={setDialogOpen}
        onSubmit={submitMemory}
      >
        <Field.Root>
          <Field.Label>Souvenir</Field.Label>
          <Input
            aria-label="Souvenir"
            placeholder="Décrivez le souvenir"
            value={newMemory}
            onChange={event => setNewMemory(event.target.value)}
          />
        </Field.Root>
      </ItemDialog>
    </Section>
  )
}
