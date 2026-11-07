import { Box, Button, Input, Text } from '@chakra-ui/react'
import type { ChapterId } from 'services/chapterDsl'
import type { Equipment, T01Savepoint, Weapon } from 'services/characterSheet'
import { NumberField, Section } from './CharacterSheetFields'
import type { SavepointContext } from './types'
import { updateAt } from './utils'

export function Savepoints({
  savepoints,
  context,
  onSave,
  onRestore,
}: {
  savepoints: (T01Savepoint | null)[]
  context?: SavepointContext
  onSave: (
    markerChapterId: ChapterId,
    resumeChapterId: ChapterId,
    slotIndex: number,
  ) => boolean
  onRestore: (slotIndex: number) => boolean
}) {
  return (
    <Section title="Sauvegardes">
      {context ? (
        <Box display="flex" flexDirection="column" gap="2">
          <Text fontSize="sm" color="fg.muted">
            Cette sauvegarde reprendra au chapitre{' '}
            {context.resumeChapterId.replace('T01-', '')}.
          </Text>
          {Array.from({ length: 3 }, (_, slotIndex) => {
            const occupied = Boolean(savepoints[slotIndex])
            return (
              <Button
                key={slotIndex}
                variant="outline"
                onClick={() => {
                  if (
                    occupied &&
                    !window.confirm(
                      `Remplacer la sauvegarde ${slotIndex + 1} ?`,
                    )
                  ) {
                    return
                  }
                  onSave(
                    context.markerChapterId,
                    context.resumeChapterId,
                    slotIndex,
                  )
                }}
              >
                {occupied
                  ? `Remplacer la sauvegarde ${slotIndex + 1}`
                  : `Enregistrer dans l’emplacement ${slotIndex + 1}`}
              </Button>
            )
          })}
        </Box>
      ) : (
        <Text fontSize="sm" color="fg.muted">
          Vous pouvez créer une sauvegarde depuis la lecture du tome 1.
        </Text>
      )}
      {savepoints.flatMap((savepoint, index) =>
        savepoint
          ? [
              <Box
                key={`${savepoint.markerChapterId}-${index}`}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap="3"
                borderWidth="1px"
                borderRadius="md"
                padding="3"
              >
                <Text>
                  Sauvegarde {index + 1} — chapitre{' '}
                  {savepoint.markerChapterId.replace('T01-', '')}, reprise au{' '}
                  {savepoint.resumeChapterId.replace('T01-', '')}
                </Text>
                <Button variant="outline" onClick={() => onRestore(index)}>
                  Restaurer
                </Button>
              </Box>,
            ]
          : [],
      )}
    </Section>
  )
}

export function SkillList<T>({
  label,
  skills,
  limit,
  getName,
  updateName,
  createSkill,
  getLevel,
  updateLevel,
  onChange,
}: {
  label: string
  skills: T[]
  limit?: number
  getName: (skill: T) => string
  updateName: (skill: T, name: string) => T
  createSkill: () => T
  getLevel?: (skill: T) => number
  updateLevel?: (skill: T, level: number) => T
  onChange: (skills: T[]) => void
}) {
  return (
    <Section title={label}>
      {skills.map((skill, index) => (
        <Box key={index} display="flex" gap="2" alignItems="center">
          <Input
            aria-label={`${label} ${index + 1}`}
            value={getName(skill)}
            onChange={event =>
              onChange(
                updateAt(skills, index, updateName(skill, event.target.value)),
              )
            }
          />
          {getLevel && updateLevel && (
            <NumberField
              label={`Niveau du talent ${index + 1}`}
              value={getLevel(skill)}
              min={1}
              onChange={level =>
                onChange(
                  updateAt(skills, index, updateLevel(skill, level ?? 1)),
                )
              }
            />
          )}
          <Button
            variant="outline"
            onClick={() =>
              onChange(skills.filter((_, skillIndex) => skillIndex !== index))
            }
          >
            Retirer
          </Button>
        </Box>
      ))}
      {limit === undefined || skills.length < limit ? (
        <Button
          variant="outline"
          alignSelf="flex-start"
          onClick={() => onChange([...skills, createSkill()])}
        >
          Ajouter un talent
        </Button>
      ) : (
        <Text fontSize="sm" color="fg.muted">
          Maximum : {limit}.
        </Text>
      )}
    </Section>
  )
}

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
        <Box
          key={index}
          display="grid"
          gridTemplateColumns={{ base: '1fr', sm: '1fr 1fr auto' }}
          gap="2"
        >
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
          <Button
            variant="outline"
            onClick={() => onChange(weapons.filter((_, i) => i !== index))}
          >
            Retirer
          </Button>
        </Box>
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
        <Box
          key={index}
          display="grid"
          gridTemplateColumns={{ base: '1fr', sm: '1fr 1fr auto' }}
          gap="2"
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
          <Button
            variant="outline"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Retirer
          </Button>
        </Box>
      ))}
      {limit === undefined || items.length < limit ? (
        <Button
          variant="outline"
          alignSelf="flex-start"
          onClick={() =>
            onChange([...items, { name: 'Nouvel élément', effect: '' }])
          }
        >
          Ajouter
        </Button>
      ) : (
        <Text fontSize="sm" color="fg.muted">
          Maximum : {limit}.
        </Text>
      )}
    </Section>
  )
}
