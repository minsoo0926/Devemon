const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { GlobalKeyboardListener } = require('node-global-key-listener');

// 키보드 리스너 인스턴스 생성
const keyboardListener = new GlobalKeyboardListener();

// 전역 참조 - 가비지 컬렉션 방지
let mainWindow;
let keystrokeCount = 0;
let currentLevel = 1;
let levelProgress = 0;
let keystrokesToNextLevel = 100; // 레벨 1의 초기값

// SPM 추적
let keystrokesInLastMinute = [];
let currentSPM = 0;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // 브라우저 창 생성
  mainWindow = new BrowserWindow({
    width: 200,
    height: 300,
    x: width - 220, // 오른쪽 가장자리 근처에 위치
    y: 100,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // index.html 파일 로드
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  // 개발 모드
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
  
  // 키보드 모니터링 설정
  setupKeyboardMonitoring();
  
  // 현재 통계로 UI 업데이트 (100ms마다)
  setInterval(() => {
    updateLevelSystem();
    sendStatsToRenderer();
  }, 100);

  // SPM 계산 업데이트 (1초마다)
  setInterval(() => {
    updateSPM();
  }, 1000);

  // 창에서 드래그 가능하도록 설정
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      document.body.style.webkitAppRegion = 'drag';
      document.querySelector('.exit-button').style.webkitAppRegion = 'no-drag';
    `);
  });

  // 창 닫기 처리
  mainWindow.on('closed', () => {
    mainWindow = null;
    keyboardListener.kill(); // 키보드 리스너 종료
  });
}

function setupKeyboardMonitoring() {
  // 키 눌림 이벤트 리스너 등록
  keyboardListener.addListener(function(e, down) {
    if (down) {
      // 키가 눌렸을 때만 카운트
      keystrokeCount++;
      keystrokesInLastMinute.push(Date.now());
    }
  });
}

function updateSPM() {
  // 1분보다 오래된 키 입력 제거
  const oneMinuteAgo = Date.now() - 60000;
  keystrokesInLastMinute = keystrokesInLastMinute.filter(timestamp => timestamp > oneMinuteAgo);
  
  // 현재 SPM 계산
  currentSPM = keystrokesInLastMinute.length;
}

function calculateKeystrokesForLevel(level) {
  // Python 버전과 동일한 지수 곡선
  return 100 * Math.pow(2, level - 1);
}

function updateLevelSystem() {
  // 다음 레벨에 도달했는지 확인
  while (keystrokeCount >= keystrokesToNextLevel) {
    currentLevel++;
    keystrokeCount -= keystrokesToNextLevel;
    keystrokesToNextLevel = calculateKeystrokesForLevel(currentLevel);
  }
  
  // 레벨 진행 상황 계산 (0.0에서 1.0)
  levelProgress = keystrokeCount / keystrokesToNextLevel;
}

function sendStatsToRenderer() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('stats-update', {
      keystrokeCount,
      currentLevel,
      levelProgress,
      spm: currentSPM
    });
  }
}

// 테스트용 - 렌더러에서 키 입력 수신
ipcMain.on('keystroke', () => {
  keystrokeCount++;
  keystrokesInLastMinute.push(Date.now());
});

// IPC 핸들러
ipcMain.on('exit-app', () => {
  keyboardListener.kill(); // 종료 전 키보드 리스너 정리
  app.quit();
});

// Electron 초기화가 완료되면 이 메소드가 호출됨
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    // macOS에서는 dock 아이콘을 클릭하고 다른 창이 열려 있지 않을 때
    // 앱에서 창을 다시 생성하는 것이 일반적입니다.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// macOS를 제외한 모든 창이 닫히면 종료
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    keyboardListener.kill(); // 종료 전 키보드 리스너 정리
    app.quit();
  }
});
