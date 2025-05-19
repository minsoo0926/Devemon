# Devemon

A coder's tamagotchi that motivates you while coding.

## Description

Devemon is a small desktop widget that runs in the background and monitors your keyboard activity while you code. As you type more, your Devemon character levels up and evolves, providing motivation to keep coding.

## Features

- Cross-platform (Windows and macOS)
- Always-on-top widget
- Keystroke counter
- Real-time strokes per minute (SPM) tracking
- Fire eyes when typing speed exceeds 100 SPM
- Character evolution based on level
- Level progression system with exponential difficulty

## Character Evolution

As you type and gain levels, your Devemon will evolve through different stages:

1. **Baby** (Level 1-4): Simple emoji faces (e.g., ^_^)
2. **Child** (Level 5-9): Slightly more complex faces (e.g., •ᴗ•)
3. **Teen** (Level 10-14): More detailed faces (e.g., ◕‿◕)
4. **Adult** (Level 15-19): Advanced faces (e.g., ⚆_⚆)
5. **Master** (Level 20+): Special character with star eyes (e.g., ★_★)

When your typing speed exceeds 100 strokes per minute, your Devemon will show fire eyes (🔥) to indicate you're "on fire"!

## Requirements

- Node.js 14+
- npm or yarn

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

## Usage

### Development Mode

Run the application in development mode:

```
npm run dev
```

or

```
yarn dev
```

### Production Mode

Run the application:

```
npm start
```

or

```
yarn start
```

### Building Executable

To build a standalone executable:

```
npm run build
```

or

```
yarn build
```

The Devemon widget will appear on your screen, staying on top of other windows. As you type in your IDE or text editor, Devemon will count your keystrokes and level up accordingly.

## Customizing Character Faces

You can customize the character faces by editing the `characterStates` object in `/renderer/renderer.js`. This allows you to define your own custom faces for each evolution stage and state (normal/fire).

```javascript
const characterStates = {
  baby: {
    normal: ['^_^', '^o^', '^v^'],
    fire: ['🔥_🔥', '🔥o🔥', '🔥v🔥']
  },
  // Add your own custom faces here
};
```

## Architecture

The application is built with Electron and consists of:

- `electron/main.js`: Main Electron process that handles keyboard monitoring and level calculations
- `electron/preload.js`: Preload script for secure IPC communication
- `renderer/`: Contains the UI components (HTML, CSS, JS)

## Keyboard Monitoring

Devemon uses Electron's globalShortcut API to monitor keystrokes. This method doesn't require native dependencies but has some limitations:

1. It can only detect keystrokes when the app has focus
2. It may not detect all keypresses in all applications

For the best experience, you may want to keep the Devemon window visible while coding.

## License

MIT