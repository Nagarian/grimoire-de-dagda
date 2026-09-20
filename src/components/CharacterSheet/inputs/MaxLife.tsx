import { Field, Input } from '@chakra-ui/react'

export const InputMaxLifeId = 'maxLife'

export function InputMaxLife() {
  return (
    <Field.Root gridArea={InputMaxLifeId}>
      <Field.Label>Points de vie maximum</Field.Label>
      <Input type="number" />
    </Field.Root>
  )
}
