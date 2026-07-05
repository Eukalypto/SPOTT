/** The six placement directions required on every grid (one word per direction). */
export type DirectionName =
  | 'horizontal-right'
  | 'horizontal-left'
  | 'vertical-down'
  | 'vertical-up'
  | 'diagonal-down-right'
  | 'diagonal-down-left';

export interface DirectionDelta {
  rowDelta: -1 | 0 | 1;
  colDelta: -1 | 0 | 1;
}

export interface DirectionDefinition extends DirectionDelta {
  name: DirectionName;
}
