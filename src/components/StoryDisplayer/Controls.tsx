import {
  Box,
  type BoxProps,
  Field,
  IconButton,
  NumberInput,
  Popover,
  Portal,
} from '@chakra-ui/react'
import { type RefObject, useEffect, useState } from 'react'
import {
  LuArrowDown,
  LuArrowUp,
  LuMap,
  LuSearch,
  LuZoomIn,
  LuZoomOut,
} from 'react-icons/lu'
import { MdLegendToggle, MdZoomInMap } from 'react-icons/md'
import { useControls } from 'react-zoom-pan-pinch'

type ControlsProps = {
  showMinimap: boolean
  onMinimapToggle: () => void
  mapRef: RefObject<HTMLDivElement | null>
} & Pick<BoxProps, 'position' | 'top' | 'right' | 'zIndex'>

export function Controls({
  showMinimap,
  onMinimapToggle,
  mapRef,
  ...props
}: ControlsProps) {
  const { resetTransform, zoomIn, zoomOut, zoomToElement } = useControls()
  const [searchValue, setSearchValue] = useState<string>('')
  const [searchResult, setSearchResult] = useState<NodeListOf<Element>>()
  const [selectedIndex, setSelectedIndex] = useState<number>()

  useEffect(() => {
    if (selectedIndex === undefined || !searchResult) {
      return
    }

    const element = searchResult[selectedIndex] as HTMLElement
    zoomToElement(element)
    element.style.filter = 'invert(1)'
    return () => {
      element.style.filter = ''
    }
  }, [selectedIndex, searchResult, zoomToElement])

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
        onClick={() => {
          zoomIn(0.3)
        }}
      >
        <LuZoomIn />
      </IconButton>
      <IconButton
        size="sm"
        aria-label="Zoom-out"
        onClick={() => {
          zoomOut(0.3)
        }}
      >
        <LuZoomOut />
      </IconButton>
      <IconButton
        size="sm"
        aria-label="Reset"
        onClick={() => {
          resetTransform()
        }}
      >
        <MdZoomInMap />
      </IconButton>
      <IconButton
        size="sm"
        aria-label={showMinimap ? 'Show minimap' : 'Hide minimap'}
        onClick={onMinimapToggle}
      >
        <LuMap />
      </IconButton>
      <IconButton
        size="sm"
        aria-label="Scroll to legend"
        disabled={!mapRef.current?.querySelector('#mermaid-legend')}
        onClick={() => {
          const legend = mapRef.current?.querySelector('#mermaid-legend')
          if (legend) {
            zoomToElement(legend as HTMLElement)
          }
        }}
      >
        <MdLegendToggle />
      </IconButton>
      <Popover.Root
        onOpenChange={() => {
          setSearchValue('')
          setSearchResult(undefined)
          setSelectedIndex(undefined)
        }}
      >
        <Popover.Trigger asChild>
          <IconButton size="sm" aria-label="Search chapter">
            <LuSearch />
          </IconButton>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content>
              <Popover.Arrow />
              <Popover.Body
                display="grid"
                gridTemplateAreas={`
                  "title title title"
                  "input next  prev"
                `}
                gap="1"
              >
                <Popover.Title fontWeight="medium" gridArea="title">
                  Search a specific chapter
                </Popover.Title>
                <Field.Root gridArea="input">
                  <NumberInput.Root
                    min={1}
                    value={searchValue}
                    onKeyDown={e => {
                      if (
                        e.key === 'Enter' &&
                        selectedIndex !== undefined &&
                        searchResult
                      ) {
                        const nextIndex =
                          (selectedIndex + 1) % searchResult.length
                        setSelectedIndex(nextIndex)
                      }
                    }}
                    onValueChange={e => {
                      setSearchValue(e.value)
                      const elements = mapRef.current?.querySelectorAll(
                        `[id*="flowchart-${e.value}"]`,
                      )

                      if (!elements || elements.length === 0) {
                        setSearchResult(undefined)
                        setSelectedIndex(undefined)
                        return
                      }

                      setSearchResult(elements)
                      setSelectedIndex(0)
                    }}
                  >
                    <NumberInput.Control />
                    <NumberInput.Input />
                  </NumberInput.Root>
                  {searchResult && selectedIndex !== undefined && (
                    <Field.HelperText>
                      {`Found ${searchResult.length} results - (${selectedIndex + 1}/${
                        searchResult.length
                      })`}
                    </Field.HelperText>
                  )}
                </Field.Root>
                {searchResult?.length && selectedIndex !== undefined && (
                  <>
                    <IconButton
                      size="sm"
                      aria-label="Next result"
                      gridArea="next"
                      onClick={() => {
                        const nextIndex =
                          (selectedIndex + 1) % searchResult.length
                        setSelectedIndex(nextIndex)
                      }}
                    >
                      <LuArrowDown />
                    </IconButton>
                    <IconButton
                      size="sm"
                      aria-label="Previous result"
                      gridArea="prev"
                      onClick={() => {
                        const prevIndex =
                          (selectedIndex - 1 + searchResult.length) %
                          searchResult.length
                        setSelectedIndex(prevIndex)
                      }}
                    >
                      <LuArrowUp />
                    </IconButton>
                  </>
                )}
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Box>
  )
}
