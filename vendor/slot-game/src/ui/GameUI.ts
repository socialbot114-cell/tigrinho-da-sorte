import {
  Container,
  FillGradient,
  Graphics,
  BitmapText,
  TextStyle,
} from "pixi.js";

import { betConfig, designConfig } from "../utils/config";
import { calculateScale } from "../utils/helpers";

class GameUI extends Container {
  private balanceAmount: BitmapText;
  private betAmount: BitmapText;
  private winAmount: BitmapText;
  private betLabel: BitmapText;
  private winLabel: BitmapText;
  private balanceLabel: BitmapText;

  constructor(width: number, height: number) {
    super();

    const backgroundContainer = new Graphics();
    backgroundContainer.rect(0, 0, width, height);

    backgroundContainer.fill(designConfig.colors.accent);
    this.addChild(backgroundContainer);

    const textStyle = new TextStyle(designConfig.ui.textStyle);

    this.betAmount = new BitmapText({
      text: `$${betConfig.BET}`,
      style: textStyle,
    });
    this.winAmount = new BitmapText({
      text: "",
      style: textStyle,
    });
    this.balanceAmount = new BitmapText({
      text: `$${betConfig.BALANCE}`,
      style: textStyle,
    });

    this.betLabel = new BitmapText({
      text: "BET",
      style: textStyle,
    });
    this.winLabel = new BitmapText({
      text: "WIN",
      style: textStyle,
    });
    this.balanceLabel = new BitmapText({
      text: "BALANCE",
      style: textStyle,
    });

    const underline = (w: number) => {
      const gradient = new FillGradient({
        type: "radial",
        center: { x: 0.5, y: 0.5 },
        innerRadius: 0.25,
        outerCenter: { x: 0.5, y: 0.5 },
        outerRadius: 0.5,
        colorStops: [
          { offset: 0, color: designConfig.colors.secondary },
          { offset: 1, color: designConfig.colors.accent },
        ],
      });

      return new Graphics().rect(0, 0, w, 2).fill(gradient);
    };

    const columns = [
      { value: this.betAmount, label: this.betLabel },
      { value: this.winAmount, label: this.winLabel },
      { value: this.balanceAmount, label: this.balanceLabel },
    ];

    const maxColWidth = 200 * calculateScale(width);

    const totalWidth = maxColWidth * columns.length;
    const startX = (width - totalWidth) / 2;
    const valueY = height / 2 - 10;
    const labelY = valueY + 28;
    const underlineY = valueY + 8;

    let x = startX;
    columns.forEach((col) => {
      col.value.anchor.set(0.5, 1);
      col.value.x = x + maxColWidth / 2;
      col.value.y = valueY;

      col.label.anchor.set(0.5, 0);
      col.label.x = col.value.x;
      col.label.y = labelY;

      const ul = underline(maxColWidth - 8);
      ul.x = col.value.x - (maxColWidth - 8) / 2;
      ul.y = underlineY + 6;
      this.addChild(col.value, col.label, ul);

      x += maxColWidth;
    });
  }
  public updateBalance(balance: number) {
    this.balanceAmount.text = `$${balance}`;
  }

  public updateWin(win: number) {
    this.winAmount.text = win ? `$${win}` : "";
  }
}

export default GameUI;
