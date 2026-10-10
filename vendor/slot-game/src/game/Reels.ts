import { Application, BlurFilter, Container, Graphics } from "pixi.js";
import { sound } from "@pixi/sound";

import GameSymbol from "./GameSymbol";

import { reelsConfig, betConfig, designConfig } from "../utils/config";
import { generateRandomResult, getRandomSymbolIndex } from "../utils/helpers";

export default class Reels extends Container {
  private app: Application;
  private readonly reels: Container[] = [];
  private readonly symbols: GameSymbol[] = [];
  private readonly reelMask: Graphics;
  private isSpinning = false;

  public balance = betConfig.BALANCE;
  public onWinUpdate?: (winAmount: number) => void;

  constructor(app: Application) {
    super();
    this.app = app;
    this.reelMask = this.createReelMask();
  }

  private spinSound = sound.add("spin", {
    url: "assets/sounds/spin.mp3",
  });

  private winSound = sound.add("win", {
    url: "assets/sounds/win.mp3",
  });

  public async createReels() {
    const totalSymbols = Math.pow(reelsConfig.GRID_SIZE, 2);
    for (let i = 0; i < reelsConfig.GRID_SIZE; i++) {
      const reel = new Container();
      reel.x = i * reelsConfig.SYMBOL_SIZE;
      reel.y = 0;
      this.reels.push(reel);
      this.addChild(reel);

      for (let j = 0; j < totalSymbols; j++) {
        const symbolIndex = getRandomSymbolIndex();
        const symbol = new GameSymbol(symbolIndex);
        symbol.cullable = true;
        symbol.position.set(
          reelsConfig.SYMBOL_SIZE / 2,
          j * reelsConfig.SYMBOL_SIZE + reelsConfig.SYMBOL_SIZE / 2,
        );
        await symbol.createSymbol();
        reel.addChild(symbol);
        this.symbols.push(symbol);
      }
    }
    this.addChild(this.reelMask);
    this.mask = this.reelMask;
  }

  private createReelMask(): Graphics {
    const mask = new Graphics()
      .rect(
        0,
        0,
        reelsConfig.SYMBOL_SIZE * reelsConfig.GRID_SIZE,
        reelsConfig.GRID_SIZE * reelsConfig.SYMBOL_SIZE,
      )
      .fill(designConfig.colors.primary);
    return mask;
  }

  public async spin(disableSpin: (enabled: boolean) => void) {
    if (this.isSpinning) return;

    this.spinSound.play({ speed: 1 });
    this.isSpinning = true;
    this.balance -= betConfig.BET;
    disableSpin(!this.isSpinning);

    const precalculatedResult = generateRandomResult();

    await Promise.all(
      this.reels.map((reel, i) =>
        this.animateReel(reel, i, precalculatedResult[i]),
      ),
    );

    this.isSpinning = false;

    this.clearHighlights();
    disableSpin(!this.isSpinning);
    const { winAmount, winningPositions } = this.checkWin(precalculatedResult);
    if (winAmount) {
      this.winSound.play();
      this.balance += winAmount;
      if (this.onWinUpdate) this.onWinUpdate(winAmount);
      this.highlightWinningSymbols(winningPositions);
    } else {
      if (this.onWinUpdate) this.onWinUpdate(0);
    }
  }

  private animateReel(
    reel: Container,
    index: number,
    targetSymbols: number[],
  ): Promise<void> {
    return new Promise((resolve) => {
      const duration =
        reelsConfig.SPIN_DURATION + index * reelsConfig.REEL_OFFSET_TIME;
      const fastSpeed = 30;
      const slowSpeed = 15;
      const slowDownTime = 1000;
      const reelHeight = reelsConfig.GRID_SIZE * reelsConfig.SYMBOL_SIZE;

      reel.filters = [new BlurFilter({ strength: 7 })];

      const startTime = performance.now();

      const ticker = () => {
        const now = performance.now();
        const elapsed = now - startTime;
        let speed = fastSpeed;

        if (elapsed > duration - slowDownTime) {
          const t = Math.min(
            (elapsed - (duration - slowDownTime)) / slowDownTime,
            1,
          );
          speed = fastSpeed + (slowSpeed - fastSpeed) * t;
        }

        for (const symbol of reel.children as GameSymbol[]) {
          symbol.y += speed;
          if (symbol.y >= reelHeight) {
            symbol.y -= reelHeight;
            symbol.setSymbolIndex(getRandomSymbolIndex());
          }
        }

        if (elapsed >= duration) {
          const sortedSymbols = [...(reel.children as GameSymbol[])].sort(
            (a, b) => a.y - b.y,
          );

          for (let row = 0; row < reelsConfig.GRID_SIZE; row++) {
            const symbol = sortedSymbols[row];
            const finalY =
              row * reelsConfig.SYMBOL_SIZE + reelsConfig.SYMBOL_SIZE / 2;
            symbol.setSymbolIndex(targetSymbols[row]);
            symbol.bounce(finalY);
          }

          for (
            let row = reelsConfig.GRID_SIZE;
            row < sortedSymbols.length;
            row++
          ) {
            const symbol = sortedSymbols[row];
            symbol.y =
              row * reelsConfig.SYMBOL_SIZE + reelsConfig.SYMBOL_SIZE / 2;
          }

          reel.filters = [];
          this.app.ticker.remove(ticker);
          resolve();
        }
      };

      this.app.ticker.add(ticker);
    });
  }

  private checkWin(result: number[][]): {
    winAmount: number;
    winningPositions: [number, number][];
  } {
    let winAmount = 0;
    const winningPositions: [number, number][] = [];

    for (let row = 0; row < reelsConfig.GRID_SIZE; row++) {
      let current = result[0][row];
      let spin: [number, number][] = [[0, row]];
      let isWinningSpin = true;

      for (let col = 1; col < reelsConfig.GRID_SIZE; col++) {
        if (result[col][row] === current && isWinningSpin) {
          spin.push([col, row]);
        } else {
          if (spin.length >= 2 && spin[0][0] === 0) {
            winAmount += spin.length;
            winningPositions.push(...spin);
          }

          current = result[col][row];
          spin = [[col, row]];
          isWinningSpin = false;
        }
      }
      if (spin.length >= 2 && spin[0][0] === 0) {
        winAmount += spin.length;
        winningPositions.push(...spin);
      }
    }

    return { winAmount, winningPositions };
  }

  private highlightWinningSymbols(winningPositions: [number, number][]) {
    for (const [col, row] of winningPositions) {
      const reel = this.reels[col];
      const sortedSymbols = [...(reel.children as GameSymbol[])].sort(
        (a, b) => a.y - b.y,
      );
      const symbol = sortedSymbols[row];
      if (symbol) symbol.setWinning(true);
    }
  }

  private clearHighlights() {
    for (const symbol of this.symbols) {
      symbol.stopWinAnimation();
    }
  }
}
