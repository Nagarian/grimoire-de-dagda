import { Field, Input } from '@chakra-ui/react'

export const InputDexterityId = 'dexterity'

export function InputDexterity() {
  return (
    <Field.Root gridArea={InputDexterityId} flexDirection="row" alignItems="center">
      <Field.Label>Dextérité</Field.Label>
      <Input type="number" />
    </Field.Root>
  )
}
