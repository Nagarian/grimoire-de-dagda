import { Button, Group, IconButton, Input } from '@chakra-ui/react'
import { LuTrash2 } from 'react-icons/lu'
import type { Weapon } from 'services/characterSheet'
import { updateAt } from '../utils'
import { Section } from './Section'

export function WeaponList({
  weapons,
  onChange,
}: {
  weapons: Weapon[]
  onChange: (weapons: Weapon[]) => void
}) {
  return (
    <Section title="Armes">
      {weapons.map((weapon, index) => (
        <Group key={index} display="flex" w="full" attached>
          <Input
            aria-label={`Nom de l’arme ${index + 1}`}
            value={weapon.name}
            onChange={event =>
              onChange(
                updateAt(weapons, index, {
                  ...weapon,
                  name: event.target.value,
                }),
              )
            }
          />
          <Input
            aria-label={`Bonus de l’arme ${index + 1}`}
            value={weapon.bonus}
            onChange={event =>
              onChange(
                updateAt(weapons, index, {
                  ...weapon,
                  bonus: event.target.value,
                }),
              )
            }
          />
          <IconButton
            variant="outline"
            onClick={() => onChange(weapons.filter((_, i) => i !== index))}
            aria-label="Retirer"
          >
            <LuTrash2 />
          </IconButton>
        </Group>
      ))}
      <Button
        variant="outline"
        alignSelf="flex-start"
        onClick={() =>
          onChange([...weapons, { name: 'Nouvelle arme', bonus: '' }])
        }
      >
        Ajouter une arme
      </Button>
    </Section>
  )
}
