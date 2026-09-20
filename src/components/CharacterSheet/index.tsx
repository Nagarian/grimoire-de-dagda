import { Box } from '@chakra-ui/react'
import type { BookId } from 'types/books'
import { InputCurrentLife, InputCurrentLifeId } from './inputs/CurrentLife'
import { InputDexterity, InputDexterityId } from './inputs/Dexterity'
import { InputInventory, InputInventoryId } from './inputs/Inventory'
import { InputLuck, InputLuckId } from './inputs/Luck'
import { InputMaxLife, InputMaxLifeId } from './inputs/MaxLife'
import { InputSavepoint, InputSavepointId } from './inputs/Savepoint'
import { InputSkill, InputSkillId } from './inputs/Skill'
import { InputWeapon, InputWeaponId } from './inputs/Weapon'

type CharacterSheetProps = {
  bookId?: BookId
}

export function CharacterSheet({ bookId }: CharacterSheetProps) {
  return (
    <Box
      display="grid"
      padding="2"
      gap="2"
      gridTemplateAreas={`
        "${InputMaxLifeId} ${InputCurrentLifeId}"
        "${InputDexterityId} ${InputDexterityId}"
        "${InputLuckId} ${InputLuckId}"
        "${InputSkillId} ${InputSkillId}"
        "${InputSavepointId} ${InputSavepointId}"
        "${InputWeaponId} ${InputWeaponId}"
        "${InputInventoryId} ${InputInventoryId}"
      `}
    >
      <InputMaxLife />
      <InputCurrentLife />
      <InputDexterity />
      <InputLuck />
      <InputSkill />
      <InputSavepoint />
      <InputWeapon />
      <InputInventory />
    </Box>
  )
}
