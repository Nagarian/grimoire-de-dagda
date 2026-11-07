import { Button, Group, IconButton, Input } from '@chakra-ui/react'
import { LuTrash2 } from 'react-icons/lu'
import { updateAt } from '../utils'
import { NumberField } from './NumberField'
import { Section } from './Section'

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
        <Group
          key={index}
          display="grid"
          gridTemplateColumns="1fr auto auto"
          w="full"
          attached
          alignItems="center"
        >
          <Input
            aria-label={`${label} ${index + 1}`}
            minW="0"
            value={getName(skill)}
            onChange={event =>
              onChange(
                updateAt(skills, index, updateName(skill, event.target.value)),
              )
            }
          />
          {getLevel && updateLevel && (
            <NumberField
              value={getLevel(skill)}
              min={1}
              width="fit-content"
              onChange={level =>
                onChange(
                  updateAt(skills, index, updateLevel(skill, level ?? 1)),
                )
              }
            />
          )}
          <IconButton
            variant="outline"
            onClick={() =>
              onChange(skills.filter((_, skillIndex) => skillIndex !== index))
            }
            aria-label="Retirer"
          >
            <LuTrash2 />
          </IconButton>
        </Group>
      ))}
      {(limit === undefined || skills.length < limit) && (
        <Button
          variant="outline"
          alignSelf="flex-start"
          onClick={() => onChange([...skills, createSkill()])}
        >
          Ajouter un talent
        </Button>
      )}
    </Section>
  )
}
