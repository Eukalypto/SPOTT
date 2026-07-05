import type { DirectionDefinition, DirectionName } from '../types/direction.js';

export const DIRECTIONS = [
  { name: 'horizontal-right', rowDelta: 0, colDelta: 1 },
  { name: 'horizontal-left', rowDelta: 0, colDelta: -1 },
  { name: 'vertical-down', rowDelta: 1, colDelta: 0 },
  { name: 'vertical-up', rowDelta: -1, colDelta: 0 },
  { name: 'diagonal-down-right', rowDelta: 1, colDelta: 1 },
  { name: 'diagonal-down-left', rowDelta: 1, colDelta: -1 },
] as const satisfies readonly DirectionDefinition[];

export type DirectionConfig = (typeof DIRECTIONS)[number];

export const DIRECTION_NAMES = DIRECTIONS.map(
  (direction) => direction.name,
) as DirectionName[];

export const DIRECTION_BY_NAME: Readonly<Record<DirectionName, DirectionDefinition>> =
  Object.fromEntries(DIRECTIONS.map((direction) => [direction.name, direction])) as Record<
    DirectionName,
    DirectionDefinition
  >;

export function getDirection(name: DirectionName): DirectionDefinition {
  return DIRECTION_BY_NAME[name];
}
