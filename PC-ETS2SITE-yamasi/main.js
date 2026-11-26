const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const { execFile } = require('child_process');
const path = require('path');
const os = require('os');
const gameMonitor = require('../ETS2Bridge/gameMonitor');
const telemetryReader = require('../ETS2Bridge/telemetryReader');
const commandExecutor = require('../ETS2Bridge/commandExecutor');
const configManager = require('../Config/configManager');
const displayCompat = require('./displayCompat');

// Fix GPU cache collision when opening multiple times
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('no-sandbox');
// Sabit userData klasörü (her açılışta Temp'te yeni klasör oluşmasın, tek-örnek kilidi çalışsın)
try {
  app.setPath('userData', path.join(os.tmpdir(), 'ets2_site_phone_data'));
} catch (e) {}

// ================= TANI LOGU =================
// Test eden kullanıcılar bu dosyayı gönderir: %TEMP%\ets2_site_phone_log.txt
const fs = require('fs');
const LOG_PATH = path.join(os.tmpdir(), 'ets2_site_phone_log.txt');
function plog(...args) {
  const line = '[' + new Date().toISOString() + '] ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  try { console.log(line); } catch (e) {}
  try {
    if (fs.existsSync(LOG_PATH) && fs.statSync(LOG_PATH).size > 300 * 1024) {
      fs.renameSync(LOG_PATH, LOG_PATH + '.old');
    }
    fs.appendFileSync(LOG_PATH, line + '\r\n', 'utf8');
  } catch (e) {}
}

