import {
  Box,
  Combobox,
  Highlight,
  Input,
  Text,
  useComboboxContext,
  useFilter,
  useListCollection,
} from '@chakra-ui/react'
import type { ItemId } from 'data/items'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { LocalizedItem } from 'services/itemCatalog'

function CatalogComboboxInput({
  inputValue,
  placeholder,
  onInputValueChange,
  filter,
}: {
  inputValue: string
  placeholder: string
  onInputValueChange: (value: string) => void
  filter: (value: string) => void
}) {
  const combobox = useComboboxContext()
  const { defaultValue, size, ...inputProps } = combobox.getInputProps()
  void defaultValue
  void size

  return (
    <Input
      {...inputProps}
      placeholder={placeholder}
      value={inputValue}
      onChange={event => {
        inputProps.onChange?.(event)
        const value = event.currentTarget.value
        filter(value)
        onInputValueChange(value)
      }}
    />
  )
}

export function CatalogItemCombobox({
  colorPalette = 'gray',
  items,
  label,
  placeholder,
  inputValue,
  selectedItemId,
  onInputValueChange,
  onItemSelect,
}: {
  colorPalette?: string
  items: LocalizedItem[]
  label: string
  placeholder: string
  inputValue: string
  selectedItemId?: ItemId
  onInputValueChange: (value: string) => void
  onItemSelect: (item: LocalizedItem) => void
}) {
  const { t } = useTranslation()
  const filters = useFilter({ sensitivity: 'base' })
  const collectionItems = useMemo(
    () =>
      items.map(item => ({
        value: item.id,
        label: item.name,
        effect: item.effect,
        categoryLabel: item.categoryLabel,
      })),
    [items],
  )
  const { collection, filter } = useListCollection({
    initialItems: collectionItems,
    filter: (value, query) => filters.contains(value, query),
  })

  return (
    <Combobox.Root
      collection={collection}
      colorPalette={colorPalette}
      value={selectedItemId ? [selectedItemId] : []}
      allowCustomValue
      // openOnClick
      openOnChange={e => e.inputValue.length >= 2}
      onValueChange={event => {
        const selectedId = event.value.at(0)
        const selectedItem = items.find(item => item.id === selectedId)
        if (selectedItem) {
          onItemSelect(selectedItem)
        }
      }}
    >
      <Combobox.Label>{label}</Combobox.Label>
      <Combobox.Control>
        <CatalogComboboxInput
          placeholder={placeholder}
          inputValue={inputValue}
          filter={filter}
          onInputValueChange={onInputValueChange}
        />
        <Combobox.IndicatorGroup>
          <Combobox.Trigger aria-label={t('sheet.showItemSuggestions')} />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Combobox.Positioner>
        <Combobox.Content>
          {/* <Combobox.Empty>{t('sheet.noItemSuggestions')}</Combobox.Empty> */}
          {collection.items.map(item => (
            <Combobox.Item item={item} key={item.value}>
              <Box flex="1">
                <Highlight
                  ignoreCase
                  query={inputValue}
                  styles={{
                    bg: 'colorPalette.emphasized',
                    fontWeight: 'medium',
                  }}
                >
                  {item.label}
                </Highlight>
                {item.effect && (
                  <Text fontSize="sm" color="fg.muted">
                    {item.effect}
                  </Text>
                )}
              </Box>
              <Text fontSize="sm" color="fg.muted">
                {item.categoryLabel}
              </Text>
              <Combobox.ItemIndicator />
            </Combobox.Item>
          ))}
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox.Root>
  )
}
