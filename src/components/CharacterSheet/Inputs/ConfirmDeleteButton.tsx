import { Button, Dialog, IconButton, Portal } from '@chakra-ui/react'
import { useState } from 'react'
import { LuTrash2, LuX } from 'react-icons/lu'

export function ConfirmDeleteButton({
  description,
  colorPalette = 'gray',
  onConfirm,
}: {
  description: string
  colorPalette?: string
  onConfirm: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <IconButton
        variant="outline"
        aria-label="Retirer"
        onClick={() => setOpen(true)}
      >
        <LuTrash2 />
      </IconButton>
      <Dialog.Root open={open} onOpenChange={details => setOpen(details.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner alignItems="center" justifyContent="center">
            <Dialog.Content colorPalette={colorPalette}>
              <Dialog.Header>
                <Dialog.Title>Confirmer la suppression</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <IconButton aria-label="Fermer" variant="ghost" size="sm">
                    <LuX />
                  </IconButton>
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                Voulez-vous vraiment retirer {description} ?
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button
                  colorPalette="red"
                  onClick={() => {
                    onConfirm()
                    setOpen(false)
                  }}
                >
                  Confirmer la suppression
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