// Aynı anda iki telefon açılmasın (iki pencere + iki korna kancası)
const gotSingleLock = app.requestSingleInstanceLock();
if (!gotSingleLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let isPhoneOpen = false;

// ================= EKRAN / KONUM YÖNETİMİ =================
// Eski sürüm konumu sadece açılışta bir kez, birincil ekrana göre hesaplıyordu.
// Oyun farklı çözünürlükte tam ekran açılınca (2K/4K monitör, TV) telefon görünen alanın dışında kalıyordu.
const BASE_W = 340;
const BASE_H = 680;
const EDGE_MARGIN = 30;
const BRIDGE_EXE_PATH = path.join(__dirname, '../ETS2Bridge/ets2_bridge.exe');

let currentZoom = 1;
let userMovedPhone = false;
let lastEts2Rect = null;
let lastPlacementKey = '';

function describeDisplays() {
  try {
    const primaryId = screen.getPrimaryDisplay().id;
    return screen.getAllDisplays().map(d => ({
      id: d.id,
      primary: d.id === primaryId,
      bounds: d.bounds,
      workArea: d.workArea,
      scale: d.scaleFactor,
      size: d.size
    }));
  } catch (e) {
    return 'hata: ' + e.message;
  }
}

function rectContainsPoint(r, p) {
  return p.x >= r.x && p.x < r.x + r.width && p.y >= r.y && p.y < r.y + r.height;
}

// ETS2 penceresinin konumunu köprü programından al (sadece hangi ekranda olduğunu bulmak için)
function refreshEts2Rect() {
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(BRIDGE_EXE_PATH)) return resolve(null);
      execFile(BRIDGE_EXE_PATH, ['rect'], { timeout: 1500, windowsHide: true }, (err, stdout) => {
        if (err || !stdout) return resolve(null);
        const parts = stdout.trim().split(',').map(n => parseInt(n, 10));
        if (parts.length === 4 && parts.every(n => Number.isFinite(n)) && parts[2] > 200 && parts[3] > 200) {
          lastEts2Rect = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
          return resolve(lastEts2Rect);
        }
        resolve(null);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

// Telefonun açılacağı ekranı seç: 1) ETS2'nin olduğu ekran 2) fare imlecinin olduğu ekran 3) birincil ekran
function pickTargetDisplay() {
  const displays = screen.getAllDisplays();
  if (lastEts2Rect) {
    const center = {
      x: Math.round(lastEts2Rect.x + lastEts2Rect.width / 2),
      y: Math.round(lastEts2Rect.y + lastEts2Rect.height / 2)
    };
    let hit = displays.find(d => rectContainsPoint(d.bounds, center));
    if (!hit && process.platform === 'win32' && typeof screen.screenToDipPoint === 'function') {
      try {
        const dip = screen.screenToDipPoint(center);
        hit = displays.find(d => rectContainsPoint(d.bounds, dip));
      } catch (e) {}
    }
    if (hit) return { display: hit, reason: 'ets2' };
  }
  try {
    const cursor = screen.getCursorScreenPoint();
    return { display: screen.getDisplayNearestPoint(cursor), reason: 'cursor' };
  } catch (e) {}
  return { display: screen.getPrimaryDisplay(), reason: 'primary' };
}

function isWindowVisibleOnSomeDisplay() {
  if (!mainWindow || mainWindow.isDestroyed()) return true;
  const b = mainWindow.getBounds();
  const center = { x: b.x + Math.round(b.width / 2), y: b.y + Math.round(b.height / 2) };
  return screen.getAllDisplays().some(d => rectContainsPoint(d.workArea, center) || rectContainsPoint(d.bounds, center));
}

// Telefonu seçilen ekranın sağ alt köşesine yerleştir; ekran küçükse telefonu orantılı küçült
function placePhone(reasonTag) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    // Kullanıcı telefonu elle taşıdıysa ve hâlâ görünür alandaysa yerine dokunma
    if (userMovedPhone && isWindowVisibleOnSomeDisplay()) return;
    userMovedPhone = false;

    const { display, reason } = pickTargetDisplay();
    const wa = display.workArea;
    const margin = Math.max(8, Math.min(EDGE_MARGIN, Math.round(wa.height * 0.03)));

    let zoom = Math.min(1, (wa.height - margin * 2) / BASE_H, (wa.width - margin * 2) / BASE_W);
    zoom = Math.max(0.45, Math.round(zoom * 100) / 100);

    const w = Math.round(BASE_W * zoom);
    const h = Math.round(BASE_H * zoom);
    const x = Math.round(wa.x + wa.width - w - margin);
    const y = Math.round(wa.y + wa.height - h - margin);

    mainWindow.setBounds({ x, y, width: w, height: h });
    if (zoom !== currentZoom) {
      currentZoom = zoom;
      try { mainWindow.webContents.setZoomFactor(zoom); } catch (e) {}
    }

    const key = [display.id, x, y, w, h].join(':');
    if (key !== lastPlacementKey) {
      lastPlacementKey = key;
      plog('KONUM', reasonTag || '', {
        secim: reason,
        ekranId: display.id,
        workArea: wa,
        olcek: display.scaleFactor,
        ets2Rect: lastEts2Rect,
        pencere: { x, y, w, h },
        zoom
      });
    }
  } catch (err) {
    plog('KONUM HATASI', err && err.message);
  }
}

let placeDebounce = null;
function schedulePlacement(tag) {
  clearTimeout(placeDebounce);
  placeDebounce = setTimeout(() => {
    refreshEts2Rect().then(() => placePhone(tag));
  }, 300);
}

// ================= OYUN EKRAN UYUMU (TÜM MONİTÖRLER) =================
// Telefonun her monitörde (1080p, 2K, 4K, %100-%150 ölçek) oyunun üstünde görünmesi için oyun
// "çerçevesiz tam ekran"da çalıştırılır. Kapatmak için Config/config.json: "autoBorderless": false
const autoBorderless = configManager.get('autoBorderless') !== false;
let borderlessTimer = null;
let borderlessDone = false;
let restartNoticeShown = false;
let fullscreenAtGameStart = false;

// Oyunun en son açıldığı (yoksa birincil) monitörün gerçek çözünürlüğü
function targetPhysicalSize() {
  const displays = screen.getAllDisplays();
  let display = screen.getPrimaryDisplay();
  if (lastEts2Rect) {
    const c = { x: Math.round(lastEts2Rect.x + lastEts2Rect.width / 2), y: Math.round(lastEts2Rect.y + lastEts2Rect.height / 2) };
    let hit = displays.find(d => rectContainsPoint(d.bounds, c));
    if (!hit && typeof screen.screenToDipPoint === 'function') {
      try { const dip = screen.screenToDipPoint(c); hit = displays.find(d => rectContainsPoint(d.bounds, dip)); } catch (e) {}
    }
    if (hit) display = hit;
  }
  return displayCompat.physicalSize(display);
}

function documentsRoot() {
  try { return [app.getPath('documents')]; } catch (e) { return []; }
}

// Oyun KAPALIYKEN config.cfg'yi pencereli + gerçek çözünürlüğe ayarla (bir sonraki açılış için)
function applyConfigCompat(tag) {
  if (!autoBorderless) return;
  try {
    const size = targetPhysicalSize();
    const res = displayCompat.applyConfigFix(size, documentsRoot(), plog);
    plog('UYUM config', tag, { size, degisen: res.changed.length, ayni: res.unchanged.length, hatalar: res.errors });
  } catch (e) {
    plog('UYUM config hatası', e && e.message);
  }
}

function showRestartNotice() {
  if (restartNoticeShown) return;
  restartNoticeShown = true;
  try {
    const { Notification } = require('electron');
    if (Notification.isSupported()) {
      new Notification({
        title: 'ETS2.SITE Telefon',
        body: 'Oyun gerçek tam ekranda açılmış. Telefon için ayar yapıldı: oyunu bir kez kapatıp açın, telefon her monitörde görünecek.'
      }).show();
    }
  } catch (e) {}
}

function runBorderlessOnce(tag) {
  if (!autoBorderless) return Promise.resolve(null);
  return displayCompat.makeGameBorderless().then((r) => {
    plog('UYUM pencere', tag, r);
    if (r.status === 'OK' || r.status === 'ALREADY') {
      borderlessDone = true;
      if (r.status === 'OK') {
        userMovedPhone = false;
        schedulePlacement('cercevesiz');
      }
      // Oyun gerçek tam ekranda açılmışsa pencere değişikliği işe yaramaz; bir sonraki açılış düzelir
      if (fullscreenAtGameStart) showRestartNotice();
    }
    return r;
  }).catch((e) => {
    plog('UYUM pencere hatası', e && e.message);
    return null;
  });
}

// Oyun açılınca penceresi hazır olana kadar dene (yükleme ekranı uzun sürebilir)
function startBorderlessLoop() {
  if (!autoBorderless) return;
  clearInterval(borderlessTimer);
  borderlessDone = false;
  let tries = 0;
  const tick = () => {
    tries++;
    runBorderlessOnce('oyun-acildi#' + tries).then((r) => {
      if (borderlessDone || tries >= 40 || (r && r.status === 'NOTRUNNING')) {
        clearInterval(borderlessTimer);
        borderlessTimer = null;
      }
    });
  };
  setTimeout(tick, 3000);
  borderlessTimer = setInterval(tick, 6000);
}

// Check CLI arguments
const isDev = process.argv.includes('--dev');
const allowStandalone = process.argv.includes('--sim') || process.argv.includes('--dev');

function createWindow() {
  // Başlangıç boyutu; gerçek konum/boyut her açılışta placePhone() ile hesaplanır
  const primaryWa = screen.getPrimaryDisplay().workArea;

  mainWindow = new BrowserWindow({
    width: BASE_W,
    height: BASE_H,
    x: Math.max(primaryWa.x, primaryWa.x + primaryWa.width - BASE_W - EDGE_MARGIN),
    y: Math.max(primaryWa.y, primaryWa.y + primaryWa.height - BASE_H - EDGE_MARGIN),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true, // Görev çubuğunda simge bırakmaz
    hasShadow: false,
    resizable: false,
    show: false, // Başlangıçta gizli
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false // Arka planda 60fps akıcı kalsın
    }
  });

  try {
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch (e) {}

  mainWindow.loadFile(path.join(__dirname, '../Phone/phone.html'));

  // Sayfa her yüklendiğinde mevcut ölçeği yeniden uygula
  mainWindow.webContents.on('did-finish-load', () => {
    try { mainWindow.webContents.setZoomFactor(currentZoom); } catch (e) {}
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Hotkey toggle: CTRL + T
  registerShortcut();

  // Her zaman ilk açılışta veya hazır olduğunda telefonu ekrana getir
  mainWindow.once('ready-to-show', () => {
    openPhone();
  });
}

function registerShortcut() {
  try {
    const hotkey = configManager.get('hotkey') || 'CommandOrControl+T';
    const ok = globalShortcut.register(hotkey, () => {
      plog('KISAYOL basıldı', hotkey);
      togglePhone();
    });
    plog('KISAYOL kaydı', hotkey, ok ? 'BAŞARILI' : 'BAŞARISIZ (başka bir program bu kısayolu kullanıyor olabilir)');
  } catch (err) {
    console.error('[Main] Kısayol kaydedilemedi:', err);
  }
}

function togglePhone() {
  if (isPhoneOpen) {
    closePhone();
  } else {
    openPhone();
  }
}

function openPhone() {
  if (!mainWindow) return;
  isPhoneOpen = true;
  // Önce eldeki bilgiyle hemen yerleştir, sonra ETS2 penceresinin ekranını sorup gerekirse düzelt
  placePhone('ac');
  // Oyun açıkken telefon her açıldığında pencere hâlâ çerçevesiz mi kontrol et (oyun içi ayar değişmiş olabilir)
  if (gameMonitor.isEts2Running) runBorderlessOnce('telefon-acildi');
  refreshEts2Rect().then(() => {
    if (isPhoneOpen) placePhone('ac-ets2');
  });
  try {
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.moveTop();
  } catch (e) {}
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send('phone:open');
}

function closePhone() {
  if (!mainWindow) return;
  isPhoneOpen = false;
  mainWindow.webContents.send('phone:close');
  // Animasyon bitiminde gizle
  setTimeout(() => {
    if (mainWindow && !isPhoneOpen) {
      mainWindow.hide();
    }
  }, 380);
}

// Periodic Topmost Reinforcement (Oyun içinde telefonun arkaya düşmesini engelle)
setInterval(() => {
  if (mainWindow && !mainWindow.isDestroyed() && isPhoneOpen) {
    try {
      mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      mainWindow.moveTop();
      // Ekran dışına düştüyse (çözünürlük değişti vb.) geri getir
      if (!isWindowVisibleOnSomeDisplay()) {
        userMovedPhone = false;
        plog('UYARI telefon ekran dışındaydı, yeniden konumlandırılıyor', mainWindow.getBounds());
        placePhone('kurtarma');
      }
    } catch (e) {}
  }
}, 1200);

// ================= ETS2 MONITOR VE OYUN ÇIKIŞI =================
// Standalone modda değilsek veya oyuna bağlı moddaysak oyun kapandığında komple kapat
gameMonitor.start(allowStandalone);

gameMonitor.on('game-started', () => {
  console.log('[Main] ETS2 başladı.');
  plog('ETS2 başladı');
  try { fullscreenAtGameStart = displayCompat.isExclusiveFullscreenConfigured(documentsRoot()); } catch (e) {}
  plog('UYUM oyun açılışı', { gercekTamEkran: fullscreenAtGameStart, otomatik: autoBorderless });
  startBorderlessLoop();
  schedulePlacement('oyun-basladi');
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      mainWindow.moveTop();
    } catch (e) {}
    mainWindow.webContents.send('game:status', { running: true });
  }
});

let wasGameEverRunning = false;

gameMonitor.on('status-changed', ({ running, prev }) => {
  if (running) {
    wasGameEverRunning = true;
  } else if (!running && (prev === true || wasGameEverRunning)) {
    // Oyun kapandı -> Telefon overlay'i, arka plan worker'ları ve çalan radyoyu derhal kapat
    console.log('[Main] ETS2 kapandı. Telefon sistemi ve radyo tamamen kapatılıyor...');
    // Oyun ayarlarını kapanırken yazar; bir sonraki açılış için uyumu şimdi uygula
    setTimeout(() => { applyConfigCompat('oyun-kapandi'); cleanExit(); }, 1500);
  }
});

gameMonitor.on('game-stopped', () => {
  // Kapanış status-changed içinde (config uyumu uygulandıktan sonra) yapılır
});

let exiting = false;
function cleanExit() {
  if (exiting) return;
  exiting = true;
  clearInterval(borderlessTimer);
  console.log('[Main] Kaynaklar serbest bırakılıyor, komple çıkış yapılıyor...');

  // 1. Renderer'a önce radyoyu durdur + hazırlan sinyali gönder
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('phone:shutdown');
    }
  } catch (e) {}

  // 2. Kısa süre bekle (renderer tarafında ses durdurulsun), sonra tamamen kapat
  setTimeout(() => {
    try {
      if (hookProc) hookProc.kill();
      globalShortcut.unregisterAll();
      gameMonitor.stop();
      telemetryReader.stop();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.destroy();
      }
    } catch (e) {}
    app.quit();
    setTimeout(() => process.exit(0), 500);
  }, 350);
}

