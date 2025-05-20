const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// 라이브러리 로딩 방식 개선
let GlobalKeyboardListener;
try {
  const nodeGlobalKeyListener = require('node-global-key-listener');
  GlobalKeyboardListener = nodeGlobalKeyListener.GlobalKeyboardListener;
} catch (error) {
  console.error('Failed to load node-global-key-listener:', error);
}

// 플랫폼 확인
const isMac = process.platform === 'darwin';

// 키보드 리스너 인스턴스 생성
let keyboardListener;

// 전역 참조 - 가비지 컬렉션 방지
let mainWindow;
let keystrokeCount = 0;
let keyup = false;
let cumulativeKeystrokeCount = 0; // 누적 키 입력 수 추가
let currentLevel = 1;
let levelProgress = 0;
let keystrokesToNextLevel = 100; // 레벨 1의 초기값
let devemonName = "Unnamed"; // 기본 이름
let timeout = false;

// SPM 추적
let keystrokesInLastMinute = [];
let currentSPM = 0;

// 데이터 파일 경로
const userDataPath = app.getPath('userData');
const saveFilePath = path.join(userDataPath, 'devemon-data.json');

// 애플리케이션 데이터 로드
function loadData() {
  try {
    if (fs.existsSync(saveFilePath)) {
      const data = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
      keystrokeCount = data.keystrokeCount || 0;
      cumulativeKeystrokeCount = data.cumulativeKeystrokeCount || 0; // 누적 키 입력 수 로드
      currentLevel = data.level || 1;
      devemonName = data.name || "Unnamed";
      
      // 레벨에 맞는 다음 레벨까지 필요한 키 입력 수 계산
      keystrokesToNextLevel = calculateKeystrokesForLevel(currentLevel);
      
      console.log('Data loaded:', { keystrokeCount, cumulativeKeystrokeCount, currentLevel, devemonName });
      return true;
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return false;
}

// 애플리케이션 데이터 저장
function saveData() {
  try {
    const data = {
      keystrokeCount,
      cumulativeKeystrokeCount, // 누적 키 입력 수 저장
      level: currentLevel,
      name: devemonName
    };
    
    // 사용자 데이터 디렉토리가 없으면 생성
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    fs.writeFileSync(saveFilePath, JSON.stringify(data));
    console.log('Data saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // 브라우저 창 생성
  mainWindow = new BrowserWindow({
    width: 200,
    height: 330, // 이름 태그를 위해 높이 증가
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

  if(isMac) {
    // Always on workspace
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  
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
    updateSPM();
    sendStatsToRenderer();
  }, 100);

  // 데이터 저장 (60초마다)
  setInterval(() => {
    saveData();
  }, 60000);

  // 창에서 드래그 가능하도록 설정
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      document.body.style.webkitAppRegion = 'drag';
      document.querySelector('.exit-button').style.webkitAppRegion = 'no-drag';
    `);
  });

  // 창 닫기 처리
  mainWindow.on('closed', () => {
    saveData(); // 종료 시 데이터 저장
    mainWindow = null;
    
    // 키보드 리스너 종료
    if (keyboardListener) {
      keyboardListener.kill();
    }
  });
}

function setupKeyboardMonitoring() {
  try {
    // 라이브러리가 로드되었는지 확인
    if (!GlobalKeyboardListener) {
      throw new Error('GlobalKeyboardListener is not available');
    }

    // 여러 번 시도하기 위한 옵션 설정
    const options = {
      windows: {
        // Windows 설정
      },
      mac: {
        // Mac 설정
        processOtherKeys: true,  // 다른 키 처리 활성화
        captureOnlyInputs: false // 모든 키 캡처
      }
    };

    console.log('Creating GlobalKeyboardListener with platform-specific options');
    
    // 경로 디버깅 출력
    console.log('App path:', app.getAppPath());
    console.log('Module path:', require.resolve('node-global-key-listener'));
    
    // 인스턴스 생성
    keyboardListener = new GlobalKeyboardListener(options);
    
    if (!keyboardListener) {
      throw new Error('Failed to create keyboardListener instance');
    }
    
    // 키 눌림 이벤트 리스너 등록
    keyboardListener.addListener(function(e, down) {
      if (e && e.state === "DOWN" && keyup) {
        // 디버깅용 로그 추가
        console.log('Key pressed:', e.name, e.state);
        // 키가 눌렸을 때만 카운트
        keystrokeCount++;
        cumulativeKeystrokeCount++; // 누적 키 입력 수 증가
        keystrokesInLastMinute.push(Date.now());
        keyup = false;
        if(timeout) {
          mainWindow.webContents.send('keystroke-after-timeout');
          timeout = false;
        }
      }
      if (e && e.state === "UP") {
        keyup = true;
      }
    });
    
    console.log('Keyboard monitoring set up successfully');
    
    // 1분 후에 테스트 메시지 출력
    setTimeout(() => {
      if (keystrokesInLastMinute.length === 0) {
        console.log('Warning: No keystrokes detected in the last 1 minute.');
        console.log('This may indicate that the keyboard monitoring is not working properly.');
        console.log('Showing manual input button as fallback...');
        
        // 자동으로 수동 입력 버튼 표시
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('keyboard-monitor-error', {
            message: 'No keystrokes detected. Using manual input mode as fallback.'
          });
          timeout = true;
        }
      } else {
        console.log(`Detected ${keystrokesInLastMinute.length} keystrokes in the last 1 minute.`);
      }
    }, 60000);
  } catch (error) {
    console.error('Error setting up keyboard monitoring:', error);
    
    // If keyboard monitoring fails, notify the UI
    if (mainWindow && !mainWindow.isDestroyed()) {
      let errorMessage = 'Failed to set up keyboard monitoring.';
      
      if (isMac) {
        errorMessage = 'macOS requires Input Monitoring permission for keyboard tracking.';
        
        // Show notification about macOS permissions
        console.log('macOS requires Input Monitoring permission for keyboard tracking.');
      }
      
      mainWindow.webContents.send('keyboard-monitor-error', {
        message: errorMessage
      });
    }
  }
}

function updateSPM() {
  // 1분보다 오래된 키 입력 제거
  const oneMinuteAgo = Date.now() - 60000;
  keystrokesInLastMinute = keystrokesInLastMinute.filter(timestamp => timestamp > oneMinuteAgo);
  
  // 현재 SPM 계산
  currentSPM = keystrokesInLastMinute.length;
}

function calculateKeystrokesForLevel(level) {
  return 100 * Math.pow(level, 2);
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
      cumulativeKeystrokeCount, // 누적 키 입력 수 전송
      currentLevel,
      levelProgress,
      spm: currentSPM,
      name: devemonName,
      isMacOS: isMac
    });
  }
}

// 이름 변경 처리
ipcMain.on('update-name', (event, newName) => {
  if (newName && newName.trim() !== '') {
    devemonName = newName.trim();
    saveData(); // 이름이 변경되면 즉시 저장
  }
});

// 테스트용 - 렌더러에서 키 입력 수신
ipcMain.on('keystroke', () => {
  console.log('Manual keystroke received from renderer');
  keystrokeCount++;
  cumulativeKeystrokeCount++; // 누적 키 입력 수 증가
  keystrokesInLastMinute.push(Date.now());
});

// 키보드 모니터링 재시도
ipcMain.on('retry-keyboard-monitoring', () => {
  console.log('Retrying keyboard monitoring...');
  if (keyboardListener) {
    try {
      keyboardListener.kill();
    } catch (error) {
      console.error('Error killing keyboard listener:', error);
    }
  }
  
  setTimeout(() => {
    setupKeyboardMonitoring();
  }, 60000);
});

// 데이터 리셋 처리
ipcMain.on('reset-data', () => {
  console.log('Resetting all data...');
  
  // 모든 데이터 초기화
  keystrokeCount = 0;
  cumulativeKeystrokeCount = 0;
  currentLevel = 1;
  levelProgress = 0;
  keystrokesToNextLevel = 100;
  devemonName = "Unnamed";
  keystrokesInLastMinute = [];
  currentSPM = 0;
  
  // 데이터 파일 삭제
  try {
    if (fs.existsSync(saveFilePath)) {
      fs.unlinkSync(saveFilePath);
      console.log('Data file deleted successfully');
    }
  } catch (error) {
    console.error('Error deleting data file:', error);
  }
  
  // UI 업데이트
  sendStatsToRenderer();
});

// IPC 핸들러
ipcMain.on('exit-app', () => {
  saveData(); // 종료 전 데이터 저장
  
  // 키보드 리스너 정리
  if (keyboardListener) {
    keyboardListener.kill();
  }
  
  app.quit();
});

// Electron 초기화가 완료되면 이 메소드가 호출됨
app.whenReady().then(() => {
  // 저장된 데이터 로드
  loadData();
  
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
    saveData(); // 종료 전 데이터 저장
    
    // 키보드 리스너 정리
    if (keyboardListener) {
      keyboardListener.kill();
    }
    
    app.quit();
  }
});