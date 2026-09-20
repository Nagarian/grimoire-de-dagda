import { Field, Input } from '@chakra-ui/react'

export const InputSkillId = 'skills'

export function InputSkill() {
  return (
    <Field.Root gridArea={InputSkillId} flexDirection="row" alignItems="center">
      <Field.Label>Talent</Field.Label>
      <Input type="number" />
    </Field.Root>
  )
}
