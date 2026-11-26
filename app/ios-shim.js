// iOS uygulamasi icin ETS2.SITE PHONE uyarlamasi.
// Bu dosya sadece Phone/phone.html acilirken (sayfadan once) calisir; phone.html/js/css dosyalarina dokunulmaz.
//  - Electron'un ipcRenderer'i yerine Wi-Fi uzerinden PC'deki ETS2.SITE'a (port 5565) giden bir kopru verir
//  - Telefon cercevesini iPhone ekranini dolduracak sekilde olcekler
//  - Ana ekrana "Button Box" (Krankmili) simgesi ekler
(function () {
  if (!/\/Phone\/phone\.html$/.test(decodeURIComponent(location.pathname))) return;

  function post(o) { try { window.webkit.messageHandlers.kb.postMessage(o); } catch (e) {} }

  var handlers = {};
  // PC penceresine ozel islemler (surukleme, gizleme, kapatma): iPhone'da anlami yok
  var LOCAL_ONLY = {
    'phone:toggle': 1, 'phone:close': 1, 'app:quit': 1, 'browser:close': 1,
    'window:drag_start': 1, 'window:drag_move': 1, 'window:drag_end': 1
  };

  var ipc = {
    send: function (ch, arg) {
      if (LOCAL_ONLY[ch]) return;
      if (ch === 'browser:open') {
        if (arg && arg.url) post({ op: 'openURL', url: String(arg.url) });
        return;
      }
      post({ op: 'phone', line: JSON.stringify({ ch: ch, arg: arg === undefined ? null : arg }) });
    },
    on: function (ch, fn) { (handlers[ch] = handlers[ch] || []).push(fn); return ipc; },
    once: function (ch, fn) {
      var w = function (e, d) { ipc.removeListener(ch, w); fn(e, d); };
      return ipc.on(ch, w);
    },
    removeListener: function (ch, fn) {
      if (handlers[ch]) handlers[ch] = handlers[ch].filter(function (f) { return f !== fn; });
      return ipc;
    },
    removeAllListeners: function (ch) { if (ch) delete handlers[ch]; else handlers = {}; return ipc; }
  };

  function fire(ch, data) {
    (handlers[ch] || []).slice().forEach(function (fn) {
      try { fn({}, data); } catch (e) { console.error('[ios-shim]', ch, e); }
    });
  }

  window.require = function (m) {
    if (m === 'electron') return { ipcRenderer: ipc };
    throw new Error('Cannot find module ' + m);
  };

  // native -> sayfa
  window.phoneOnLine = function (s) {
    var m; try { m = JSON.parse(s); } catch (e) { return; }
    if (m && m.ch) fire(m.ch, m.data);
  };
  window.phoneOnState = function (st) {
    var r = document.getElementById('islandRight');
    if (!r) return;
    if (st === 'connected') { r.textContent = 'BAĞLI'; r.style.color = '#34c759'; }
    else { r.textContent = 'PC YOK'; r.style.color = '#8e8e93'; }
  };

  // ---- ekrana sigdirma
  var CSS =
    'html,body{background:#000!important;}' +
    'body{display:flex!important;align-items:flex-start!important;justify-content:center!important;}' +
    '.iphone-frame{padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;' +
    '  transform:none!important;opacity:1!important;transition:none!important;}' +
    '.iphone-frame.hidden{transform:none!important;opacity:1!important;pointer-events:auto!important;}' +
    '.btn-action,.btn-vol-up,.btn-vol-down,.btn-power,.btn-camera-control,.screen-glare{display:none!important;}' +
    '.iphone-screen{border-radius:0!important;}' +
    '.app-icon.icon-buttonbox{background:linear-gradient(135deg,#ffb020,#ff7a00)!important;}';

  var DESIGN_W = 374;   // telefon ekraninin tasarim genisligi (394 kasa - 2x10 bosluk)
  var DESIGN_H = 810;
  function fit() {
    var f = document.getElementById('iphoneFrame');
    if (!f) return;
    var W = window.innerWidth, H = window.innerHeight;
    var z, w, h;
    if (H >= W) { z = W / DESIGN_W; w = DESIGN_W; h = H / z; }          // dik: tam ekran
    else { z = H / DESIGN_H; h = DESIGN_H; w = DESIGN_W; }               // yatay: ortada telefon
    f.style.zoom = z;
    f.style.width = w + 'px';
    f.style.height = h + 'px';
  }

  function addButtonBoxIcon() {
    var grid = document.getElementById('appGrid');
    if (!grid || grid.querySelector('[data-app="buttonbox"]')) return;
    var it = document.createElement('div');
    it.className = 'app-item';
    it.setAttribute('data-app', 'buttonbox');
    it.innerHTML =
      '<div class="app-icon icon-buttonbox">' +
      '<svg viewBox="0 0 24 24" fill="#ffffff"><path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"/></svg>' +
      '</div><div class="app-name">Button Box</div>';
    it.addEventListener('click', function (e) {
      e.stopPropagation();
      location.href = '../Box/panel.html';
    });
    grid.appendChild(it);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    fit();
    addButtonBoxIcon();
    post({ op: 'ready', page: 'phone' });
    // PC'de Ctrl+T ile acilisin aynisi: kilit ekrani + acilis sesi
    setTimeout(function () { fire('phone:open'); }, 60);
  });
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });
})();
