import { Field, Input } from '@chakra-ui/react'

export const InputSavepointId = 'savepoint'

export function InputSavepoint() {
  return (
    <Field.Root gridArea={InputSavepointId} flexDirection="row" alignItems="center">
      <Field.Label>Sauvegarde</Field.Label>
      <Input type="number" />
    </Field.Root>
  )
}
