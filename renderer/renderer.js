// DOM Elements
const nameDisplay = document.getElementById('name-display');
const nameEditContainer = document.getElementById('name-edit-container');
const nameInput = document.getElementById('name-input');
const saveNameBtn = document.getElementById('save-name-btn');
const characterElement = document.querySelector('.character');
const levelElement = document.querySelector('.level');
const progressBar = document.querySelector('.progress-bar');
const keystrokeCounter = document.querySelector('.keystroke-counter');
const spmCounter = document.querySelector('.spm-counter');
const exitButton = document.querySelector('.exit-button');

// Character states based on evolution level
const characterStates = {
  baby: {
    normal: ['^_^', '^o^', '^v^'],
    fire: ['🔥_🔥', '🔥o🔥', '🔥v🔥']
  },
  child: {
    normal: ['•ᴗ•', '•o•', '•ᴥ•'],
    fire: ['🔥ᴗ🔥', '🔥o🔥', '🔥ᴥ🔥']
  },
  teen: {
    normal: ['◕‿◕', '◕o◕', '◕ᴥ◕'],
    fire: ['🔥‿🔥', '🔥o🔥', '🔥ᴥ🔥']
  },
  adult: {
    normal: ['⚆_⚆', '⚆ω⚆', '⚆ᴥ⚆'],
    fire: ['🔥_🔥', '🔥ω🔥', '🔥ᴥ🔥']
  },
  master: {
    normal: ['★_★', '★ω★', '★ᴥ★'],
    fire: ['🔥_🔥', '🔥ω🔥', '🔥ᴥ🔥']
  }
};

// Current character evolution
let currentEvolution = 'baby';

// Name edit functionality
nameDisplay.addEventListener('click', () => {
  // Show edit form
  nameDisplay.style.display = 'none';
  nameEditContainer.style.display = 'flex';
  nameInput.value = nameDisplay.textContent;
  nameInput.focus();
});

// Save name button
saveNameBtn.addEventListener('click', saveName);

// Also save on Enter key
nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveName();
  }
});

// Function to save the name
function saveName() {
  const newName = nameInput.value.trim();
  if (newName) {
    nameDisplay.textContent = newName;
    window.api.send('update-name', newName);
  }
  
  // Hide edit form
  nameDisplay.style.display = 'block';
  nameEditContainer.style.display = 'none';
}

// Exit button handler
exitButton.addEventListener('click', () => {
  window.api.send('exit-app');
});

// Update UI with stats from main process
window.api.receive('stats-update', (stats) => {
  updateUI(stats);
});

function getEvolutionStage(level) {
  if (level < 5) return 'baby';
  if (level < 10) return 'child';
  if (level < 15) return 'teen';
  if (level < 20) return 'adult';
  return 'master';
}

function getCharacterFace(level, spm) {
  // Determine evolution stage based on level
  const evolutionStage = getEvolutionStage(level);
  
  // Determine if we should show fire eyes
  const onFire = spm > 100;
  
  // Get the appropriate character set
  const characterSet = onFire 
    ? characterStates[evolutionStage].fire 
    : characterStates[evolutionStage].normal;
  
  // Choose a random face from the set
  const faceIndex = level % characterSet.length;
  return characterSet[faceIndex];
}

function updateUI(stats) {
  const { keystrokeCount, currentLevel, levelProgress, spm, name } = stats;
  
  // Update name if provided
  if (name && nameDisplay.style.display !== 'none') {
    nameDisplay.textContent = name;
  }
  
  // Update evolution stage if needed
  currentEvolution = getEvolutionStage(currentLevel);
  
  // Update character face
  characterElement.textContent = getCharacterFace(currentLevel, spm);
  
  // Update level
  levelElement.textContent = `Level: ${currentLevel}`;
  
  // Update progress bar
  progressBar.style.width = `${levelProgress * 100}%`;
  
  // Update keystroke counter
  keystrokeCounter.textContent = `Keystrokes: ${keystrokeCount}`;
  
  // Update SPM counter and style
  spmCounter.textContent = `SPM: ${spm}`;
  
  // Add or remove 'on-fire' class based on SPM
  if (spm > 100) {
    spmCounter.classList.add('on-fire');
  } else {
    spmCounter.classList.remove('on-fire');
  }
}