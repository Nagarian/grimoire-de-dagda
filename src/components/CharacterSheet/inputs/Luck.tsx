import { Field, Input } from '@chakra-ui/react'

export const InputLuckId = 'luck'

export function InputLuck() {
  return (
    <Field.Root gridArea={InputLuckId} flexDirection="row" alignItems="center">
      <Field.Label>Chance</Field.Label>
      <Input type="number" />
    </Field.Root>
  )
}
