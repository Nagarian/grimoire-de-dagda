import type { BookId } from 'services/books'

export const itemCategories = [
  'weapon',
  'jewelry',
  'potion',
  'equipment',
  'quest',
  'key',
  'currency',
  'consumable',
  'miscellaneous',
] as const satisfies readonly string[]

export type ItemCategory = (typeof itemCategories)[number]
export type ItemBookId = Extract<BookId, 'T01' | 'T02' | 'T03' | 'T04' | 'T05'>
export type ItemLocation = `${ItemBookId}-${string}`

type ItemDefinition = {
  id: string
  category: ItemCategory
  locations: readonly ItemLocation[]
}

export const itemCatalog = [
  { id: 't01_potion_de_soin', category: 'potion', locations: ['T01-7'] },
  {
    id: 't01_arc_et_carquois',
    category: 'weapon',
    locations: ['T01-82', 'T01-237', 'T01-295'],
  },
  { id: 't01_collier_de_charisme', category: 'jewelry', locations: ['T01-16'] },
  { id: 't01_epee_courte_1', category: 'weapon', locations: ['T01-177'] },
  {
    id: 't01_fiole_de_potion_de_laurier',
    category: 'potion',
    locations: ['T01-305'],
  },
  { id: 't01_epee_courte_2', category: 'weapon', locations: ['T01-169'] },
  {
    id: 't01_torche_neuve',
    category: 'equipment',
    locations: ['T01-24', 'T01-228', 'T01-240'],
  },
  {
    id: 't01_pendentif_de_la_rainure',
    category: 'quest',
    locations: ['T01-133', 'T01-269'],
  },
  {
    id: 't01_cristal',
    category: 'quest',
    locations: ['T01-82', 'T01-237', 'T01-295'],
  },
  { id: 't01_boule_rouge', category: 'quest', locations: ['T01-333'] },
  { id: 't01_boule_verte', category: 'quest', locations: ['T01-343'] },
  { id: 't01_cle_rouillee', category: 'key', locations: ['T01-340'] },
  { id: 't01_bourse_en_cuir', category: 'currency', locations: ['T01-238'] },
  { id: 't01_bracelet_de_force', category: 'jewelry', locations: ['T01-287'] },
  {
    id: 't01_bague_de_la_deuxieme_chance',
    category: 'jewelry',
    locations: ['T01-209'],
  },
  { id: 't01_bague_de_vitalite', category: 'jewelry', locations: ['T01-334'] },
  {
    id: 't02_champignon_a_poils_longs',
    category: 'quest',
    locations: ['T02-6', 'T02-124'],
  },
  {
    id: 't02_potions_de_soin_fabriquees',
    category: 'potion',
    locations: ['T02-37'],
  },
  { id: 't02_lettre_pliee', category: 'quest', locations: ['T02-24'] },
  { id: 't02_pomme_verte', category: 'consumable', locations: ['T02-102'] },
  { id: 't02_recu_du_cheval', category: 'quest', locations: ['T02-272'] },
  {
    id: 't02_potion_de_soin_pale',
    category: 'potion',
    locations: ['T02-47', 'T02-212'],
  },
  {
    id: 't02_ceinture_de_paco_tille',
    category: 'currency',
    locations: ['T02-215'],
  },
  { id: 't02_souris_morte', category: 'miscellaneous', locations: ['T02-120'] },
  { id: 't02_pomme_rouge', category: 'consumable', locations: ['T02-248'] },
  {
    id: 't02_melange_pour_potions_de_soin',
    category: 'potion',
    locations: ['T02-335'],
  },
  {
    id: 't03_bague_de_la_deuxieme_chance',
    category: 'jewelry',
    locations: ['T03-181'],
  },
  {
    id: 't03_champignon_orange',
    category: 'consumable',
    locations: ['T03-50', 'T03-130', 'T03-183', 'T03-300'],
  },
  { id: 't03_cle_du_coffre', category: 'key', locations: ['T03-8'] },
  { id: 't03_poudre_d_eveil', category: 'potion', locations: ['T03-272'] },
  { id: 't03_gros_livre', category: 'quest', locations: ['T03-219'] },
  { id: 't03_potion_d_eveil', category: 'potion', locations: ['T03-304'] },
  {
    id: 't03_tige_de_metal',
    category: 'quest',
    locations: ['T03-236', 'T03-328'],
  },
  { id: 't03_bague_d_ancrage', category: 'jewelry', locations: ['T03-53'] },
  { id: 't03_cle_en_bronze', category: 'key', locations: ['T03-70'] },
  {
    id: 't03_fragment_de_carapace_de_reine',
    category: 'miscellaneous',
    locations: ['T03-53'],
  },
  { id: 't03_cle_soleil', category: 'key', locations: ['T03-89'] },
  { id: 't03_potion_de_confusion', category: 'potion', locations: ['T03-91'] },
  { id: 't03_anneau_des_echos', category: 'jewelry', locations: ['T03-192'] },
  { id: 't03_medaillon_grave', category: 'jewelry', locations: ['T03-104'] },
  { id: 't03_cle_doree', category: 'key', locations: ['T03-313'] },
  { id: 't03_il_de_nivelis', category: 'quest', locations: ['T03-349'] },
  { id: 't03_cle_en_cuivre', category: 'key', locations: ['T03-234'] },
  { id: 't03_cle_en_bois', category: 'key', locations: ['T03-296'] },
  { id: 't03_cle_argentee', category: 'key', locations: ['T03-308'] },
  {
    id: 't04_ration_de_nourriture',
    category: 'consumable',
    locations: ['T04-47'],
  },
  { id: 't04_langue_de_dragon', category: 'quest', locations: ['T04-24'] },
  { id: 't04_melange_pale', category: 'potion', locations: ['T04-12'] },
  { id: 't04_torche', category: 'equipment', locations: ['T04-47'] },
  {
    id: 't04_lame_affutee_3_dommages',
    category: 'equipment',
    locations: ['T04-16'],
  },
  { id: 't04_potion_de_soin', category: 'potion', locations: ['T04-47'] },
  { id: 't04_corde_de_chanvre', category: 'equipment', locations: ['T04-47'] },
  {
    id: 't04_couverture_de_laine_du_nord',
    category: 'equipment',
    locations: ['T04-47'],
  },
  {
    id: 't04_fiole_de_baume_reposant',
    category: 'potion',
    locations: ['T04-47'],
  },
  { id: 't04_dette_marque', category: 'miscellaneous', locations: ['T04-107'] },
  { id: 't04_clou_d_etain', category: 'miscellaneous', locations: ['T04-130'] },
  { id: 't04_carte_du_sud', category: 'miscellaneous', locations: ['T04-132'] },
  {
    id: 't04_reste_d_animal_3_boulons_si_marche',
    category: 'miscellaneous',
    locations: ['T04-166'],
  },
  { id: 't04_marque_sombre', category: 'quest', locations: ['T04-184'] },
  {
    id: 't04_mentha_8_feuilles',
    category: 'miscellaneous',
    locations: ['T04-195'],
  },
  {
    id: 't04_pendentif_de_surete',
    category: 'jewelry',
    locations: ['T04-294'],
  },
  {
    id: 't04_tablette_d_argile_13_boulons',
    category: 'miscellaneous',
    locations: ['T04-227'],
  },
  { id: 't04_champi_pomme', category: 'consumable', locations: ['T04-263'] },
  { id: 't04_potion_artemesia', category: 'potion', locations: ['T04-296'] },
  {
    id: 't04_petit_bol_fele',
    category: 'miscellaneous',
    locations: ['T04-297'],
  },
  {
    id: 't05_lentille_de_verre_taillee',
    category: 'quest',
    locations: ['T05-12', 'T05-145', 'T05-334'],
  },
  {
    id: 't05_lanterne_en_cuivre',
    category: 'equipment',
    locations: ['T05-12', 'T05-223', 'T05-334'],
  },
  { id: 't05_cape_epaisse', category: 'equipment', locations: ['T05-204'] },
  { id: 't05_fiole_de_vigueur', category: 'potion', locations: ['T05-12'] },
  {
    id: 't05_pierre_a_aiguiser',
    category: 'consumable',
    locations: ['T05-12'],
  },
  { id: 't05_corde', category: 'equipment', locations: ['T05-19'] },
  {
    id: 't05_bague_de_nacre',
    category: 'jewelry',
    locations: ['T05-12', 'T05-222'],
  },
  {
    id: 't05_grelot_de_la_colonelle',
    category: 'miscellaneous',
    locations: ['T05-12'],
  },
  {
    id: 't05_fleur_de_lune_d_abeille',
    category: 'quest',
    locations: ['T05-27', 'T05-294'],
  },
  {
    id: 't05_carte_gravee_d_arvorenn',
    category: 'miscellaneous',
    locations: ['T05-12'],
  },
  {
    id: 't05_cornet_de_graines_de_tournesol',
    category: 'consumable',
    locations: ['T05-334'],
  },
  {
    id: 't05_pomme_rouge',
    category: 'consumable',
    locations: ['T05-80', 'T05-205'],
  },
  {
    id: 't05_mousse_d_eau_noire',
    category: 'quest',
    locations: ['T05-68', 'T05-173'],
  },
  { id: 't05_panier_de_bertou', category: 'quest', locations: ['T05-223'] },
  { id: 't05_acier_de_l_est', category: 'quest', locations: ['T05-126'] },
  {
    id: 't05_epee_courte',
    category: 'weapon',
    locations: ['T05-102', 'T05-300'],
  },
  {
    id: 't05_releves_du_val',
    category: 'quest',
    locations: ['T05-155', 'T05-159'],
  },
  { id: 't05_hache', category: 'equipment', locations: ['T05-107'] },
  { id: 't05_croquis_du_pere', category: 'quest', locations: ['T05-160'] },
  {
    id: 't05_pelote_de_laine_rouge',
    category: 'quest',
    locations: ['T05-310'],
  },
  { id: 't05_fanal_brise', category: 'quest', locations: ['T05-210'] },
  { id: 't05_boulon_de_saruof', category: 'quest', locations: ['T05-180'] },
  { id: 't05_fanal_repare', category: 'quest', locations: ['T05-161'] },
  {
    id: 't05_sifflet_d_os',
    category: 'quest',
    locations: ['T05-174', 'T05-194'],
  },
  { id: 't05_cle_du_bief', category: 'key', locations: ['T05-192'] },
  { id: 't05_bague_d_eithne', category: 'jewelry', locations: ['T05-198'] },
  {
    id: 't05_carte_a_jouer',
    category: 'miscellaneous',
    locations: ['T05-222'],
  },
  { id: 't05_laissez_passer', category: 'quest', locations: ['T05-221'] },
  {
    id: 't05_pierre_a_aiguiser_de_l_est',
    category: 'consumable',
    locations: ['T05-222'],
  },
  {
    id: 't05_remede_des_quatre_fievres',
    category: 'potion',
    locations: ['T05-295'],
  },
  {
    id: 'compendium_lame_de_l_aube_eternelle',
    category: 'weapon',
    locations: [],
  },
  { id: 'compendium_marteau_de_la_terre', category: 'weapon', locations: [] },
  { id: 'compendium_arc_des_vents', category: 'weapon', locations: [] },
  { id: 'compendium_dague_des_ombres', category: 'weapon', locations: [] },
  { id: 'compendium_baton_du_sage', category: 'weapon', locations: [] },
] as const satisfies readonly ItemDefinition[]

export type ItemId = (typeof itemCatalog)[number]['id']
