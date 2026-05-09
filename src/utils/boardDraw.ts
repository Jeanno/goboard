import { Position, StoneColor } from '../types';

export const CELL_SIZE = 40;
export const PADDING = 30;
export const COORD_PADDING = 22;

export function canvasSize(boardSize: number): number {
  return (boardSize - 1) * CELL_SIZE + PADDING * 2;
}

export function canvasSizeWithCoords(boardSize: number): number {
  return canvasSize(boardSize) + COORD_PADDING * 2;
}

const COL_LETTERS = 'ABCDEFGHJKLMNOPQRST';

export function colLabel(col: number): string {
  return COL_LETTERS[col] ?? '?';
}

export function rowLabel(row: number, boardSize: number): string {
  return String(boardSize - row);
}

const textureCache = new Map<string, HTMLCanvasElement>();

function renderWoodTexture(width: number, height: number, isDark: boolean): HTMLCanvasElement {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const ctx = off.getContext('2d')!;

  const baseColor = isDark ? '#4a3828' : '#d4a574';
  const grainColor = isDark ? '#3d2f22' : '#b8935f';

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = grainColor;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.3;

  for (let y = 0; y < height; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < width; x += 5) {
      const noise = Math.sin(x * 0.02 + y * 0.1) * 2;
      ctx.lineTo(x, y + noise);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 0.15;
  for (let x = 0; x < width; x += 40) {
    const gradient = ctx.createLinearGradient(x, 0, x + 30, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, grainColor);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 30, height);
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);
  return off;
}

export function drawWoodTexture(ctx: CanvasRenderingContext2D, width: number, height: number, isDark: boolean) {
  const key = `${width}x${height}-${isDark ? 'd' : 'l'}`;
  let cached = textureCache.get(key);
  if (!cached) {
    cached = renderWoodTexture(width, height, isDark);
    textureCache.set(key, cached);
  }
  ctx.drawImage(cached, 0, 0);
}

export function drawGrid(ctx: CanvasRenderingContext2D, boardSize: number) {
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  for (let i = 0; i < boardSize; i++) {
    ctx.beginPath();
    ctx.moveTo(PADDING + i * CELL_SIZE, PADDING);
    ctx.lineTo(PADDING + i * CELL_SIZE, PADDING + (boardSize - 1) * CELL_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(PADDING, PADDING + i * CELL_SIZE);
    ctx.lineTo(PADDING + (boardSize - 1) * CELL_SIZE, PADDING + i * CELL_SIZE);
    ctx.stroke();
  }

  ctx.fillStyle = '#000';
  for (const { row, col } of getStarPoints(boardSize)) {
    ctx.beginPath();
    ctx.arc(PADDING + col * CELL_SIZE, PADDING + row * CELL_SIZE, 3, 0, 2 * Math.PI);
    ctx.fill();
  }
}

export function drawStone(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  color: 'black' | 'white',
  alpha = 1,
) {
  const x = PADDING + col * CELL_SIZE;
  const y = PADDING + row * CELL_SIZE;
  const radius = CELL_SIZE * 0.45;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.beginPath();
  ctx.arc(x + 2, y + 2, radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color === 'black' ? '#000' : '#fff';
  ctx.fill();

  ctx.strokeStyle = color === 'black' ? '#333' : '#ddd';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

export function drawStones(ctx: CanvasRenderingContext2D, stones: StoneColor[][]) {
  stones.forEach((row, r) => {
    row.forEach((stone, c) => {
      if (stone) drawStone(ctx, r, c, stone, 1);
    });
  });
}

export function clickToIntersection(
  event: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement,
  boardSize: number,
): Position | null {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  const col = Math.round((x - PADDING) / CELL_SIZE);
  const row = Math.round((y - PADDING) / CELL_SIZE);

  if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) return null;
  return { row, col };
}

export function drawCoordinateLabels(ctx: CanvasRenderingContext2D, boardSize: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let col = 0; col < boardSize; col++) {
    const x = PADDING + col * CELL_SIZE;
    ctx.fillText(colLabel(col), x, PADDING - 16);
    ctx.fillText(colLabel(col), x, PADDING + (boardSize - 1) * CELL_SIZE + 16);
  }
  for (let row = 0; row < boardSize; row++) {
    const y = PADDING + row * CELL_SIZE;
    ctx.fillText(rowLabel(row, boardSize), PADDING - 18, y);
    ctx.fillText(rowLabel(row, boardSize), PADDING + (boardSize - 1) * CELL_SIZE + 18, y);
  }
  ctx.restore();
}

export type CandidateKind = 'leaf' | 'branch' | 'annotated';

const CANDIDATE_FILL: Record<CandidateKind, [string, string]> = {
  leaf: ['#c87060', '#d97757'],
  branch: ['#6ea25e', '#7eb371'],
  annotated: ['#8aa055', '#9caf6a'],
};

export function drawCandidateMarker(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  index: number,
  kind: CandidateKind,
  isHover: boolean,
) {
  const x = PADDING + col * CELL_SIZE;
  const y = PADDING + row * CELL_SIZE;
  const half = CELL_SIZE * 0.42;
  const [base, hover] = CANDIDATE_FILL[kind];

  ctx.save();
  ctx.fillStyle = isHover ? hover : base;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1;
  ctx.fillRect(x - half, y - half, half * 2, half * 2);
  ctx.strokeRect(x - half, y - half, half * 2, half * 2);

  ctx.fillStyle = '#fff';
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(index), x, y + 1);
  ctx.restore();
}

export function drawLastMoveMarker(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
) {
  const x = PADDING + col * CELL_SIZE;
  const y = PADDING + row * CELL_SIZE;
  const s = CELL_SIZE * 0.18;
  ctx.save();
  ctx.fillStyle = '#d63b2f';
  ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
}

export function getStarPoints(boardSize: number): Position[] {
  if (boardSize === 19) {
    return [
      { row: 3, col: 3 }, { row: 3, col: 9 }, { row: 3, col: 15 },
      { row: 9, col: 3 }, { row: 9, col: 9 }, { row: 9, col: 15 },
      { row: 15, col: 3 }, { row: 15, col: 9 }, { row: 15, col: 15 },
    ];
  } else if (boardSize === 13) {
    return [
      { row: 3, col: 3 }, { row: 3, col: 9 },
      { row: 6, col: 6 },
      { row: 9, col: 3 }, { row: 9, col: 9 },
    ];
  } else if (boardSize === 9) {
    return [
      { row: 2, col: 2 }, { row: 2, col: 6 },
      { row: 4, col: 4 },
      { row: 6, col: 2 }, { row: 6, col: 6 },
    ];
  }
  return [];
}
