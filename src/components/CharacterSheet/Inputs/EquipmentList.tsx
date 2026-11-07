import { Button, Group, IconButton, Input } from '@chakra-ui/react'
import { LuTrash2 } from 'react-icons/lu'
import type { Equipment } from 'services/characterSheet'
import { updateAt } from '../utils'
import { Section } from './Section'

export function EquipmentList({
  title,
  items,
  limit,
  onChange,
}: {
  title: string
  items: Equipment[]
  limit?: number
  onChange: (items: Equipment[]) => void
}) {
  return (
    <Section title={title}>
      {items.map((item, index) => (
        <Group
          key={index}
          display="grid"
          gridTemplateColumns={{ base: '1fr', sm: '1fr 1fr auto' }}
          w="full"
          attached
        >
          <Input
            aria-label={`Nom ${title.toLowerCase()} ${index + 1}`}
            value={item.name}
            onChange={event =>
              onChange(
                updateAt(items, index, { ...item, name: event.target.value }),
              )
            }
          />
          <Input
            aria-label={`Effet ${title.toLowerCase()} ${index + 1}`}
            value={item.effect}
            onChange={event =>
              onChange(
                updateAt(items, index, { ...item, effect: event.target.value }),
              )
            }
          />

          <IconButton
            variant="outline"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            aria-label="Retirer"
          >
            <LuTrash2 />
          </IconButton>
        </Group>
      ))}
      {(limit === undefined || items.length < limit) && (
        <Button
          variant="outline"
          alignSelf="flex-start"
          onClick={() =>
            onChange([...items, { name: 'Nouvel élément', effect: '' }])
          }
        >
          Ajouter
        </Button>
      )}
    </Section>
  )
}
