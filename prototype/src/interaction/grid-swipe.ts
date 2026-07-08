import type { Coordinate } from '@spott/engine';

const INVALID_FLASH_MS = 220;
const CELL_HIT_BOX_RATIO = 0.75;

/** True when a pointer lies inside the centered hit box for a grid cell. */
export function isPointInCellHitBox(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'>,
  ratio = CELL_HIT_BOX_RATIO,
): boolean {
  const insetX = (rect.width * (1 - ratio)) / 2;
  const insetY = (rect.height * (1 - ratio)) / 2;

  return (
    clientX >= rect.left + insetX &&
    clientX <= rect.right - insetX &&
    clientY >= rect.top + insetY &&
    clientY <= rect.bottom - insetY
  );
}

function isAdjacent(a: Coordinate, b: Coordinate): boolean {
  const rowDiff = Math.abs(a.row - b.row);
  const colDiff = Math.abs(a.col - b.col);
  return rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0);
}

function stepDirection(from: Coordinate, to: Coordinate): Coordinate {
  return {
    row: Math.sign(to.row - from.row) as -1 | 0 | 1,
    col: Math.sign(to.col - from.col) as -1 | 0 | 1,
  };
}

function coordinatesEqual(left: Coordinate, right: Coordinate): boolean {
  return left.row === right.row && left.col === right.col;
}

/** Extend a forward-only drag path; backtracking removes the last cell. */
export function tryExtendPath(path: Coordinate[], next: Coordinate): Coordinate[] {
  if (path.length === 0) {
    return [next];
  }

  const last = path[path.length - 1];
  if (coordinatesEqual(last, next)) {
    return path;
  }

  if (path.length >= 2) {
    const previous = path[path.length - 2];
    if (coordinatesEqual(previous, next)) {
      return path.slice(0, -1);
    }
  }

  if (path.length === 1) {
    if (isAdjacent(last, next)) {
      return [...path, next];
    }
    return path;
  }

  const direction = stepDirection(path[0], path[1]);
  const expected: Coordinate = {
    row: last.row + direction.row,
    col: last.col + direction.col,
  };

  if (coordinatesEqual(expected, next)) {
    return [...path, next];
  }

  return path;
}

export interface GridSwipeOptions {
  /** Return true when the engine accepted the swipe. */
  onSubmitSwipe: (coordinates: Coordinate[]) => boolean;
}

export interface GridSwipeHandle {
  destroy: () => void;
}

export function attachGridSwipe(
  gridElement: HTMLElement,
  options: GridSwipeOptions,
): GridSwipeHandle {
  let activePath: Coordinate[] = [];
  let isSelecting = false;
  let activePointerId: number | null = null;
  let flashTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const readCoordinate = (cell: HTMLElement): Coordinate => ({
    row: Number(cell.dataset.row),
    col: Number(cell.dataset.col),
  });

  const findCellFromCoordinates = (clientX: number, clientY: number): HTMLElement | null => {
    const cells = gridElement.querySelectorAll<HTMLElement>('[data-row][data-col]');
    for (const cell of cells) {
      const rect = cell.getBoundingClientRect();
      if (isPointInCellHitBox(clientX, clientY, rect)) {
        return cell;
      }
    }
    return null;
  };

  const getCellFromPointer = (event: PointerEvent): HTMLElement | null =>
    findCellFromCoordinates(event.clientX, event.clientY);

  const clearSelectionStyles = (): void => {
    gridElement.querySelectorAll('.grid-cell--selected').forEach((cell) => {
      cell.classList.remove('grid-cell--selected');
    });
  };

  const applySelectionStyles = (): void => {
    clearSelectionStyles();
    for (const coordinate of activePath) {
      gridElement
        .querySelector<HTMLElement>(
          `[data-row="${coordinate.row}"][data-col="${coordinate.col}"]`,
        )
        ?.classList.add('grid-cell--selected');
    }
  };

  const resetSelection = (): void => {
    isSelecting = false;
    activePointerId = null;
    activePath = [];
    clearSelectionStyles();
  };

  const flashInvalidSelection = (path: Coordinate[]): void => {
    if (flashTimeoutId !== null) {
      clearTimeout(flashTimeoutId);
    }

    clearSelectionStyles();
    for (const coordinate of path) {
      gridElement
        .querySelector<HTMLElement>(
          `[data-row="${coordinate.row}"][data-col="${coordinate.col}"]`,
        )
        ?.classList.add('grid-cell--invalid');
    }

    flashTimeoutId = setTimeout(() => {
      gridElement.querySelectorAll('.grid-cell--invalid').forEach((cell) => {
        cell.classList.remove('grid-cell--invalid');
      });
      flashTimeoutId = null;
    }, INVALID_FLASH_MS);
  };

  const addCellToPath = (cell: HTMLElement): void => {
    activePath = tryExtendPath(activePath, readCoordinate(cell));
    applySelectionStyles();
  };

  const finishSelection = (event: PointerEvent): void => {
    if (!isSelecting || activePointerId !== event.pointerId) {
      return;
    }

    if (gridElement.hasPointerCapture(event.pointerId)) {
      gridElement.releasePointerCapture(event.pointerId);
    }

    isSelecting = false;
    activePointerId = null;

    const path = [...activePath];
    clearSelectionStyles();
    activePath = [];

    if (path.length < 2) {
      return;
    }

    const applied = options.onSubmitSwipe(path);
    if (!applied) {
      flashInvalidSelection(path);
    }
  };

  const handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || isSelecting) {
      return;
    }

    const cell = getCellFromPointer(event);
    if (!cell) {
      return;
    }

    event.preventDefault();
    gridElement.setPointerCapture(event.pointerId);
    isSelecting = true;
    activePointerId = event.pointerId;
    activePath = [readCoordinate(cell)];
    applySelectionStyles();
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (!isSelecting || activePointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const cell = getCellFromPointer(event);
    if (!cell) {
      return;
    }

    addCellToPath(cell);
  };

  const handlePointerUp = (event: PointerEvent): void => {
    finishSelection(event);
  };

  const handlePointerCancel = (event: PointerEvent): void => {
    if (activePointerId !== event.pointerId) {
      return;
    }

    if (gridElement.hasPointerCapture(event.pointerId)) {
      gridElement.releasePointerCapture(event.pointerId);
    }

    resetSelection();
  };

  const listenerOptions: AddEventListenerOptions = { passive: false };

  gridElement.addEventListener('pointerdown', handlePointerDown, listenerOptions);
  gridElement.addEventListener('pointermove', handlePointerMove, listenerOptions);
  gridElement.addEventListener('pointerup', handlePointerUp);
  gridElement.addEventListener('pointercancel', handlePointerCancel);

  return {
    destroy: () => {
      if (flashTimeoutId !== null) {
        clearTimeout(flashTimeoutId);
      }
      resetSelection();
      gridElement.removeEventListener('pointerdown', handlePointerDown, listenerOptions);
      gridElement.removeEventListener('pointermove', handlePointerMove, listenerOptions);
      gridElement.removeEventListener('pointerup', handlePointerUp);
      gridElement.removeEventListener('pointercancel', handlePointerCancel);
    },
  };
}
