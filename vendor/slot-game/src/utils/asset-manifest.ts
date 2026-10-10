import { AssetsManifest } from "pixi.js";

export const assetsManifest: AssetsManifest = {
  bundles: [
    {
      name: "sym1",
      assets: [
        { alias: "sym1-symbol", src: "assets/sym1.png" },
        { alias: "sym1-frame", src: "assets/sym1_frame.png" },
      ],
    },
    {
      name: "sym2",
      assets: [
        { alias: "sym2-symbol", src: "assets/sym2.png" },
        { alias: "sym2-frame", src: "assets/sym2_frame.png" },
      ],
    },
    {
      name: "sym3",
      assets: [
        { alias: "sym3-symbol", src: "assets/sym3.png" },
        { alias: "sym3-frame", src: "assets/sym3_frame.png" },
      ],
    },
    {
      name: "sym4",
      assets: [
        { alias: "sym4-symbol", src: "assets/sym4.png" },
        { alias: "sym4-frame", src: "assets/sym4_frame.png" },
      ],
    },
    {
      name: "game-ui",
      assets: [
        { alias: "spin-button", src: "assets/spin.svg" },
        { alias: "logo", src: "assets/logo.svg" },
      ],
    },
    {
      name: "sound",
      assets: [
        { alias: "sound-on", src: "assets/sound-on.svg" },
        { alias: "sound-off", src: "assets/sound-off.svg" },
      ],
    },
  ],
};
