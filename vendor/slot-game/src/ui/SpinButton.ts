import { Sprite, Texture, Ticker } from "pixi.js";
import { calculateScale } from "../utils/helpers";

export default class SpinButton extends Sprite {
  private targetScale = 1;
  private screenScale: number;
  private animationTicker?: Ticker;

  constructor() {
    super(Texture.from("spin-button"));
    this.eventMode = "static";
    this.cursor = "pointer";
    this.screenScale = calculateScale(window.innerWidth);

    this.on("pointerdown", () => {
      this.animateButtonClick(0.8);
    });

    this.on("pointerup", () => {
      this.animateButtonClick(1);
    });

    this.on("pointerupoutside", () => {
      this.animateButtonClick(1);
    });

    this.on("pointerout", () => {
      this.animateButtonClick(1);
    });
  }

  public setEnabled(enabled: boolean) {
    this.eventMode = enabled ? "static" : "none";
    this.alpha = enabled ? 1 : 0.5;
  }

  private animateButtonClick(target: number) {
    this.targetScale = target * this.screenScale;
    const speed = 0.2;
    const scaleValue = (this.targetScale - this.scale.x) * speed;
    if (!this.animationTicker) {
      this.animationTicker = new Ticker();
      this.animationTicker.add(() => {
        this.scale.x += scaleValue;
        this.scale.y += scaleValue;
        if (Math.abs(this.scale.x - this.targetScale) < 0.01) {
          this.scale.set(this.targetScale);
          this.animationTicker?.stop();
          this.animationTicker?.destroy();
          this.animationTicker = undefined;
        }
      });
      this.animationTicker.start();
    }
  }
}
