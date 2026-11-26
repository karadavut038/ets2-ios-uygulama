// ETS2.SITE PHONE - iPhone 16 Pro Max Kontrolcüsü ve Arayüz Mantığı

class PhoneApp {
  constructor() {
    this.currentView = 'home'; // 'home' veya aktif app-id
    this.mapData = null;
    this.isPoliceEnabled = true;

    // Havalı Korna Sistemi
    this.activeHornIndex = 1;
    this.hornAudio = null;
    this.isHornPlaying = false;
    this.hornSources = [
      '../Audio/Havalı korna 1.mp3',
      '../Audio/Havalı korna 2.mp3',
      '../Audio/Havalı korna 3.mp3',
      '../Audio/Havalı korna 4.mp3',
      '../Audio/Havalı korna 5.mp3',
      '../Audio/Havalı korna 6.mp3',
      '../Audio/Havalı korna 7.mp3',
      '../Audio/Havalı korna 8.mp3',
      '../Audio/Havalı korna 9.mp3',
      '../Audio/Havalı korna 10.mp3',
      '../Audio/Havalı korna 11.mp3'
    ];

    // Radyo Sistemi
    this.radioAudio = null;
    this.radioHls = null;
    this.isRadioPlaying = false;
    this.currentRadioIndex = -1;
    this.radioStations = [
      { name: 'İmbat FM',        genre: 'Damar / Arabesk', emoji: '📻', url: 'https://radyo.medyahost.com.tr/8034/stream' },
      { name: 'Damar FM',        genre: 'Damar / Arabesk', emoji: '💔', url: 'http://yayin.damarfm.com:8080/;' },
      { name: 'Baba Radyo',      genre: 'Damar / Arabesk', emoji: '🎙️', url: 'http://37.247.98.7/;stream.mp3' },
      { name: 'Damar Türk FM',   genre: 'Damar / Arabesk', emoji: '🔥', url: 'https://live.radyositesihazir.com:10997/;' },
      { name: 'Karadeniz FM',    genre: 'Karadeniz / Slow', emoji: '🌊', url: 'https://moondigitalmaster.radyotvonline.net/karadenizfm/playlist.m3u8', hls: true },
      { name: 'Hamsi FM',        genre: 'Karadeniz / Slow', emoji: '🐟', url: 'https://anadolu.liderhost.com.tr:10992/;' },
      { name: 'Power FM',        genre: 'Pop / Hit',      emoji: '⚡', url: 'https://listen.powerapp.com.tr/powerfm/mpeg/icecast.audio' },
      { name: 'Power Türk',      genre: 'Türk Pop',       emoji: '🇹🇷', url: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio' },
      { name: 'Power Pop',       genre: 'Pop',            emoji: '🎵', url: 'https://listen.powerapp.com.tr/powerpop/128/chunks.m3u8', hls: true },
      { name: 'Radyo Fenomen',   genre: 'Türkçe Pop',     emoji: '🌟', url: 'https://live.radyofenomen.com/fenomen/128/icecast.audio' },
      { name: 'Alem FM',         genre: 'Arabesk / Pop',  emoji: '🎤', url: 'https://turkmedya.radyotvonline.net/alemfmaac' },
      { name: 'Radyo D',         genre: 'Pop',            emoji: '🎸', url: 'https://radyo.duhnet.tv/radyod' },
      { name: 'Slow Türk',       genre: 'Slow / Romantic', emoji: '🌙', url: 'https://radyo.duhnet.tv/ak_dtvh_slowturk' },
      { name: 'Show Radyo',      genre: 'Pop / Eğlence',  emoji: '🎉', url: 'https://edge1.radyotvonline.net/shoutcast/play/showradyo' },
      { name: 'TRT FM',          genre: 'Pop / Klasik',   emoji: '📻', url: 'https://trt.radyotvonline.net/trtfm' },
      { name: 'TRT Haber Radyo', genre: 'Haber',          emoji: '📰', url: 'https://trt.radyotvonline.net/trthaber' },
      { name: 'TRT Türkü',       genre: 'Türk Halk Müz.', emoji: '🪗', url: 'https://rd-trtturku.medya.trt.com.tr/master_128.m3u8', hls: true },
      { name: 'TRT Nağme',       genre: 'Klasik Türk Müz.', emoji: '🎻', url: 'https://rd-trtnagme.medya.trt.com.tr/master.m3u8', hls: true },
      { name: 'TRT Radyo 1',     genre: 'Kültür / Sanat', emoji: '🎭', url: 'https://trt.radyotvonline.net/trt1' },
      { name: 'A Haber Radyo',   genre: 'Haber',          emoji: '📡', url: 'https://trkvz-radyolar.ercdn.net/ahaberradyo/playlist.m3u8', hls: true },
      { name: 'A Spor Radyo',    genre: 'Spor',           emoji: '⚽', url: 'https://trkvz-radyolar.ercdn.net/asporradyo/playlist.m3u8', hls: true },
      { name: 'Radyo Turkuvaz',  genre: 'Çeşitli',        emoji: '🌊', url: 'https://trkvz-radyolar.ercdn.net/radyoturkuvaz/playlist.m3u8', hls: true },
      { name: 'Super FM',        genre: 'Pop / Dance',    emoji: '💫', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SUPER_FM_SC' },
      { name: 'Virgin Radio TR', genre: 'Rock / Pop',     emoji: '🎙️', url: 'http://28503.live.streamtheworld.com/VIRGIN_RADIOAAC_SC' },
      { name: 'Truckers FM',     genre: 'Country / Rock', emoji: '🚛', url: 'https://radio.truckers.fm/' }
    ];

    // Sanal Klavye Durumu
    this.activeKeyboardInputId = null;
    this.isCapsOn = false;

    // Kilit Ekranı Durumu
    this.isUnlocked = false;

    // Takograf Durumu (Sürüş / Mola Takibi)
    this.tachoSeconds = 1 * 3600 + 45 * 60; // 01:45 başlangıç
    this.tachoDailySeconds = 5 * 3600 + 20 * 60; // 05:20 başlangıç

    // Fotoğraf Galerisi
    this.capturedPhotos = [];

    this.telemetryData = {
      connected: false,
      coordinateX: 52400,
      coordinateY: 0,
      coordinateZ: 35600,
      heading: 0,
      speed: 82,
      speedLimit: 90,
      rpm: 1250,
      gear: 10,
      fuel: 480,
      fuelCapacity: 600,
      gameTimeFormatted: '12:30',
      currentCity: 'İstanbul'
    };

    this.init();
  }

  async init() {
    // 1. Harita Verisini Yükle (Işınlanma Şehirleri İçin)
    if (typeof ETS2_MAP_DATA !== 'undefined') {
      this.mapData = ETS2_MAP_DATA;
    } else if (typeof require !== 'undefined') {
      try { this.mapData = require('../Map/ets2MapData'); } catch (e) {}
    }

    // 2. Işınlanma Şehir Listesini Doldur
    this.populateTeleportList();



    // 3. IPC İletişimi
    this.setupIpc();

    // 4. Mouse İle Serbest Taşıma (Telefonun Herhangi Bir Yerine Tıklayınca Sağa Sola Götürme)
    this.setupDragControls();

    // 5. Kilit Ekranı Tıklama İle Hemen Açma Desteği
    const lockScreen = document.getElementById('lockScreen');
    if (lockScreen) {
      lockScreen.addEventListener('click', () => {
        this.unlockPhone();
      });
    }

    // 6. Takograf ve Durum Döngüsü
    this._tachoInterval = setInterval(() => this.updateTacho(), 1000);
  }

  setupDragControls() {
    window.addEventListener('mousedown', (e) => {
      // Tıklanabilir buton, input, liste elemanı veya ikon tıklandığında taşımayı başlatma
      if (
        e.target.closest('button') ||
        e.target.closest('input') ||
        e.target.closest('.app-item') ||
        e.target.closest('.ios-list-item') ||
        e.target.closest('.home-indicator-bar')
      ) {
        return;
      }
      this.isDragging = true;
      this.dragStartX = e.screenX;
      this.dragStartY = e.screenY;
      if (this.ipc) this.ipc.send('window:drag_start');
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.screenX - this.dragStartX;
      const deltaY = e.screenY - this.dragStartY;
      if (this.ipc) {
        this.ipc.send('window:drag_move', { deltaX, deltaY });
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        if (this.ipc) this.ipc.send('window:drag_end');
      }
    });
  }

  setupIpc() {
    if (typeof require !== 'undefined') {
      try {
        const { ipcRenderer } = require('electron');
        this.ipc = ipcRenderer;

        this.ipc.on('telemetry:update', (event, data) => {
          this.onTelemetryData(data);
        });

        this.ipc.on('phone:open', () => {
          this.showPhoneFrame();
        });

        this.ipc.on('phone:close', () => {
          this.hidePhoneFrame();
        });

        // ETS2 kapandığında / sistem kapatılırken: radyoyu ve tüm kaynakları temizle
        this.ipc.on('phone:shutdown', () => {
          this.shutdownPhoneSystem();
        });

        // Global N tuşu havalı korna tetikleyicileri
        this.ipc.on('horn:down', () => {
          this.startHorn();
        });

        this.ipc.on('horn:up', () => {
          this.stopHorn();
        });

        // Çekilen ekran görüntüsü
        this.ipc.on('photo:captured', (event, imgData) => {
          this.onPhotoCaptured(imgData);
        });
      } catch (e) {
        console.warn('[PhoneApp] IPC başlatılamadı:', e);
      }
    }
  }

  showPhoneFrame() {
    const frame = document.getElementById('iphoneFrame');
    if (frame) frame.classList.remove('hidden');

    this.playOpenSound();

    const lock = document.getElementById('lockScreen');
    const home = document.getElementById('homeScreen');

    if (lock) {
      lock.classList.remove('unlocked');
      this.updateLockTime();
    }
    if (home) {
      home.classList.remove('visible');
      home.classList.remove('hidden');
    }
    this.isUnlocked = false;

    // 0.8 saniye sonra otomatik veya tıklamayla kilit açılsın
    if (this._unlockTimer) clearTimeout(this._unlockTimer);
    this._unlockTimer = setTimeout(() => {
      this.unlockPhone();
    }, 850);
  }

  unlockPhone() {
    if (this.isUnlocked) return;
    const lock = document.getElementById('lockScreen');
    const home = document.getElementById('homeScreen');
    if (lock) lock.classList.add('unlocked');
    if (home) home.classList.add('visible');
    this.isUnlocked = true;
    this.playUnlockSound();
    this.expandDynamicIsland('Face ID', 'Kilit Açıldı ✓');
  }

  hidePhoneFrame() {
    const frame = document.getElementById('iphoneFrame');
    if (frame) frame.classList.add('hidden');
    if (this._unlockTimer) clearTimeout(this._unlockTimer);

    this.playCloseSound();

    const lock = document.getElementById('lockScreen');
    if (lock) lock.classList.remove('unlocked');
    const home = document.getElementById('homeScreen');
    if (home) home.classList.remove('visible');
    this.isUnlocked = false;
  }

  updateLockTime() {
    const timeElem = document.getElementById('lockTime');
    const dateElem = document.getElementById('lockDate');
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    if (timeElem) timeElem.innerText = `${hrs}:${mins}`;

    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    if (dateElem) {
      dateElem.innerText = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
    }
  }

  // ================= UYGULAMA AÇMA & GERİ DÖNÜŞ (MOUSE İLE) =================
  openApp(appId) {
    this.currentView = appId;

    // Ana ekranı gizle
    const home = document.getElementById('homeScreen');
    if (home) home.classList.add('hidden');

    // Önceki açık uygulama pencerelerini kapat
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));

    // İstenen uygulamayı aç
    const target = document.getElementById(`view-${appId}`);
    if (target) {
      target.classList.add('active');
    }

    // Radyo uygulaması açıldığında initialize et
    if (appId === 'radio') {
      this.initRadioApp();
    }
  }

