# PixiJS Slot Game

A simple slot machine game built with [PixiJS](https://pixijs.com/) and TypeScript.  
This project demonstrates a modular approach to building a slot game, including reels, symbols, UI, and asset management.

## Project Structure

```
.
├── public/                # Static assets (images, sounds, styles)
├── src/                   # Source code
│   ├── game/              # Core game logic
│   │   ├── App.ts         # Main application entry point
│   │   ├── GameSymbol.ts  # Symbol logic and animation
│   │   └── Reels.ts       # Reel logic, spinning, win checking
│   ├── ui/                # UI components
│   │   ├── GameUI.ts      # Top bar UI (balance, bet, win)
│   │   └── SpinButton.ts  # Spin button with animation
│   └── utils/             # Utility modules
│       ├── asset-manifest.ts # Asset manifest for PixiJS loader
│       ├── config.ts         # Game configuration constants
│       └── helpers.ts        # Helper functions (random, scaling)
├── index.html             # Main HTML file
├── package.json           # NPM scripts and dependencies
└── vite.config.ts         # Vite configuration
```

## Main Classes & Modules

### [`App`](src/game/App.ts)

- **Purpose:** Initializes the PixiJS application, loads assets, and sets up the main game scene.
- **Key Methods:**
  - `constructor()`: Creates the PixiJS app and calls `init()`.
  - `private async init()`: Loads assets, creates reels, UI, and handles resizing.

### [`Reels`](src/game/Reels.ts)

- **Purpose:** Manages the slot reels, spinning logic, win checking, and symbol highlighting.
- **Key Properties:**
  - `isSpinning`: Whether the reels are currently spinning.
  - `balance`: Player's current balance.
- **Key Methods:**
  - `async createReels()`: Initializes the reels and symbols.
  - `async spin(disableSpin)`: Spins the reels, updates balance, checks for wins.
  - `private animateReel(...)`: Animates a single reel's spin.
  - `private checkWin(result)`: Checks for winning lines and calculates win amount.
  - `private highlightWinningSymbols(positions)`: Highlights winning symbols.
  - `private clearHighlights()`: Clears all win highlights.

### [`GameSymbol`](src/game/GameSymbol.ts)

- **Purpose:** Represents a single symbol on the reels, handles its appearance and win animations.
- **Key Properties:**
  - `index`: Symbol type/index.
  - `isWinning`: Whether this symbol is part of a win.
- **Key Methods:**
  - `async createSymbol()`: Loads and displays the symbol and its frame.
  - `setSymbolIndex(index)`: Changes the symbol's appearance.
  - `bounce(y)`: Plays a bounce animation when the reel stops.
  - `setWinning(isWinning)`: Starts/stops win animation.
  - `startWinAnimation()`, `stopWinAnimation()`: Animate symbol when part of a win.

### [`GameUI`](src/ui/GameUI.ts)

- **Purpose:** Displays the top bar with balance, bet, and win amounts.
- **Key Methods:**
  - `constructor(width, height)`: Lays out the UI elements.
  - `updateBalance(balance)`: Updates the displayed balance.
  - `updateWin(win)`: Updates the displayed win amount.

### [`SpinButton`](src/ui/SpinButton.ts)

- **Purpose:** Interactive button to trigger a spin, with animated feedback.
- **Key Methods:**
  - `setEnabled(enabled)`: Enables/disables the button.
  - `private animateButtonClick(target)`: Animates the button when pressed/released.

### [`asset-manifest.ts`](src/utils/asset-manifest.ts)

- **Purpose:** Defines the asset bundles for PixiJS to load (symbols, frames, UI icons).

### [`config.ts`](src/utils/config.ts)

- **Purpose:** Centralized configuration for reels, design, and betting.

### [`helpers.ts`](src/utils/helpers.ts)

- **Purpose:** Utility functions for random symbol generation and responsive scaling.

## Running the Project

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Start the development server:**

   ```sh
   npm run dev
   ```

3. **Build for production:**

   ```sh
   npm run build
   ```

4. **Lint the code:**
   ```sh
   npm run lint
   ```

## Customization

- **Assets:** Place your images and sounds in `public/assets/`.
- **Config:** Adjust grid size, symbol size, colors, and bet values in [`config.ts`](src/utils/config.ts).
- **UI:** Modify the layout or style in [`GameUI.ts`](src/ui/GameUI.ts) and [`public/style.css`](public/style.css).

## License

MIT

---
