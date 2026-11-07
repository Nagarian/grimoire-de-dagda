import { Box, Button, Input, Text } from '@chakra-ui/react'
import type { InventoryItem } from 'services/characterSheet'
import { NumberField, Section } from './CharacterSheetFields'
import { parseInteger, updateAt } from './utils'

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
    <Section title={`Inventaire (${inventory.length}/${limit})`}>
      {inventory.map((item, index) => (
        <Box
          key={index}
          display="grid"
          gridTemplateColumns={{ base: '1fr 6rem auto', sm: '1fr 6rem auto' }}
          gap="2"
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
          <Button
            variant="outline"
            onClick={() =>
              onChange(
                inventory.filter((_, itemIndex) => itemIndex !== index),
                overflow,
              )
            }
          >
            Retirer
          </Button>
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
        </Box>
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
                <Button
                  variant="outline"
                  onClick={() =>
                    onChange(
                      inventory,
                      overflow.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  Retirer
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}
      <Button
        variant="outline"
        alignSelf="flex-start"
        disabled={inventory.length >= limit}
        onClick={() =>
          onChange(
            [
              ...inventory,
              { title: `Objet ${inventory.length + 1}`, quantity: 1 },
            ],
            overflow,
          )
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
        <Box key={index} display="flex" gap="2">
          <Input
            aria-label={`${title} ${index + 1}`}
            value={value}
            onChange={event =>
              onChange(updateAt(values, index, event.target.value))
            }
          />
          <Button
            variant="outline"
            onClick={() => onChange(values.filter((_, i) => i !== index))}
          >
            Retirer
          </Button>
        </Box>
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
