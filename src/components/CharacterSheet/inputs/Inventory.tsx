import { Field, Input } from '@chakra-ui/react'

export const InputInventoryId = 'inventory'

export function InputInventory() {
  return (
    <Field.Root gridArea={InputInventoryId}>
      <Field.Label>Inventaire</Field.Label>
      <Input type="number" />
    </Field.Root>
  )
}
