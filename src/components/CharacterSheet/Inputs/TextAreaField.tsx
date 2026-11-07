import { Field, Textarea } from '@chakra-ui/react'

export function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Textarea
        aria-label={label}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </Field.Root>
  )
}