// ================= TELEMETRİ VE IPC =================
telemetryReader.start();

telemetryReader.on('update', (data) => {
  if (mainWindow && !mainWindow.isDestroyed() && isPhoneOpen) {
    mainWindow.webContents.send('telemetry:update', data);
  }
});

// IPC Dinleyicileri
ipcMain.on('phone:toggle', () => togglePhone());
ipcMain.on('phone:close', () => closePhone());
ipcMain.on('app:quit', () => cleanExit());

let dragInitialPos = null;

ipcMain.on('window:drag_start', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    dragInitialPos = mainWindow.getPosition();
  }
});

ipcMain.on('window:drag_move', (event, { deltaX, deltaY }) => {
  if (mainWindow && !mainWindow.isDestroyed() && dragInitialPos) {
    const [w, h] = mainWindow.getSize();
    let newX = dragInitialPos[0] + deltaX;
    let newY = dragInitialPos[1] + deltaY;

    // Sınır kontrolleri: telefonun bulunduğu ekrana göre (eskiden hep birincil ekran kullanılıyordu)
    const wa = screen.getDisplayNearestPoint({ x: Math.round(newX + w / 2), y: Math.round(newY + h / 2) }).workArea;
    newX = Math.max(wa.x - 50, Math.min(wa.x + wa.width - w + 50, newX));
    newY = Math.max(wa.y - 20, Math.min(wa.y + wa.height - h + 50, newY));
    userMovedPhone = true;

    mainWindow.setPosition(Math.round(newX), Math.round(newY));
  }
});