  openWeb(url, title) {
    this.currentView = 'browser';
    const home = document.getElementById('homeScreen');
    if (home) home.classList.add('hidden');

    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    const browserView = document.getElementById('view-browser');
    const titleEl = document.getElementById('browserActiveTitle');
    if (titleEl) titleEl.innerText = title;
    if (browserView) browserView.classList.add('active');

    if (this.ipc) {
      this.ipc.send('browser:open', { url });
    }
    this.showToast(title, 'Yükleniyor...');
    this.expandDynamicIsland(title, 'İnternet Bağlandı 🌐');
  }

  closeWeb() {
    if (this.ipc) {
      this.ipc.send('browser:close');
    }
    this.goHome();
  }

  goHome() {
    this.currentView = 'home';
    if (this.ipc) {
      this.ipc.send('browser:close');
    }
    // Radyo kapatılırken sesi durdur (isteğe bağlı — arka planda çalmaya devam etmesi için kaldır)
    // this._stopCurrentRadio();
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    const home = document.getElementById('homeScreen');
    if (home) home.classList.remove('hidden');
  }

  // ================= TELEMETRİ GÜNCELLEMELERİ =================
  onTelemetryData(data) {
    this.telemetryData = { ...this.telemetryData, ...data };

    // Status Bar Saati
    const statusClock = document.getElementById('statusClock');
    if (statusClock) statusClock.innerText = this.telemetryData.gameTimeFormatted;

    // Saat Uygulaması
    const clockLarge = document.getElementById('clockLargeTime');
    if (clockLarge) clockLarge.innerText = this.telemetryData.gameTimeFormatted;
  }

