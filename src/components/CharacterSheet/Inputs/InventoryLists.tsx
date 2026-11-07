import { Box, Button, Group, IconButton, Input, Text } from '@chakra-ui/react'
import type { InventoryItem } from 'services/characterSheet'
import { Section } from './Section'
import { NumberField } from './NumberField'
import { parseInteger, updateAt } from '../utils'
import { LuTrash2 } from 'react-icons/lu'

function createInventoryItem(inventory: InventoryItem[]): InventoryItem {
  const titles = new Set(
    inventory.map(item => item.title.trim().toLocaleLowerCase()),
  )
  let number = 1
  let title = `Objet ${number}`

  while (titles.has(title.toLocaleLowerCase())) {
    number += 1
    title = `Objet ${number}`
  }

  return { title, quantity: 1 }
}

export function InventoryList({
  inventory,
  overflow,
  limit,
  showBourse = false,
  onChange,
}: {
  inventory: InventoryItem[]
  overflow: InventoryItem[]
  limit: number
  showBourse?: boolean
  onChange: (inventory: InventoryItem[], overflow: InventoryItem[]) => void
}) {
  return (
    <Section title={`Inventaire (${inventory.length}/${limit})`} columns={2}>
      {inventory.map((item, index) => (
        <Group
          key={index}
          w="full"
          attached
          display="grid"
          gridTemplateColumns={{ base: '1fr 6rem auto', sm: '1fr 6rem auto' }}
          alignItems="center"
        >
          <Input
            aria-label={`Objet ${index + 1}`}
            value={item.title}
            onChange={event =>
              onChange(
                updateAt(inventory, index, {
                  ...item,
                  title: event.target.value,
                }),
                overflow,
              )
            }
          />
          <Input
            aria-label={`Quantité de ${item.title}`}
            type="number"
            min="1"
            step="1"
            value={item.quantity}
            onChange={event => {
              const quantity = parseInteger(event.target.value)
              if (quantity !== null && quantity > 0) {
                onChange(
                  updateAt(inventory, index, { ...item, quantity }),
                  overflow,
                )
              }
            }}
          />
          <IconButton
            variant="outline"
            onClick={() =>
              onChange(
                inventory.filter((_, itemIndex) => itemIndex !== index),
                overflow,
              )
            }
            aria-label="Retirer"
          >
            <LuTrash2 />
          </IconButton>
          {showBourse && item.title.trim().toLocaleLowerCase() === 'bourse' && (
            <Box gridColumn="1 / -1">
              <NumberField
                label="Boulons dans la bourse"
                value={item.boulons ?? null}
                onChange={boulons =>
                  onChange(
                    updateAt(inventory, index, { ...item, boulons }),
                    overflow,
                  )
                }
              />
            </Box>
          )}
        </Group>
      ))}
      {overflow.length > 0 && (
        <Box borderWidth="1px" borderRadius="md" padding="3">
          <Text fontWeight="semibold">Objets transférés à replacer</Text>
          <Text fontSize="sm" color="fg.muted" marginBottom="2">
            Ces objets dépassent la capacité de ce tome et ne comptent pas dans
            l’inventaire tant qu’ils ne sont pas replacés.
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
                  Ajouter
                </Button>
                <IconButton
                  variant="outline"
                  onClick={() =>
                    onChange(
                      inventory,
                      overflow.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  aria-label="Retirer"
                >
                  <LuTrash2 />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}
      <Button
        variant="outline"
        gridColumn="1 / -1"
        disabled={inventory.length >= limit}
        onClick={() =>
          onChange([...inventory, createInventoryItem(inventory)], overflow)
        }
      >
        Ajouter un objet
      </Button>
    </Section>
  )
}

export function StringList({
  title,
  values,
  limit,
  onChange,
}: {
  title: string
  values: string[]
  limit: number
  onChange: (values: string[]) => void
}) {
  return (
    <Section title={`${title} (${values.length}/${limit})`}>
      {values.map((value, index) => (
        <Group key={index} w="full" attached>
          <Input
            aria-label={`${title} ${index + 1}`}
            value={value}
            onChange={event =>
              onChange(updateAt(values, index, event.target.value))
            }
          />
          <IconButton
            variant="outline"
            onClick={() => onChange(values.filter((_, i) => i !== index))}
            aria-label="Retirer"
          >
            <LuTrash2 />
          </IconButton>
        </Group>
      ))}
      <Button
        variant="outline"
        alignSelf="flex-start"
        disabled={values.length >= limit}
        onClick={() => onChange([...values, `Objet ${values.length + 1}`])}
      >
        Ajouter un objet
      </Button>
    </Section>
  )
}
