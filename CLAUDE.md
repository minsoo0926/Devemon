# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Devemon is a cross-platform "coder's tamagotchi" desktop widget application. It monitors keyboard activity while coding, featuring a level system and cute character that evolves as the developer types more code. It includes real-time SPM (strokes per minute) tracking and character evolution based on level progression.

## Architecture

The application is organized into the following structure:

- `electron/main.js`: Main Electron process that handles keyboard monitoring and level calculations
- `electron/preload.js`: Preload script for secure IPC communication
- `renderer/`: Contains the UI components (HTML, CSS, JS)
  - `index.html`: Main UI layout
  - `styles.css`: Styling for the widget
  - `renderer.js`: UI logic and character evolution system
- `package.json`: Defines package dependencies and scripts

## Development Environment

### Setup

```bash
# Install dependencies
npm install
```

### Running the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Building Executable

```bash
npm run build
```

### Dependencies

- Node.js 14+
- Electron: Cross-platform desktop framework

## Feature Details

### Keyboard Monitoring
The application uses Electron's globalShortcut API to detect keystrokes. It tracks both total keystrokes for level progression and recent keystrokes for SPM calculation.

### Character Evolution
Characters evolve through 5 stages based on level:
- Baby (Level 1-4)
- Child (Level 5-9)
- Teen (Level 10-14)
- Adult (Level 15-19)
- Master (Level 20+)

### SPM (Strokes Per Minute) Tracking
Tracks keystrokes in the last minute to calculate typing speed. When SPM exceeds 100, the character displays fire eyes.

### Customization
Character faces for each evolution stage are customizable in the `renderer.js` file by modifying the `characterStates` object.

## Implementation Details

- Uses Electron's globalShortcut API for cross-platform keyboard monitoring
- Implements an Electron-based always-on-top widget
- Features an exponential leveling system where each level requires more keystrokes
- Supports both Windows and macOS
- Includes character evolution based on level progression
- Tracks real-time SPM with visual feedback