  // ================= 1. HAVA DURUMU SİSTEMİ =================
  applyWeather(type, name) {
    if (this._cmdLock) return;
    this._cmdLock = true;
    setTimeout(() => { this._cmdLock = false; }, 800);

    if (this.ipc) {
      this.ipc.send('ets2:weather', type);
    }
    this.showToast('Hava Durumu', `${name} uygulandı`);
    this.expandDynamicIsland('Hava Durumu', name);
    const desc = document.getElementById('weatherDesc');
    if (desc) desc.innerText = name;
  }

  // ================= 1.1 TRAFİK KONTROL SİSTEMİ =================
  applyTraffic(val, name) {
    if (this._cmdLock) return;
    this._cmdLock = true;
    setTimeout(() => { this._cmdLock = false; }, 800);

    if (this.ipc) {
      this.ipc.send('ets2:traffic', val);
    }
    this.showToast('Trafik', `${name} uygulandı (g_traffic ${val})`);
    this.expandDynamicIsland('Trafik', `${name} ✓`);
    const status = document.getElementById('trafficCurrentStatus');
    if (status) status.innerText = `g_traffic: ${val} (${name})`;
  }

  // ================= 2. SERVİS SİSTEMİ =================
  callServiceTow() {
    if (this._cmdLock) return;
    this._cmdLock = true;
    setTimeout(() => { this._cmdLock = false; }, 1500);

    if (this.ipc) {
      this.ipc.send('ets2:service');
    }
    this.showToast('Acil Çekici', 'Servis çağrısı yapıldı, yönlendiriliyorsunuz');
    this.expandDynamicIsland('Yol Yardım', 'Çekici Gönderildi');
  }

