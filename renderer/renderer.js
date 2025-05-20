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
const resetButton = document.querySelector('.reset-button');

// Manual keystroke button (hidden by default, shown if keyboard monitoring fails)
let manualKeystrokeBtn = document.createElement('button');
manualKeystrokeBtn.innerText = 'Click for Keystroke';
manualKeystrokeBtn.className = 'manual-keystroke-btn';
manualKeystrokeBtn.style.display = 'none';
document.querySelector('.stats-container').appendChild(manualKeystrokeBtn);

// Retry keyboard monitoring button (hidden by default, shown if keyboard monitoring fails)
let retryButton = document.createElement('button');
retryButton.innerText = 'Retry Keyboard Monitoring';
retryButton.className = 'retry-btn';
retryButton.style.display = 'none';
document.querySelector('.stats-container').appendChild(retryButton);

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

// Handle keyboard monitoring errors
window.api.receive('keyboard-monitor-error', (error) => {
  console.log('Keyboard monitoring error:', error);
  manualKeystrokeBtn.style.display = 'block';
  retryButton.style.display = 'block';
  
  // 에러 메시지가 "No keystrokes detected"인 경우에는 자동으로 경고창을 표시하지 않음
  if (!error.message.includes('No keystrokes detected')) {
    // Check if we're on macOS (platform is injected from main process in stats)
    if (window.isMacOS) {
      alert('Keyboard monitoring requires permission on macOS.\n\nPlease allow "Input Monitoring" permission in System Settings > Privacy & Security > Input Monitoring for Devemon.\n\nAfter granting permissions, click "Retry Keyboard Monitoring" or use the manual keystroke button.');
    } else {
      alert('Keyboard monitoring failed. Please click "Retry Keyboard Monitoring" or use the manual keystroke button instead.');
    }
  }
  
  // 애플리케이션 빌드 시 메시지 추가
  document.querySelector('.info-message').textContent = 
    'Keyboard monitoring inactive. Using manual input mode. Click the green button to register keystrokes.';
});

// Handle keystroke after timeout
window.api.receive('keystroke-after-timeout', () => {
  console.log('Keyboard monitoring resumed');
  manualKeystrokeBtn.style.display = 'none';
  retryButton.style.display = 'none';
  // Clear info message
  document.querySelector('.info-message').textContent = '';
});

// Manual keystroke button handler
manualKeystrokeBtn.addEventListener('click', () => {
  window.api.send('keystroke');
});

// Retry button handler
retryButton.addEventListener('click', () => {
  // Send message to main process to retry keyboard monitoring
  window.api.send('retry-keyboard-monitoring');
  
  // Show message to user
  alert('Retrying keyboard monitoring. If you just granted permissions, this should work now.');
});

// Reset button handler
resetButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
    window.api.send('reset-data');
  }
});

function getEvolutionStage(level) {
  if (level <= 5) return 'baby';
  if (level <= 10) return 'child';
  if (level <= 15) return 'teen';
  if (level <= 20) return 'adult';
  return 'master';
}

function getCharacterFace(level, spm) {
  // Determine evolution stage based on level
  const evolutionStage = getEvolutionStage(level);
  
  // Determine if we should show fire eyes
  const onFire = spm >= 100;
  
  // Get the appropriate character set
  const characterSet = onFire 
    ? characterStates[evolutionStage].fire 
    : characterStates[evolutionStage].normal;
  
  // Choose a random face from the set
  const faceIndex = level % characterSet.length;
  return characterSet[faceIndex];
}

function updateUI(stats) {
  const { keystrokeCount, cumulativeKeystrokeCount, currentLevel, levelProgress, spm, name, isMacOS } = stats;
  
  // Update name if provided
  if (name && nameDisplay.style.display !== 'none') {
    nameDisplay.textContent = name;
  }
  
  // Store platform info
  window.isMacOS = isMacOS;
  
  // Update evolution stage if needed
  currentEvolution = getEvolutionStage(currentLevel);
  
  // Update character face
  characterElement.textContent = getCharacterFace(currentLevel, spm);
  
  // Update level
  levelElement.textContent = `Level: ${currentLevel}`;
  
  // Update progress bar
  progressBar.style.width = `${levelProgress * 100}%`;
  
  // Update keystroke counter
  keystrokeCounter.textContent = `Keystrokes: ${cumulativeKeystrokeCount}`;
  
  // Update SPM counter and style
  spmCounter.textContent = `Per Minute: ${spm}`;
  
  // Add or remove 'on-fire' class based on SPM
  if (spm >= 100) {
    spmCounter.classList.add('on-fire');
  } else {
    spmCounter.classList.remove('on-fire');
  }
}