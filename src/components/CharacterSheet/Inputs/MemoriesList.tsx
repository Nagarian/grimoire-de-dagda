import { Button, Group, IconButton, Input } from '@chakra-ui/react'
import { useState } from 'react'
import { LuArrowDownAZ, LuTrash2 } from 'react-icons/lu'
import { Section } from './Section'

export function MemoriesList({
  memories,
  onChange,
}: {
  memories: string[]
  onChange: (memories: string[]) => void
}) {
  const [sortMemories, setSortMemories] = useState(false)
  const displayedMemories = memories
    .map((memory, index) => ({ memory, index }))
    .sort((left, right) =>
      sortMemories
        ? left.memory.localeCompare(right.memory)
        : left.index - right.index,
    )

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
          onClick={() => setSortMemories(value => !value)}
        >
          <LuArrowDownAZ />
        </IconButton>
      }
    >
      {displayedMemories.map(({ memory, index }) => (
        <Group key={index} w="full" attached>
          <Input
            aria-label={`Souvenir ${index + 1}`}
            value={memory}
            onChange={event => {
              const next = [...memories]
              next[index] = event.target.value
              onChange(next)
            }}
          />
          <IconButton
            variant="outline"
            size="sm"
            onClick={() =>
              onChange(
                memories.filter((_, memoryIndex) => memoryIndex !== index),
              )
            }
            aria-label="Retirer"
          >
            <LuTrash2 />
          </IconButton>
        </Group>
      ))}
      <Button
        variant="outline"
        alignSelf="flex-start"
        onClick={() => onChange([...memories, 'Nouvelle souvenir'])}
      >
        Ajouter une souvenir
      </Button>
    </Section>
  )
}
