import {
  Box,
  type BoxProps,
  Field,
  IconButton,
  NumberInput,
  Popover,
  Portal,
} from '@chakra-ui/react'
import { useState } from 'react'
import { LuMap, LuSearch, LuZoomIn, LuZoomOut } from 'react-icons/lu'
import { MdLegendToggle, MdZoomInMap } from 'react-icons/md'

type ControlsProps = {
  disabled: boolean
  showMinimap: boolean
  onMinimapToggle: () => void
  showLegend: boolean
  onLegendToggle: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  /** Moves the view onto a chapter. Returns false when the book has no such chapter. */
  onSearch: (chapter: string) => boolean
} & Pick<BoxProps, 'position' | 'top' | 'right' | 'zIndex'>

export function Controls({
  disabled,
  showMinimap,
  onMinimapToggle,
  showLegend,
  onLegendToggle,
  onZoomIn,
  onZoomOut,
  onReset,
  onSearch,
  ...props
}: ControlsProps) {
  const [searchValue, setSearchValue] = useState<string>('')
  const [notFound, setNotFound] = useState<boolean>(false)

  const search = (chapter: string) => {
    setSearchValue(chapter)
    setNotFound(chapter !== '' && !onSearch(chapter))
  }

  return (
    <Box
      {...props}
      display="flex"
      flexDirection="column"
      gap="2"
      padding="2"
      borderRadius="md"
    >
      <IconButton
        size="sm"
        aria-label="Zoom-in"
        disabled={disabled}
        onClick={onZoomIn}
      >
        <LuZoomIn />
      </IconButton>
      <IconButton
        size="sm"
        aria-label="Zoom-out"
        disabled={disabled}
        onClick={onZoomOut}
      >
        <LuZoomOut />
      </IconButton>
      <IconButton
        size="sm"
        aria-label="Reset"
        disabled={disabled}
        onClick={onReset}
      >
        <MdZoomInMap />
      </IconButton>
      <IconButton
        size="sm"
        aria-label={showMinimap ? 'Hide minimap' : 'Show minimap'}
        aria-pressed={showMinimap}
        disabled={disabled}
        onClick={onMinimapToggle}
      >
        <LuMap />
      </IconButton>
      <IconButton
        size="sm"
        aria-label={showLegend ? 'Hide legend' : 'Show legend'}
        aria-pressed={showLegend}
        disabled={disabled}
        onClick={onLegendToggle}
      >
        <MdLegendToggle />
      </IconButton>
      <Popover.Root
        onOpenChange={() => {
          setSearchValue('')
          setNotFound(false)
        }}
      >
        <Popover.Trigger asChild>
          <IconButton size="sm" aria-label="Search chapter" disabled={disabled}>
            <LuSearch />
          </IconButton>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content>
              <Popover.Arrow />
              <Popover.Body display="flex" flexDirection="column" gap="1">
                <Popover.Title fontWeight="medium">
                  Aller à un chapitre
                </Popover.Title>
                <Field.Root invalid={notFound}>
                  <NumberInput.Root
                    min={1}
                    value={searchValue}
                    onValueChange={e => {
                      search(e.value)
                    }}
                  >
                    <NumberInput.Control />
                    <NumberInput.Input />
                  </NumberInput.Root>
                  {notFound && (
                    <Field.ErrorText>
                      Ce chapitre n’existe pas dans ce livre
                    </Field.ErrorText>
                  )}
                </Field.Root>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Box>
  )
}