ipcMain.on('window:drag_end', () => {
  dragInitialPos = null;
});

ipcMain.on('ets2:weather', async (event, type) => {
  await commandExecutor.setWeather(type);
});

ipcMain.on('ets2:time', async (event, val) => {
  await commandExecutor.setTime(val);
});

ipcMain.on('ets2:police', async (event, enabled) => {
  await commandExecutor.setPolice(enabled);
});

ipcMain.on('ets2:traffic', async (event, val) => {
  await commandExecutor.setTraffic(val);
});

ipcMain.on('ets2:teleport', async (event, city) => {
  await commandExecutor.teleport(city);
});

ipcMain.on('app:take_photo', async (event) => {
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    // Capture whole screen
    const sources = await require('electron').desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    if (sources.length > 0) {
      const imgData = sources[0].thumbnail.toDataURL();
      mainWindow.webContents.send('photo:captured', imgData);
    }
  } catch (e) {
    console.warn('[Main] Fotoğraf çekilemedi:', e);
  }
});

// ================= iPHONE UZAKTAN BAĞLANTI (Krankmili iOS uygulaması) =================
// iPhone'daki uygulama Wi-Fi üzerinden bu porta bağlanır; telefon ekranındaki komutlar burada,
// PC'deki telefondan gelmiş gibi çalışır. Telemetri, korna ve fotoğraf iPhone'a da gönderilir.
const net = require('net');
const REMOTE_PORT = 5565;
const remoteClients = new Set();
const REMOTE_ALLOWED = new Set([
  'ets2:weather', 'ets2:time', 'ets2:police', 'ets2:traffic', 'ets2:teleport', 'ets2:service', 'app:take_photo'
]);
const REMOTE_FORWARD = new Set(['photo:captured', 'horn:down', 'horn:up', 'game:status', 'phone:shutdown']);

