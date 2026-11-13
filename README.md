# 앱 관제 오비트 (gurifire/orbit)

gurifire 계정의 GitHub Pages 웹앱을 궤도 화면으로 모아 보고, 앱별 이용자 수를 실시간으로 보여줍니다.

- 주소: https://gurifire.github.io/orbit/
- `index.html` : 관제 화면 (v1.0.0)
- `track.js` : 각 앱에 넣는 이용자 카운터 (모든 앱 공통 한 줄)

## 새 앱 추가
### 방법 A — 오비트에서 바로 반영 (권장)
1. gurifire에 공개 저장소를 만들고 맨 위에 `index.html`을 올린다.
2. 오비트 아래 **[저장소 반영]** → **미반영** 목록에 나타난 저장소를 체크 → 분류 선택 → **[선택 반영]**.
3. 자동 처리: 궤도 포함 + 분류 저장(config.json) + 카운터 한 줄 설치 + GitHub Pages 켜기. 1~2분 뒤 궤도에 나타난다.

처음 한 번은 관리자 토큰 등록이 필요하다 (메뉴 → 관리자 토큰).
fine-grained token · All repositories · Contents / Pages / Administration = Read and write · 90일.
토큰은 그 기기 브라우저에만 저장된다.

### 방법 B — 수동
1. 저장소 Settings → Pages → main 켜기 → 최대 10분 뒤 궤도에 자동 등장 (분류는 키워드로 자동, 안 맞으면 미분류).
2. index.html의 `</body>` 앞에 카운터 한 줄 추가:

```html
<script async src="https://gurifire.github.io/orbit/track.js"></script>
```

## 공용 설정 config.json
제외 목록(`exclude`), 분류 지정(`assign`), 앱 표시 이름(`names`). 오비트 관리 화면에서 바뀌며, 직접 고쳐도 된다.
분류 키: `response`(재난대응) · `prevent`(화재예방) · `life`(생활·외부) · `etc`(미분류).



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

## 내부 앱(폴더 앱) 가지 — v1.4.0
- 저장소 안에 `폴더/index.html`이 2개 이상이면(예: 일상툴 `tools/date-calc/`) 그 앱 위성 둘레에 **작은 점(가지)** 으로 표시된다.
- 위성(또는 목록의 앱)을 누르면 **내부 궤도**로 펼쳐져 내부 앱마다 이름·오늘 사용자 수가 보인다. [← 전체 궤도]로 복귀.
- 새 폴더 앱을 추가해 배포하면 자동으로 가지가 늘어난다 (저장소에 새 배포가 있을 때만 다시 조회).
- 카운터 track.js v1.1부터 `/저장소/폴더/` 방문을 `저장소~폴더` 키로도 함께 집계한다 (모 앱 숫자 = 내부 앱 합계 포함).
- 가지를 끄려면 index.html `CONFIG.subOff`에 저장소 이름을 넣는다. `_`·`.`으로 시작하는 폴더와 data·assets 등은 제외.
