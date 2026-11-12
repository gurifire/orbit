# 앱 관제 오비트 (gurifire/orbit)

gurifire 계정의 GitHub Pages 웹앱을 궤도 화면으로 모아 보고, 앱별 이용자 수를 실시간으로 보여줍니다.

- 주소: https://gurifire.github.io/orbit/
- `index.html` : 관제 화면 (v1.0.0)
- `track.js` : 각 앱에 넣는 이용자 카운터 (모든 앱 공통 한 줄)

## 새 앱 추가
1. 새 저장소에서 GitHub Pages를 켠다 → 최대 10분 뒤 궤도에 자동으로 노드가 생긴다.
2. 그 앱 index.html의 `</body>` 바로 앞에 한 줄 추가 → 이용자 수가 집계된다.

```html
<script async src="https://gurifire.github.io/orbit/track.js"></script>
```

궤도에서 빼고 싶은 저장소는 `index.html`의 `CONFIG.exclude`에 이름을 넣는다.

## 데이터 저장 위치
Firebase Realtime Database `gurichecklist` 의 `/_orbit` 경로 (지원반 데이터 `sessions` 와 분리).
- `apps/{앱}/v·u·last` : 누적 방문·누적 기기·최근 접속
- `daily/{YYYYMMDD}/{앱}/v·u` : 일별 방문·기기
- `live/{앱}/{기기ID}` : 60초마다 갱신되는 접속 표시

DB를 옮기려면 `track.js`의 `DB`와 `index.html`의 `CONFIG.db` 두 줄만 바꾸면 모든 앱에 한 번에 적용된다.

## Firebase 규칙 (gurichecklist → Realtime Database → 규칙)
기존 규칙은 그대로 두고 `"rules": {` 안에 아래 블록만 추가:

```json
"_orbit": {
  ".read": true,
  "apps":  { "$app": { ".write": true } },
  "daily": { "$day": { "$app": { ".write": true } } },
  "live":  { "$app": { ".write": true } }
}
```