function remoteBroadcast(ch, data) {
  if (remoteClients.size === 0) return;
  const line = JSON.stringify({ ch, data: data === undefined ? null : data }) + '\n';
  for (const sock of remoteClients) {
    try { sock.write(line); } catch (e) { remoteClients.delete(sock); }
  }
}

// PC telefonuna giden mesajların bir kısmını iPhone'a da kopyala
app.on('browser-window-created', (event, win) => {
  const wc = win.webContents;
  const origSend = wc.send.bind(wc);
  wc.send = (ch, ...args) => {
    origSend(ch, ...args);
    if (REMOTE_FORWARD.has(ch)) remoteBroadcast(ch, args[0]);
  };
});

// Telemetri PC'de telefon kapalıyken de iPhone'a gitsin
telemetryReader.on('update', (data) => remoteBroadcast('telemetry:update', data));

const remoteServer = net.createServer((sock) => {
  sock.setNoDelay(true);
  sock.setEncoding('utf8');
  remoteClients.add(sock);
  console.log('[Remote] iPhone bağlandı:', sock.remoteAddress);
  let buf = '';
  sock.on('data', (chunk) => {
    buf += chunk;
    if (buf.length > 65536) buf = '';
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      let m;
      try { m = JSON.parse(line); } catch (e) { continue; }
      if (!m || typeof m.ch !== 'string') continue;
      if (m.ch === 'ping') { try { sock.write('{"ch":"pong"}\n'); } catch (e) {} continue; }
      if (REMOTE_ALLOWED.has(m.ch)) ipcMain.emit(m.ch, { remote: true }, m.arg);
    }
  });
  const drop = () => { remoteClients.delete(sock); };
  sock.on('close', drop);
  sock.on('error', drop);
});
remoteServer.on('error', (e) => console.warn('[Remote] port ' + REMOTE_PORT + ' açılamadı:', e.message));
remoteServer.listen(REMOTE_PORT, '0.0.0.0', () => console.log('[Remote] iPhone bağlantısı açık, port ' + REMOTE_PORT));

