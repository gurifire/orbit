/*
 * gurifire 앱 이용자 카운터 (track.js) v1.0.0 · 2026-11-12
 * - 각 웹앱에 한 줄만 넣으면 됨:
 *     <script async src="https://gurifire.github.io/orbit/track.js"></script>
 * - 앱 이름은 주소의 첫 폴더(gurifire.github.io/<저장소>/)로 자동 인식 → 새 저장소도 같은 한 줄
 * - 보내는 것: 방문 수, 기기 수(이 기기 첫 방문 여부), 접속 중 표시(60초마다 시각)
 * - 보내지 않는 것: 이름·위치·입력 내용 등 개인정보 없음. 기기 ID는 무작위 문자열
 * - 저장 위치: Firebase Realtime Database의 /_orbit 경로 (아래 DB 한 줄만 바꾸면 전 앱 일괄 변경)
 * - 구형 안드로이드 대응: ES5 문법만 사용, 실패해도 앱 동작에 영향 없음
 * - 집계 제외: 오비트 화면 메뉴의 "이 기기 집계 제외" (같은 gurifire.github.io 안 모든 앱에 적용)
 */
(function () {
  try {
    var DB = 'https://gurichecklist-default-rtdb.asia-southeast1.firebasedatabase.app/_orbit';
    var loc = window.location;
    if (!/\.github\.io$/.test(loc.hostname)) return; // 내 PC·미리보기에서는 집계 안 함

    var ls = null;
    try { ls = window.localStorage; ls.getItem('orbit:dev'); } catch (e) { ls = null; }
    function get(k) { try { return ls ? ls.getItem(k) : null; } catch (e) { return null; } }
    function put(k, v) { try { if (ls) ls.setItem(k, v); } catch (e) {} }

    if (get('orbit:notrack') === '1') return;

    var app = '';
    var cs = document.currentScript;
    if (cs && cs.getAttribute('data-app')) app = cs.getAttribute('data-app');
    if (!app) app = loc.pathname.split('/')[1] || 'root';
    app = app.replace(/[.#$\[\]\/]/g, '_').slice(0, 60) || 'root';
    if (app === 'orbit') return;

    var dev = get('orbit:dev');
    if (!dev) {
      dev = 'd' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      put('orbit:dev', dev);
    }

    function kstDay() {
      var d = new Date(new Date().getTime() + 9 * 3600000);
      return d.toISOString().slice(0, 10).replace(/-/g, '');
    }
    var INC = { '.sv': { 'increment': 1 } };
    var TS = { '.sv': 'timestamp' };

    function send(body, onOk) {
      try {
        var x = new XMLHttpRequest();
        x.open('PATCH', DB + '.json', true);
        x.setRequestHeader('Content-Type', 'application/json');
        x.timeout = 10000;
        x.onreadystatechange = function () {
          if (x.readyState === 4 && x.status >= 200 && x.status < 300 && onOk) { try { onOk(); } catch (e) {} }
        };
        x.send(JSON.stringify(body));
      } catch (e) {}
    }

    function visit() {
      var day = kstDay();
      var b = {};
      var firstEver = get('orbit:u:' + app) !== '1';
      var firstToday = get('orbit:d:' + app) !== day;
      b['apps/' + app + '/v'] = INC;
      b['apps/' + app + '/last'] = TS;
      b['daily/' + day + '/' + app + '/v'] = INC;
      if (firstEver) b['apps/' + app + '/u'] = INC;
      if (firstToday) b['daily/' + day + '/' + app + '/u'] = INC;
      b['live/' + app + '/' + dev] = TS;
      send(b, function () {
        if (firstEver) put('orbit:u:' + app, '1');
        if (firstToday) put('orbit:d:' + app, day);
      });
    }

    function beat() {
      if (document.hidden) return;
      var b = {};
      b['live/' + app + '/' + dev] = TS;
      send(b);
    }

    var started = false;
    function start() {
      if (started) return;
      started = true;
      visit();
      setInterval(beat, 60000);
      document.addEventListener('visibilitychange', function () { if (!document.hidden) beat(); });
    }
    if (document.readyState === 'complete') setTimeout(start, 1500);
    else window.addEventListener('load', function () { setTimeout(start, 1500); });
  } catch (e) {}
})();
