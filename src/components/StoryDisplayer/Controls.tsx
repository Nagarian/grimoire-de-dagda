import {
  Box,
  type BoxProps,
  Field,
  IconButton,
  NumberInput,
  Popover,
  Portal,
  Tooltip,
} from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { LuMaximize, LuSearch, LuZoomIn, LuZoomOut } from 'react-icons/lu'
import { RiInformation2Line, RiInformationOffLine } from 'react-icons/ri'
import { TbMap, TbMapOff } from 'react-icons/tb'

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
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Contrôles du diagramme"
    >
      <ControlTooltip label="Zoom avant">
        <IconButton
          size="sm"
          aria-label="Zoom avant"
          disabled={disabled}
          onClick={onZoomIn}
        >
          <LuZoomIn />
        </IconButton>
      </ControlTooltip>
      <ControlTooltip label="Zoom arrière">
        <IconButton
          size="sm"
          aria-label="Zoom arrière"
          disabled={disabled}
          onClick={onZoomOut}
        >
          <LuZoomOut />
        </IconButton>
      </ControlTooltip>
      <ControlTooltip label="Voir tout le livre">
        <IconButton
          size="sm"
          aria-label="Voir tout le livre"
          disabled={disabled}
          onClick={onReset}
        >
          <LuMaximize />
        </IconButton>
      </ControlTooltip>
      <ControlTooltip
        label={showMinimap ? 'Masquer la mini-carte' : 'Afficher la mini-carte'}
      >
        <IconButton
          size="sm"
          aria-label={
            showMinimap ? 'Masquer la mini-carte' : 'Afficher la mini-carte'
          }
          aria-pressed={showMinimap}
          disabled={disabled}
          onClick={onMinimapToggle}
        >
          {showMinimap ? <TbMapOff /> : <TbMap />}
        </IconButton>
      </ControlTooltip>
      <ControlTooltip
        label={showLegend ? 'Masquer la légende' : 'Afficher la légende'}
      >
        <IconButton
          size="sm"
          aria-label={showLegend ? 'Masquer la légende' : 'Afficher la légende'}
          aria-pressed={showLegend}
          disabled={disabled}
          onClick={onLegendToggle}
        >
          {showLegend ? <RiInformationOffLine /> : <RiInformation2Line />}
        </IconButton>
      </ControlTooltip>
      <Popover.Root
        onOpenChange={d => {
          if (!d.open) {
            return
          }

          setSearchValue('')
          setNotFound(false)
        }}
      >
        <Popover.Trigger asChild>
          <IconButton
            size="sm"
            aria-label="Aller à un chapitre"
            disabled={disabled}
          >
            <ControlTooltip label="Aller à un chapitre">
              <LuSearch />
            </ControlTooltip>
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
                  <Field.Label>Numéro du chapitre</Field.Label>
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

function ControlTooltip({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Tooltip.Root openDelay={200} closeDelay={100}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>
          <Tooltip.Arrow />
          {label}
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  )
}