// ================= GLOBAL KEY HOOK (N TUŞU KORNA) =================
const { spawn } = require('child_process');
let hookProc = null;

function startKeyHook() {
  try {
    const hookPath = path.join(__dirname, '../Input/key_hook.exe');
    const fs = require('fs');
    if (fs.existsSync(hookPath)) {
      hookProc = spawn(hookPath, [], { stdio: ['ignore', 'pipe', 'ignore'] });
      hookProc.stdout.on('data', (data) => {
        const lines = data.toString().split(/[\r\n]+/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === 'N_DOWN') {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('horn:down');
            }
          } else if (trimmed === 'N_UP') {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('horn:up');
            }
          }
        }
      });
      console.log('[Main] Global Key Hook (N Tuşu) başarıyla başlatıldı.');
    }
  } catch (err) {
    console.warn('[Main] Global Key Hook başlatılamadı:', err);
  }
}

// ================= UYGULAMA YAŞAM DÖNGÜSÜ =================
app.on('second-instance', () => {
  plog('İkinci açılma isteği geldi, mevcut telefon gösteriliyor');
  openPhone();
});

app.whenReady().then(() => {
  plog('==== ETS2.SITE PHONE başlatıldı ====', {
    electron: process.versions.electron,
    os: os.release(),
    argv: process.argv.slice(1)
  });
  plog('EKRANLAR', describeDisplays());

  // Çözünürlük / ölçek / ekran değişince telefonu yeniden konumlandır
  // (ETS2 tam ekranda farklı çözünürlüğe geçtiğinde burası tetiklenir)
  screen.on('display-metrics-changed', (e, display, changed) => {
    plog('EKRAN DEĞİŞTİ', { id: display.id, changed, bounds: display.bounds, workArea: display.workArea, scale: display.scaleFactor });
    userMovedPhone = false;
    schedulePlacement('ekran-degisti');
  });
  screen.on('display-added', () => { plog('EKRAN EKLENDİ', describeDisplays()); schedulePlacement('ekran-eklendi'); });
  screen.on('display-removed', () => { plog('EKRAN ÇIKARILDI', describeDisplays()); userMovedPhone = false; schedulePlacement('ekran-cikarildi'); });

  // Oyun henüz açık değilse ayarı şimdi düzelt (açıksa oyun kapanırken düzeltilir)
  try {
    execFile(BRIDGE_EXE_PATH, ['is_running'], { timeout: 3000, windowsHide: true }, (err, stdout) => {
      const running = !err && String(stdout || '').trim() === '1';
      if (!running) applyConfigCompat('telefon-acilisi');
    });
  } catch (e) {}

  startKeyHook();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// before-quit: renderer'a ses durdur sinyali gönder
app.on('before-quit', () => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('phone:shutdown');
    }
  } catch (e) {}
  globalShortcut.unregisterAll();
  gameMonitor.stop();
  telemetryReader.stop();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
