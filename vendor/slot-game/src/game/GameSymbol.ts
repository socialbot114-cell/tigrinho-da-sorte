import { Assets, Container, Graphics, Sprite, Ticker } from "pixi.js";
import { designConfig, reelsConfig } from "../utils/config";

export default class GameSymbol extends Container {
  public index: number;
  public isWinning: boolean;

  private symbolSprite?: Sprite;
  private frameSprite?: Sprite;
  private winTicker: Ticker | null;
  private winTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(index: number) {
    super();
    this.index = index;
    this.isWinning = false;
    this.winTicker = null;
  }
  async createSymbol() {
    const bg = new Graphics()
      .rect(
        -reelsConfig.SYMBOL_SIZE / 2,
        -reelsConfig.SYMBOL_SIZE / 2,
        reelsConfig.SYMBOL_SIZE,
        reelsConfig.SYMBOL_SIZE,
      )
      .fill(designConfig.colors.primary);

    this.addChild(bg);

    const symbolName = `${reelsConfig.SYMBOL_PREFIX}${this.index}`;

    try {
      const symbolTexture = Assets.get(`${symbolName}-symbol`);
      this.symbolSprite = new Sprite(symbolTexture);
      this.symbolSprite.anchor.set(0.5);
      this.symbolSprite.width = reelsConfig.SYMBOL_SIZE;
      this.symbolSprite.height = reelsConfig.SYMBOL_SIZE;
      this.addChild(this.symbolSprite);
    } catch (error) {
      console.warn("Failed to get symbol texture:", error);
    }

    try {
      const frameTexture = Assets.get(`${symbolName}-frame`);
      this.frameSprite = new Sprite(frameTexture);
      this.frameSprite.anchor.set(0.5);
      this.frameSprite.width = reelsConfig.SYMBOL_SIZE;
      this.frameSprite.height = reelsConfig.SYMBOL_SIZE;
      this.addChild(this.frameSprite);
    } catch (error) {
      console.warn("Failed to get frame texture:", error);
    }
  }

  public setSymbolIndex(index: number) {
    const symbolName = `${reelsConfig.SYMBOL_PREFIX}${index}`;
    if (this.symbolSprite) {
      try {
        const symbolTexture = Assets.get(`${symbolName}-symbol`);
        this.symbolSprite.texture = symbolTexture;
      } catch (error) {
        console.warn("Failed to get symbol texture:", error);
      }
    }
    if (this.frameSprite) {
      try {
        const frameTexture = Assets.get(`${symbolName}-frame`);
        this.frameSprite.texture = frameTexture;
      } catch (error) {
        console.warn("Failed to get frame texture:", error);
      }
    }
  }

  public bounce(y: number) {
    const bounceHeight = 10;
    const bounceFrames = 15;
    const settleFrames = 15;
    let frame = 0;
    const startY = y;
    const upY = y - bounceHeight;

    this.y = upY;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 2);
    const easeIn = (t: number) => t * t;

    const ticker = new Ticker();
    ticker.add(() => {
      if (frame < bounceFrames) {
        const t = frame / bounceFrames;
        this.y = upY + (startY - upY) * easeOut(t);
      } else if (frame < bounceFrames + settleFrames) {
        const t = (frame - bounceFrames) / settleFrames;
        this.y = startY + 4 * (1 - easeIn(t));
      } else {
        this.y = startY;
        ticker.stop();
        ticker.destroy();
      }
      frame++;
    });
    ticker.start();
  }

  public setWinning(isWinning: boolean) {
    this.isWinning = isWinning;
    if (isWinning) {
      this.startWinAnimation();
    } else {
      this.stopWinAnimation();
    }
  }

  private startWinAnimation() {
    if (this.winTicker) {
      this.stopWinAnimation();
    }
    if (this.winTimeout) {
      clearTimeout(this.winTimeout);
      this.winTimeout = null;
    }

    this.winTicker = new Ticker();
    let time = 0;

    this.winTicker.add(() => {
      time += 0.15;
      const pulse = 1 + Math.sin(time) * 0.1;
      this.scale.set(pulse);

      if (this.frameSprite) {
        this.frameSprite.alpha = 0.7 + Math.sin(time * 2) * 0.3;
      }
    });

    this.winTicker.start();

    this.winTimeout = setTimeout(() => {
      this.setWinning(false);
      this.winTimeout = null;
    }, 2000);
  }

  public stopWinAnimation() {
    if (this.winTimeout) {
      clearTimeout(this.winTimeout);
      this.winTimeout = null;
    }
    if (this.winTicker) {
      this.winTicker.stop();
      this.winTicker.destroy();
      this.winTicker = null;
    }

    this.scale.set(1);

    if (this.frameSprite) {
      this.frameSprite.alpha = 1;
    }
  }

  override destroy(
    options?:
      | boolean
      | { children?: boolean; texture?: boolean; baseTexture?: boolean },
  ) {
    this.stopWinAnimation();
    super.destroy(options);
  }
}
