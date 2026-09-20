export const BookIds = ['T01', 'T02', 'T03', 'E01'] as const
export type BookId = (typeof BookIds)[number]
