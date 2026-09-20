import { Field, Input } from '@chakra-ui/react'

export const InputCurrentLifeId = 'currentLife'

export function InputCurrentLife() {
  return (
    <Field.Root gridArea={InputCurrentLifeId}>
      <Field.Label>Points de vie actuels</Field.Label>
      <Input type="number" />
    </Field.Root>
  )
}
