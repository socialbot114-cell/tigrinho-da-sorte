import { Container, Sprite } from "pixi.js";
import { sound } from "@pixi/sound";

class SoundToggleButton extends Container {
  private soundOnSprite: Sprite;
  private soundOffSprite: Sprite;
  private isSoundOn: boolean = true;

  constructor() {
    super();

    this.soundOnSprite = Sprite.from("sound-on");
    this.soundOffSprite = Sprite.from("sound-off");

    this.soundOnSprite.width = this.soundOffSprite.width = 50;
    this.soundOnSprite.height = this.soundOffSprite.height = 50;

    this.soundOffSprite.visible = false;

    this.addChild(this.soundOnSprite, this.soundOffSprite);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointertap", this.toggleSound, this);
  }

  private toggleSound() {
    this.isSoundOn = !this.isSoundOn;
    this.soundOnSprite.visible = this.isSoundOn;
    this.soundOffSprite.visible = !this.isSoundOn;

    if (this.isSoundOn) {
      sound.unmuteAll();
    } else {
      sound.muteAll();
    }
  }
}

export default SoundToggleButton;
