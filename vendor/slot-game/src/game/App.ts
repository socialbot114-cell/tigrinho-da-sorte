import { Application, Assets, isMobile } from "pixi.js";

import Reels from "./Reels";
import SpinButton from "../ui/SpinButton";
import GameUI from "../ui/GameUI";
import SoundToggleButton from "../ui/SoundToggleButton";

import { assetsManifest } from "../utils/asset-manifest";
import { designConfig } from "../utils/config";
import { calculateScale } from "../utils/helpers";

export default class App {
  public app: Application;

  constructor() {
    this.app = new Application();
    this.init();
  }

  private async init() {
    await this.app.init({
      resizeTo: window,
      backgroundColor: designConfig.colors.primary,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    document.body.appendChild(this.app.canvas);

    for (const bundle of assetsManifest.bundles) {
      Assets.addBundle(bundle.name, bundle.assets);
    }

    await Promise.all(
      assetsManifest.bundles.map((bundle) => Assets.loadBundle(bundle.name)),
    );

    const reels = new Reels(this.app);
    await reels.createReels();
    const bounds = reels.getLocalBounds();
    reels.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

    const spinButton = new SpinButton();
    spinButton.anchor.set(0.5);
    spinButton.on("pointerup", async () => {
      await reels.spin(spinButton.setEnabled.bind(spinButton));
    });

    const gameUI = new GameUI(this.app.screen.width, designConfig.ui.height);

    const soundToggle = new SoundToggleButton();
    soundToggle.x = this.app.screen.width - 60;
    soundToggle.y = 10;

    reels.onWinUpdate = (winAmount) => {
      gameUI.updateWin(winAmount);
      gameUI.updateBalance(reels.balance);
    };

    const centerUI = () => {
      reels.x = this.app.screen.width / 2;
      reels.y = this.app.screen.height / 2 - designConfig.ui.height / 2;

      if (isMobile.any || this.app.screen.width <= 768) {
        spinButton.x = reels.x;
        spinButton.y = reels.y + reels.height / 2 + spinButton.height / 2 + 40;
      } else {
        spinButton.x = reels.x + reels.width / 2 + spinButton.width / 2 + 40;
        spinButton.y = reels.y;
      }

      gameUI.x = 0;
      gameUI.y = this.app.screen.height - gameUI.height;
      gameUI.width = this.app.screen.width;

      soundToggle.x = this.app.screen.width - 120;
      soundToggle.y = 60;
    };

    this.app.stage.addChild(reels);
    this.app.stage.addChild(spinButton);
    this.app.stage.addChild(gameUI);
    this.app.stage.addChild(soundToggle);

    const resizeUI = () => {
      const scale = calculateScale(this.app.screen.width);
      reels.scale.set(scale);
      spinButton.scale.set(scale);
      gameUI.scale.set(scale);
      centerUI();
    };

    resizeUI();
    window.addEventListener("resize", resizeUI);
  }
}
