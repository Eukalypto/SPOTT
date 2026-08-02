import type { Coordinate } from '@spott/engine';

const INVALID_FLASH_MS = 220;
const CELL_HIT_BOX_RATIO = 0.75;
/** Max gap between consecutive cell hits to forgive one skipped cell (fast swipe, not a deliberate jump). */
const SKIP_TOLERANCE_WINDOW_MS = 180;

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

function pathContainsCoordinate(path: Coordinate[], coordinate: Coordinate): boolean {
  return path.some((entry) => coordinatesEqual(entry, coordinate));
}

export interface ExtendPathOptions {
  /**
   * Allow one skipped cell in the established direction (touchscreens can miss a
   * cell when the finger moves fast). Gated by the caller to a short time window
   * so it only forgives fast continuous swipes, not deliberate jumps.
   */
  allowSkip?: boolean;
}

/** Extend a forward-only drag path; backtracking removes the last cell. */
export function tryExtendPath(
  path: Coordinate[],
  next: Coordinate,
  options: ExtendPathOptions = {},
): Coordinate[] {
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

  if (pathContainsCoordinate(path, next)) {
    return path;
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

  if (options.allowSkip && !pathContainsCoordinate(path, expected)) {
    const skipped: Coordinate = {
      row: last.row + direction.row * 2,
      col: last.col + direction.col * 2,
    };

    if (coordinatesEqual(skipped, next)) {
      return [...path, expected, next];
    }
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
  let lastCellTimestamp = 0;

  const readCoordinate = (cell: HTMLElement): Coordinate => ({
    row: Number(cell.dataset.row),
    col: Number(cell.dataset.col),
  });

  const findCellFromCoordinates = (clientX: number, clientY: number): HTMLElement | null => {
    const target = document.elementFromPoint(clientX, clientY);
    const cell = target?.closest<HTMLElement>('[data-row][data-col]');
    if (!cell || !gridElement.contains(cell)) {
      return null;
    }

    const rect = cell.getBoundingClientRect();
    if (!isPointInCellHitBox(clientX, clientY, rect)) {
      return null;
    }

    return cell;
  };

  const getCellFromPointer = (event: PointerEvent): HTMLElement | null =>
    findCellFromCoordinates(event.clientX, event.clientY);

  const clearInvalidFlash = (): void => {
    if (flashTimeoutId !== null) {
      clearTimeout(flashTimeoutId);
      flashTimeoutId = null;
    }

    gridElement.querySelectorAll('.grid-cell--invalid').forEach((cell) => {
      cell.classList.remove('grid-cell--invalid');
    });
  };

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

  const setSelectingState = (selecting: boolean): void => {
    gridElement.classList.toggle('letter-grid--selecting', selecting);
  };

  const resetSelection = (): void => {
    isSelecting = false;
    activePointerId = null;
    activePath = [];
    clearSelectionStyles();
    setSelectingState(false);
  };

  const flashInvalidSelection = (path: Coordinate[]): void => {
    clearInvalidFlash();
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

  const addCellToPath = (cell: HTMLElement, timestamp: number): void => {
    const allowSkip = timestamp - lastCellTimestamp <= SKIP_TOLERANCE_WINDOW_MS;
    const nextPath = tryExtendPath(activePath, readCoordinate(cell), { allowSkip });
    if (nextPath === activePath) {
      return;
    }

    activePath = nextPath;
    lastCellTimestamp = timestamp;
    applySelectionStyles();
  };

  const releasePointer = (pointerId: number): void => {
    if (gridElement.hasPointerCapture(pointerId)) {
      gridElement.releasePointerCapture(pointerId);
    }
  };

  const finishSelection = (event: PointerEvent): void => {
    if (!isSelecting || activePointerId !== event.pointerId) {
      return;
    }

    const path = [...activePath];
    isSelecting = false;
    activePointerId = null;
    activePath = [];
    clearSelectionStyles();
    setSelectingState(false);
    releasePointer(event.pointerId);

    if (path.length < 2) {
      return;
    }

    const applied = options.onSubmitSwipe(path);
    if (!applied) {
      flashInvalidSelection(path);
    }
  };

  const cancelSelection = (event: PointerEvent): void => {
    if (activePointerId !== event.pointerId) {
      return;
    }

    isSelecting = false;
    activePointerId = null;
    activePath = [];
    clearSelectionStyles();
    setSelectingState(false);
    releasePointer(event.pointerId);
  };

  const handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || isSelecting) {
      return;
    }

    const cell = getCellFromPointer(event);
    if (!cell) {
      return;
    }

    clearInvalidFlash();
    event.preventDefault();
    gridElement.setPointerCapture(event.pointerId);
    isSelecting = true;
    activePointerId = event.pointerId;
    activePath = [readCoordinate(cell)];
    lastCellTimestamp = event.timeStamp;
    setSelectingState(true);
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

    addCellToPath(cell, event.timeStamp);
  };

  const handlePointerUp = (event: PointerEvent): void => {
    finishSelection(event);
  };

  const handlePointerCancel = (event: PointerEvent): void => {
    cancelSelection(event);
  };

  const handleLostPointerCapture = (event: PointerEvent): void => {
    if (isSelecting && activePointerId === event.pointerId) {
      resetSelection();
    }
  };

  const preventBrowserDrag = (event: Event): void => {
    event.preventDefault();
  };

  const listenerOptions: AddEventListenerOptions = { passive: false };

  gridElement.addEventListener('pointerdown', handlePointerDown, listenerOptions);
  gridElement.addEventListener('pointermove', handlePointerMove, listenerOptions);
  gridElement.addEventListener('pointerup', handlePointerUp);
  gridElement.addEventListener('pointercancel', handlePointerCancel);
  gridElement.addEventListener('lostpointercapture', handleLostPointerCapture);
  gridElement.addEventListener('dragstart', preventBrowserDrag);
  gridElement.addEventListener('selectstart', preventBrowserDrag);
  gridElement.addEventListener('contextmenu', preventBrowserDrag);

  return {
    destroy: () => {
      clearInvalidFlash();
      resetSelection();
      gridElement.removeEventListener('pointerdown', handlePointerDown, listenerOptions);
      gridElement.removeEventListener('pointermove', handlePointerMove, listenerOptions);
      gridElement.removeEventListener('pointerup', handlePointerUp);
      gridElement.removeEventListener('pointercancel', handlePointerCancel);
      gridElement.removeEventListener('lostpointercapture', handleLostPointerCapture);
      gridElement.removeEventListener('dragstart', preventBrowserDrag);
      gridElement.removeEventListener('selectstart', preventBrowserDrag);
      gridElement.removeEventListener('contextmenu', preventBrowserDrag);
    },
  };
}