  instantRepair() {
    this.showToast('Araç Bakımı', 'Tüm araç hasarları başarıyla sıfırlandı!');
    this.expandDynamicIsland('Servis', 'Tamir Edildi ✓');
  }

  refuelTruck() {
    this.showToast('Yakıt İkmali', 'Yakıt deposu 600 L tam dolduruldu!');
    this.expandDynamicIsland('Yakıt', 'Depo Dolu (%100)');
  }

  // ================= 3. SAAT SİSTEMİ =================
  applyTime(type, name) {
    if (this._cmdLock) return;
    this._cmdLock = true;
    setTimeout(() => { this._cmdLock = false; }, 800);

    if (this.ipc) {
      this.ipc.send('ets2:time', type);
    }
    this.showToast('Saat Ayarı', `${name} uygulandı`);
    this.expandDynamicIsland('ETS2 Zamanı', name);
  }

  applyCustomHour() {
    if (this._cmdLock) return;
    this._cmdLock = true;
    setTimeout(() => { this._cmdLock = false; }, 800);

    const slider = document.getElementById('customHourSlider');
    if (!slider) return;
    const hour = parseInt(slider.value, 10);
    if (this.ipc) {
      this.ipc.send('ets2:time', hour);
    }
    this.showToast('Saat Ayarı', `Saat ${hour}:00 olarak ayarlandı`);
    this.expandDynamicIsland('ETS2 Saati', `${hour}:00`);
  }

  // ================= 4. POLİS SİSTEMİ =================
  togglePolice() {
    this.isPoliceEnabled = !this.isPoliceEnabled;
    this.applyPolice(this.isPoliceEnabled);
  }

  applyPolice(enabled) {
    this.isPoliceEnabled = enabled;
    if (this.ipc) {
      this.ipc.send('ets2:police', enabled);
    }
    const badge = document.getElementById('policeStatusBadge');
    if (badge) {
      badge.innerText = enabled ? 'AÇIK' : 'KAPALI';
      badge.style.color = enabled ? '#34c759' : '#ff3b30';
    }
    this.showToast('Trafik Cezaları', enabled ? 'Cezalar aktif (g_police 1)' : 'Cezalar kapatıldı (g_police 0)');
    this.expandDynamicIsland('Trafik Polisi', enabled ? 'Cezalar Açık' : 'Cezalar Kapalı');
  }

