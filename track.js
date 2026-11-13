/*
 * gurifire 앱 이용자 카운터 (track.js) v1.1.0 · 2026-11-14 (폴더 앱 집계 추가)
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
    // v1.1: 저장소 안 폴더 앱(예: /tools/date-calc/)은 '저장소~폴더' 키로도 함께 집계 → 오비트에서 내부 앱 가지로 표시
    var keys = [app];
    var seg = loc.pathname.split('/');
    if (!(cs && cs.getAttribute('data-app')) && seg.length >= 3 && /^[A-Za-z0-9_-]{1,40}$/.test(seg[2] || '')) keys.push(app + '~' + seg[2]);

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
      var b = {}, marks = [];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var firstEver = get('orbit:u:' + k) !== '1';
        var firstToday = get('orbit:d:' + k) !== day;
        b['apps/' + k + '/v'] = INC;
        b['apps/' + k + '/last'] = TS;
        b['daily/' + day + '/' + k + '/v'] = INC;
        if (firstEver) b['apps/' + k + '/u'] = INC;
        if (firstToday) b['daily/' + day + '/' + k + '/u'] = INC;
        b['live/' + k + '/' + dev] = TS;
        marks.push([k, firstEver, firstToday]);
      }
      send(b, function () {
        for (var j = 0; j < marks.length; j++) {
          if (marks[j][1]) put('orbit:u:' + marks[j][0], '1');
          if (marks[j][2]) put('orbit:d:' + marks[j][0], day);
        }
      });
    }

    function beat() {
      if (document.hidden) return;
      var b = {};
      for (var i = 0; i < keys.length; i++) b['live/' + keys[i] + '/' + dev] = TS;
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
