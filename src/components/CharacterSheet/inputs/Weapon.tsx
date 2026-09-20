import { Field, Input } from '@chakra-ui/react'

export const InputWeaponId = 'weapons'

export function InputWeapon() {
  return (
    <Field.Root gridArea={InputWeaponId}>
      <Field.Label>Armes</Field.Label>
      <Input type="number" />
    </Field.Root>
  )
}