  // ================= 5. HAVALI KORNA SİSTEMİ =================
  selectHorn(index) {
    if (index < 1 || index > 11) return;
    this.activeHornIndex = index;

    for (let i = 1; i <= 11; i++) {
      const badge = document.getElementById(`hornBadge${i}`);
      if (badge) {
        if (i === index) {
          badge.innerText = 'Seçili ✓';
          badge.style.color = '#34c759';
        } else {
          badge.innerText = 'Seç';
          badge.style.color = '#8e8e93';
        }
      }
    }

    this.showToast('Havalı Korna', `Havalı Korna ${index} aktif edildi. Oyunda N tuşuna basılı tutun.`);
    this.expandDynamicIsland('Korna Seçildi', `Havalı Korna ${index}`);
  }

  startHorn() {
    if (this.isHornPlaying) return;
    this.isHornPlaying = true;

    try {
      const src = this.hornSources[this.activeHornIndex - 1] || this.hornSources[0];
      if (!this.hornAudio) {
        this.hornAudio = new Audio(src);
      } else {
        this.hornAudio.src = src;
      }
      this.hornAudio.loop = true;
      this.hornAudio.currentTime = 0;
      this.hornAudio.play().catch(e => console.warn('[PhoneApp] Korna çalınamadı:', e));

      this.expandDynamicIsland('Havalı Korna', `📢 Korna ${this.activeHornIndex} Çalıyor`);
    } catch (e) {
      console.warn('[PhoneApp] Korna hatası:', e);
    }
  }

  stopHorn() {
    if (!this.isHornPlaying) return;
    this.isHornPlaying = false;

    if (this.hornAudio) {
      try {
        this.hornAudio.pause();
        this.hornAudio.currentTime = 0;
      } catch (e) {}
    }
  }

  // ================= 6. DİJİTAL TAKOGRAF SİSTEMİ =================
  updateTacho() {
    if (this.telemetryData.speed > 2) {
      this.tachoSeconds++;
      this.tachoDailySeconds++;
    }

    const driveElem = document.getElementById('tachoDriveTime');
    const remElem = document.getElementById('tachoRemainingDrive');
    const dailyElem = document.getElementById('tachoDailyTime');
    const modeElem = document.getElementById('tachoModeTitle');

    if (driveElem) driveElem.innerText = this.formatSeconds(this.tachoSeconds);
    if (dailyElem) dailyElem.innerText = this.formatSeconds(this.tachoDailySeconds);

    const maxDrive = 4.5 * 3600;
    const remaining = Math.max(0, maxDrive - this.tachoSeconds);
    if (remElem) remElem.innerText = this.formatSeconds(remaining);

    if (this.tachoSeconds >= maxDrive) {
      if (modeElem) {
        modeElem.innerText = '⚠️ MOLA GEREKİYOR (4.5 SAAT DOLDU)';
        modeElem.style.color = '#ff3b30';
      }
    } else {
      if (modeElem) {
        modeElem.innerText = this.telemetryData.speed > 2 ? 'SÜRÜŞ MODU: AKTİF' : 'DİNLENME MODU: BEKLEMEDE';
        modeElem.style.color = this.telemetryData.speed > 2 ? '#34c759' : '#ff9500';
      }
    }
  }

  resetTacho() {
    this.tachoSeconds = 0;
    this.updateTacho();
    this.showToast('Takograf', '45 dakikalık mola onaylandı. Sürüş süresi sıfırlandı.');
    this.expandDynamicIsland('Takograf', 'Mola Verildi ✓');
  }

  formatSeconds(totalSec) {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  // ================= 7. KAMERA & GALERİ SİSTEMİ =================
  takePhoto() {
    if (this.ipc) {
      this.ipc.send('app:take_photo');
      this.showToast('Kamera', 'Ekran görüntüsü alınıyor...');
      this.expandDynamicIsland('Kamera', 'Fotoğraf Çekildi 📸');
    }
  }

  onPhotoCaptured(dataUrl) {
    this.capturedPhotos.unshift(dataUrl);
    if (this.capturedPhotos.length > 3) this.capturedPhotos.pop();

    const container = document.getElementById('photoGalleryGrid');
    const noText = document.getElementById('noPhotoText');
    if (noText) noText.style.display = 'none';

    if (container) {
      container.innerHTML = '';
      this.capturedPhotos.forEach((src, idx) => {
        const card = document.createElement('div');
        card.style.borderRadius = '12px';
        card.style.overflow = 'hidden';
        card.style.border = '1px solid rgba(255,255,255,0.15)';
        card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.4)';
        card.innerHTML = `
          <img src="${src}" style="width: 100%; height: 120px; object-fit: cover; display: block;">
          <div style="background: #1c1c1e; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; color: #8e8e93;">Kare #${idx + 1}</span>
            <button onclick="phoneApp.setAsWallpaper('${src}')" style="background: #007aff; color: #fff; border: none; padding: 3px 8px; border-radius: 6px; font-size: 10px; cursor: pointer;">Duvar Kağıdı Yap</button>
          </div>
        `;
        container.appendChild(card);
      });
    }
    this.showToast('Galeri', 'Fotoğraf galeriye kaydedildi!');
  }

