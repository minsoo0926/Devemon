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
- Global keyboard monitoring without needing focus
- Custom naming for your Devemon
- Persistent progress saving

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

## Naming Your Devemon

Click on the name tag at the top of the widget to give your Devemon a custom name. Your chosen name will be saved along with your progress.

## Progress Saving

Devemon automatically saves your progress to your local user data directory. This includes:
- Your Devemon's name
- Current level
- Keystroke count

Your progress is saved:
- Every 60 seconds while the app is running
- When you change your Devemon's name
- When you close the application

When you restart the app, your Devemon will be exactly as you left it!

## Global Keyboard Monitoring

Devemon monitors keystrokes globally across your system, meaning:

- You don't need to focus on the Devemon window
- It works while you're coding in any application
- Your SPM (strokes per minute) is calculated based on keystrokes in the last 60 seconds
- Your character evolves as you type more

## Permissions

On first run, you may need to grant certain permissions:

- **macOS**: You might need to allow Accessibility permissions in System Preferences > Security & Privacy > Privacy > Accessibility
- **Windows**: You might need to run the app as Administrator the first time

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

- `electron/main.js`: Main Electron process that handles global keyboard monitoring, level calculations, and data persistence
- `electron/preload.js`: Preload script for secure IPC communication
- `renderer/`: Contains the UI components (HTML, CSS, JS)

## License

MIT