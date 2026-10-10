import { reelsConfig } from "./config";

export function getRandomSymbolIndex() {
  return Math.floor(Math.random() * 4) + 1;
}

export function generateRandomResult(): number[][] {
  const result: number[][] = [];

  for (let col = 0; col < reelsConfig.GRID_SIZE; col++) {
    const reelResult: number[] = [];
    for (let row = 0; row < reelsConfig.GRID_SIZE; row++) {
      const symbolIndex = getRandomSymbolIndex();
      reelResult.push(symbolIndex);
    }
    result.push(reelResult);
  }

  return result;
}

export function calculateScale(screenWidth: number) {
  if (screenWidth >= 1280) return 1.0;
  if (screenWidth >= 1024) return 0.85;
  if (screenWidth >= 480) return 0.75;
  return 0.5;
}