  setAsWallpaper(src) {
    const home = document.getElementById('homeScreen');
    if (home) {
      home.style.background = `url("${src}") center/cover no-repeat`;
    }
    this.showToast('Kişiselleştirme', 'Fotoğraf ana ekran duvar kağıdı yapıldı!');
    this.expandDynamicIsland('Duvar Kağıdı', 'Güncellendi 🎨');
  }

  // ================= 8. ŞEHİR IŞINLANMA SİSTEMİ =================
  populateTeleportList() {
    const list = document.getElementById('teleportCityList');
    if (!list || !this.mapData) return;

    list.innerHTML = '';
    this.mapData.CITIES.forEach(c => {
      const item = document.createElement('div');
      item.className = 'ios-list-item';
      item.innerHTML = `
        <div class="item-left">
          <div class="item-icon" style="background: #0a84ff;">⚡</div>
          <div>
            <div style="font-weight: 700;">${c.name} (${c.country})</div>
            <div class="item-desc">Işınlan ve tırı yere indir</div>
          </div>
        </div>
        <div class="item-badge" style="color: #00e5ff;">Işınlan</div>
      `;
      item.onclick = () => this.teleportToCity(c.id, c.name);
      list.appendChild(item);
    });
  }

  teleportToCity(cityId, cityName) {
    if (this.ipc) {
      this.ipc.send('ets2:teleport', cityId);
    }
    this.showToast('Işınlanma', `${cityName} şehrine ışınlanılıyor ve tır otomatik yere indiriliyor...`);
    this.expandDynamicIsland('Işınlanma', `${cityName} ⚡`);
  }

  // ================= DİNAMİK ADA & BİLDİRİM TOAST =================
  expandDynamicIsland(leftText, rightText) {
    const island = document.getElementById('dynamicIsland');
    const l = document.getElementById('islandLeft');
    const r = document.getElementById('islandRight');
    if (island && l && r) {
      l.innerText = leftText;
      r.innerText = rightText;
      island.classList.add('expanded');
      setTimeout(() => {
        island.classList.remove('expanded');
      }, 3500);
    }
  }

  showToast(title, msg) {
    const toast = document.getElementById('phoneToast');
    const t = document.getElementById('toastTitle');
    const m = document.getElementById('toastMsg');
    if (toast && t && m) {
      t.innerText = title;
      m.innerText = msg;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }

  // ================= SES EFEKTLERİ =================
  getAudioContext() {
    if (!this.soundAudioCtx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.soundAudioCtx = new AudioContext();
      }
    }
    return this.soundAudioCtx;
  }

  playOpenSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.12);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, now);
      osc2.frequency.exponentialRampToValueAtTime(1760.00, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {}
  }

  playUnlockSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.50, now);
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  // ================= RADYO SİSTEMİ =================

  /**
   * Merkezi kapatma fonksiyonu — ETS2 kapanınca çağrılır.
   * Radyoyu durdurur, audio nesnesini temizler, timer'ları iptal eder.
   */
  shutdownPhoneSystem() {
    console.log('[PhoneApp] ETS2 kapandı: Tüm kaynaklar temizleniyor...');

    // 1. Korna sesini durdur
    try {
      if (this.hornAudio) {
        this.hornAudio.pause();
        this.hornAudio.src = '';
        this.hornAudio = null;
      }
    } catch (e) {}

    // 2. Radyoyu ve HLS bağlantısını durdur
    this._stopCurrentRadio();

    // 3. Tüm setInterval / setTimeout timer'larını iptal et
    if (this._tachoInterval) {
      clearInterval(this._tachoInterval);
      this._tachoInterval = null;
    }
    if (this._radioReconnectTimer) {
      clearTimeout(this._radioReconnectTimer);
      this._radioReconnectTimer = null;
    }

    // 4. UI temizle — dalga animasyonunu durdur
    try {
      const waves = document.getElementById('radioWaves');
      if (waves) waves.classList.remove('playing');
      const btn = document.getElementById('radioMainPlayBtn');
      if (btn) btn.textContent = '▶';
      const statusEl = document.getElementById('radioStatus');
      if (statusEl) statusEl.textContent = '';
    } catch (e) {}

    console.log('[PhoneApp] Tüm kaynaklar temizlendi.');
  }

  initRadioApp() {
    this.populateRadioStations();
    this._updateRadioUI();
  }

  populateRadioStations() {
    const list = document.getElementById('radioStationsList');
    if (!list) return;
    list.innerHTML = '';

    this.radioStations.forEach((station, index) => {
      const card = document.createElement('div');
      card.className = 'radio-station-card' + (index === this.currentRadioIndex ? ' active' : '');
      card.id = `radioCard_${index}`;
      card.onclick = () => this.playRadioStation(index);
      card.innerHTML = `
        <div class="radio-station-logo" style="background: linear-gradient(135deg, rgba(255,45,85,0.3), rgba(255,59,48,0.15)); border: 1px solid rgba(255,45,85,0.25);">${station.emoji}</div>
        <div style="flex:1; min-width:0;">
          <div class="radio-station-name">${station.name}</div>
          <div class="radio-station-genre">${station.genre}</div>
        </div>
        <div class="radio-station-badge ${index === this.currentRadioIndex ? 'playing' : 'live'}">${index === this.currentRadioIndex ? '▶ PLAYING' : 'CANLI'}</div>
      `;
      list.appendChild(card);
    });
  }

  playRadioStation(index) {
    const station = this.radioStations[index];
    if (!station) return;

    // Mevcut sesi durdur
    this._stopCurrentRadio();

    this.currentRadioIndex = index;
    this.isRadioPlaying = false;

    const statusEl = document.getElementById('radioStatus');
    if (statusEl) statusEl.textContent = 'Bağlanıyor...';

    // HLS mi normal mi?
    if (station.hls && typeof Hls !== 'undefined' && Hls.isSupported()) {
      // HLS.js ile oynat
      const audio = new Audio();
      audio.volume = this._getRadioVolume();
      const hls = new Hls();
      hls.loadSource(station.url);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audio.play().then(() => {
          this.isRadioPlaying = true;
          this._updateRadioUI();
        }).catch(e => this._handleRadioError(e));
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) this._handleRadioError(data);
      });
      this.radioAudio = audio;
      this.radioHls = hls;
    } else {
      // Düz Audio ile oynat (mp3, aac, aacp veya HLS.js yoksa fallback)
      const audio = new Audio(station.url);
      audio.volume = this._getRadioVolume();
      audio.crossOrigin = 'anonymous';
      audio.play().then(() => {
        this.isRadioPlaying = true;
        this._updateRadioUI();
      }).catch(e => this._handleRadioError(e));

      audio.onerror = (e) => this._handleRadioError(e);
      this.radioAudio = audio;
      this.radioHls = null;
    }

    // UI'yi hemen güncelle
    this._updateRadioActiveCard();
    this.expandDynamicIsland(station.name, `🎵 ${station.genre}`);
    this.showToast('Radyo', `${station.name} bağlanıyor...`);
  }

  toggleRadioPlay() {
    if (!this.radioAudio) {
      // Hiç seçili istasyon yoksa ilkini başlat
      if (this.currentRadioIndex === -1 && this.radioStations.length > 0) {
        this.playRadioStation(0);
      }
      return;
    }

    if (this.isRadioPlaying) {
      this.radioAudio.pause();
      this.isRadioPlaying = false;
    } else {
      this.radioAudio.play().then(() => {
        this.isRadioPlaying = true;
        this._updateRadioUI();
      }).catch(e => this._handleRadioError(e));
    }
    this._updateRadioUI();
  }

  setRadioVolume(val) {
    if (this.radioAudio) {
      this.radioAudio.volume = parseFloat(val);
    }
  }

  _getRadioVolume() {
    const slider = document.getElementById('radioVolumeSlider');
    return slider ? parseFloat(slider.value) : 0.8;
  }

  _stopCurrentRadio() {
    if (this.radioHls) {
      try { this.radioHls.destroy(); } catch (e) {}
      this.radioHls = null;
    }
    if (this.radioAudio) {
      try {
        this.radioAudio.pause();
        this.radioAudio.src = '';
        this.radioAudio.load();
      } catch (e) {}
      this.radioAudio = null;
    }
    this.isRadioPlaying = false;
  }

  _handleRadioError(e) {
    console.warn('[Radyo Hatası]:', e);
    this.isRadioPlaying = false;
    const statusEl = document.getElementById('radioStatus');
    if (statusEl) statusEl.textContent = 'Yayın şu anda kullanılamıyor';
    const waves = document.getElementById('radioWaves');
    if (waves) waves.classList.remove('playing');
    const btn = document.getElementById('radioMainPlayBtn');
    if (btn) btn.textContent = '▶';
    this.showToast('Radyo', 'Yayın şu anda kullanılamıyor');
  }

  _updateRadioUI() {
    const station = this.radioStations[this.currentRadioIndex];
    const titleEl = document.getElementById('radioActiveTitle');
    const categoryEl = document.getElementById('radioActiveCategory');
    const statusEl = document.getElementById('radioStatus');
    const logoEl = document.getElementById('radioActiveLogo');
    const waves = document.getElementById('radioWaves');
    const btn = document.getElementById('radioMainPlayBtn');

    if (station) {
      if (titleEl) titleEl.textContent = station.name;
      if (categoryEl) categoryEl.textContent = station.genre;
      if (logoEl) logoEl.textContent = station.emoji;
      if (statusEl) statusEl.textContent = this.isRadioPlaying ? '🟢 Canlı Yayın' : '⏸ Duraklatıldı';
    } else {
      if (titleEl) titleEl.textContent = 'Radyo Seçin';
      if (categoryEl) categoryEl.textContent = 'Aşağıdan bir istasyon seçin';
      if (statusEl) statusEl.textContent = '';
    }

    if (waves) {
      if (this.isRadioPlaying) waves.classList.add('playing');
      else waves.classList.remove('playing');
    }
    if (btn) btn.textContent = this.isRadioPlaying ? '⏸' : '▶';

    this._updateRadioActiveCard();
  }

  _updateRadioActiveCard() {
    // Tüm kartları güncelle
    this.radioStations.forEach((_, i) => {
      const card = document.getElementById(`radioCard_${i}`);
      const badge = card ? card.querySelector('.radio-station-badge') : null;
      if (card) {
        if (i === this.currentRadioIndex) {
          card.classList.add('active');
          if (badge) { badge.className = 'radio-station-badge playing'; badge.textContent = '▶ PLAYING'; }
        } else {
          card.classList.remove('active');
          if (badge) { badge.className = 'radio-station-badge live'; badge.textContent = 'CANLI'; }
        }
      }
    });
  }

  // ================= iOS SANAL KLAVYE YÖNETİMİ =================
  openKeyboard(inputId) {
    this.activeKeyboardInputId = inputId;
    const kb = document.getElementById('iosKeyboard');
    const hint = document.getElementById('keyboardTargetHint');
    const targetInput = document.getElementById(inputId);

    if (hint && targetInput) {
      hint.innerText = targetInput.placeholder || 'Metin Yazın';
    }
    if (kb) {
      kb.classList.add('open');
    }
  }

  closeKeyboard() {
    const kb = document.getElementById('iosKeyboard');
    if (kb) {
      kb.classList.remove('open');
    }
    this.activeKeyboardInputId = null;
  }

  keyPress(char) {
    if (!this.activeKeyboardInputId) return;
    const input = document.getElementById(this.activeKeyboardInputId);
    if (!input) return;

    if (char === 'BACKSPACE') {
      input.value = input.value.slice(0, -1);
    } else if (char === 'SPACE') {
      input.value += ' ';
    } else if (char === 'ENTER') {
      this.closeKeyboard();
      return;
    } else if (char === 'CAPS') {
      this.isCapsOn = !this.isCapsOn;
      return;
    } else if (char === '123') {
      return;
    } else {
      const letter = this.isCapsOn ? char.toUpperCase() : char.toLowerCase();
      input.value += letter;
    }
  }
}

// PhoneApp Başlat
window.addEventListener('DOMContentLoaded', () => {
  window.phoneApp = new PhoneApp();
});

// FALLBACK: Pencere destroy/unload anında radyoyu kesinlikle durdur
window.addEventListener('beforeunload', () => {
  if (window.phoneApp) {
    window.phoneApp.shutdownPhoneSystem();
  }
});
