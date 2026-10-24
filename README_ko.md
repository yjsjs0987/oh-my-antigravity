# OMO for Antigravity

[English](README.md) | **한국어**

> **파생 저작물 고지 (NOTICE).** 이 저장소는 [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) v5.1.40 (© YeonGyu-Kim)을 Google Antigravity에 맞게 이식·수정한 파생 저작물입니다. 무료로, 비상업적 용도로만 배포되며, 업스트림의 **Sustainable Use License (SUL-1.0)** 조항이 그대로 적용됩니다 — 전문은 [LICENSE](./LICENSE)를 참고하세요. SUL-1.0은 source-available 라이선스이며 OSI 오픈소스 정의와는 다릅니다. 라이선스의 법적 효력은 영문 원문([LICENSE](./LICENSE))을 따릅니다.

**OMO(oh-my-openagent) 워크플로를 Google Antigravity에서 그대로 쓰세요.** OpenCode에서 쓰던 32개 스킬, 11개 서브에이전트, 엄선된 MCP 서버, 안전장치 훅이 한 줄 설치로 Antigravity의 전역 설정 파일로 들어갑니다. `/슬래시커맨드` 근육 기억도, 위임 습관도, 파일 읽기 전 덮어쓰기 방지 가드도 그대로 옮아옵니다.

**대상:** Antigravity로 전환하는 OMO 사용자. OpenCode 쪽 OMO 패키지는 **전혀 수정하지 않으므로** 전환 기간 동안 양쪽을 나란히 쓸 수 있습니다.

## 하이라이트

| | |
| --- | --- |
| **스킬 32개** | 개발(10) · 리서치/비주얼(5) · ulw 워크플로(4) · 팀형(5) · 유지보수(8) — 모든 스킬은 `/<이름>` 슬래시 커맨드로도 호출 |
| **서브에이전트 11개** | sisyphus(오케스트레이션 리드, mainAgent), hephaestus, sisyphus-junior, oracle, librarian, explore, metis, momus, atlas, multimodal-looker, prometheus |
| **MCP 서버 5개** | context7(라이브러리 문서), grep_app(실전 코드 검색), websearch, lsp(진단/이름변경/심볼), omo-git-bash |
| **훅 9개** | omo-write-guard(읽기 전 덮어쓰기 차단), omo-keyword-detector(`ulw`/hyperplan/team 키워드 프로토콜), omo-task-reminder(미완료 작업 리마인더), omo-ast-grep-provision(도구 점검), omo-readme-injector + omo-agents-md-injector(프로젝트 오리엔테이션), omo-context-injector(세션 방향 안내), omo-session-notify(비프), omo-stop-continuation(계획이 끝날 때까지 에이전트 유지) |
| **도구** | 원클릭 런처 + 설치/제거/진단/검증 — npm 의존성 0 |

## 이식 현황

업스트림 OMO 훅 56개 중 **10개**가 Antigravity 네이티브 핸들러로 이식됐습니다 — 현재 훅 계약으로 가능한 전부입니다. 나머지 46개는 사유와 함께 [NOT-PORTED.md](./NOT-PORTED.md)에 기록돼 있습니다: 24개는 계약 공백 대기(예: PostToolUse 출력 의미 미정의), 22개는 OpenCode 런타임 내부(세션/compaction/TUI) 전용. 스킬·에이전트·MCP 계층은 100% 이식됐습니다.

## 설치 — 단계별 가이드

### 0단계 — 사전 준비

- **Node.js 20 이상** — 설치기와 훅 핸들러가 여기서 동작합니다. [nodejs.org](https://nodejs.org)에서 LTS를 받아 실행한 뒤 아무 터미널에서 확인:
  ```powershell
  node --version
  ```
- **Google Antigravity** — 데스크톱 앱 또는 IDE가 설치·로그인되어 있어야 합니다.

### 1단계 — 이 저장소 받기

둘 중 편한 방법을 쓰세요. 폴더 위치는 어디든 됩니다(예: `C:\Users\<사용자>\oh-my-antigravity`). **설치 후에도 폴더를 유지하세요** — 제거 도구의 소스이기도 합니다.

**방법 A — git 사용:**
```powershell
git clone https://github.com/yjsjs0987/oh-my-antigravity.git
cd oh-my-antigravity
```

**방법 B — git 없이:**
1. 이 GitHub 페이지에서 초록 **Code** 버튼 → **Download ZIP**.
2. 내려받은 `oh-my-antigravity-main.zip`을 우클릭 → **모두 압축 풀기** → 풀린 폴더를 엽니다.

### 2단계 — 설치기 실행

폴더에서 **`install.cmd`를 더블클릭**하세요. (내려받은 파일은 처음 실행 시 Windows SmartScreen이 경고할 수 있습니다 — **추가 정보 → 실행**.) 터미널이라면:

```powershell
node scripts\install.mjs
```

일어나는 일: 스킬 32개, 에이전트 11개, 룰 1개, 훅 핸들러 9개가 `~\.gemini\config\`로 복사되고, MCP/훅 등록이 설정 JSON에 병합됩니다. 기존 `mcp_config.json` / `hooks.json`은 **먼저 백업**(`*.omo-backup-<타임스탬프>.json`)되고 우리 키만 추가됩니다 — 다른 키는 하나도 건드리지 않습니다. 설치기는 멱등적이라 재실행해도 안전합니다.

고급 플래그(선택, 터미널 전용):

- `--home <dir>` — 지정한 홈에 설치(테스트용).
- `--cli` — 스킬을 `~\.gemini\antigravity-cli\skills\`에 추가 복사(Antigravity CLI용).
- `--dry-run` — 아무것도 쓰지 않고 설치 계획(파일 수, 병합 키)만 출력.
- `--no-validate` — 마지막 자동 구조 검증 생략.

### 3단계 — Antigravity 재시작

Antigravity를 **완전히 종료**(시스템 트레이의 백그라운드 아이콘 확인)한 뒤 다시 열어 `~\.gemini\config\`의 전역 설정을 다시 읽게 합니다.

### 4단계 — 확인

1. **`doctor.cmd`** 더블클릭 — 모든 줄이 `[PASS]`(경고는 허용)이고 마지막에 **"Integration looks healthy."**가 나오면 정상.
2. Antigravity 채팅에서 `/git-master`(또는 아무 스킬 이름)를 입력 — 스킬이 로드되면 성공. `ulw`를 입력하면 라우터가 **계획 / 실행 / 리서치** 중 무엇인지 물어봅니다.
3. 위임을 쓴다면 포팅된 서브에이전트를 이름으로 호출해 보세요.

끝입니다. 제거는 [제거](#제거)를, 일부러 안 옮긴 것은 [NOT-PORTED.md](./NOT-PORTED.md)를 참고하세요.

## ulw 워크플로 진입점

`ulw`(ultrawork)는 OMO 워크플로 계열의 공유 진입 키워드입니다. 이 포트에서는 전용 `ulw` 라우터 스킬이 bare 키워드와 `/ulw` 커맨드를 처리합니다:

- 구현 전 계획 → `ulw-plan`
- 작성된 `.omo/plans` 작업 계획 실행 → `ulw-execute`
- 리서치 / 심층 조사 → `ulw-research`
- 모호하면 → 라우터가 셋 중 무엇인지 물어봅니다

## 설치되는 것과 위치

| 산출물 | 경로 (사용자 홈 기준) |
| --- | --- |
| 스킬 32개 | `~\.gemini\config\skills\<이름>\SKILL.md` |
| 에이전트 11개 | `~\.gemini\config\agents\<이름>.md` |
| 룰 1개 | `~\.gemini\config\rules\omo-port.md` |
| 훅 핸들러 9개 | `~\.gemini\config\omo-handlers\*.mjs` |
| MCP 등록 5개 | `~\.gemini\config\mcp_config.json`에 병합 |
| 훅 등록 9개 | `~\.gemini\config\hooks.json`에 병합 |

기존 `mcp_config.json` / `hooks.json`은 병합 **전에** `*.omo-backup-<타임스탬프>.json`으로 백업됩니다 — 우리 키만 추가되고 다른 키는 그대로입니다. 키 충돌 시에는 원본을 보존하고 우리 것을 `omo-<키>` 이름으로 저장합니다.

## 검증 (Validate)

```powershell
node scripts\validate.mjs
```

의존성 0. 6개 스위트(스킬, 에이전트, MCP, 훅, 룰, NOT-PORTED 행 수)가 모두 통과하면 요약 표와 함께 exit 0, 위반이 있으면 위반 목록과 함께 exit 1. 설치기는 `--no-validate`를 주지 않는 한 마지막에 이것을 자동 실행합니다.

## 진단 (Doctor)

뭔가 이상할 때 **설치된 상태**를 자동 진단합니다:

```powershell
node scripts\doctor.mjs
```

검사 항목: 설정 디렉터리, 스킬 32/에이전트 11/룰 존재, 핸들러 9개 파싱(`node --check`), MCP 키 등록 + 진입 파일 실재(OMO 패키지가 삭제됐으면 경고), `omo-*` 훅 키 9개 등록, 설치된 write-guard 라이브 스모크 테스트. `[FAIL]`이 있으면 재설치 안내와 함께 exit 1, 경고만 있으면 exit 0. 플래그: `--repo`로 저장소 구조 검증 병행, `--home <dir>`으로 대상 홈 지정.

## 제거 (Uninstall)

저장소 루트에서 한 줄:

```powershell
node scripts\uninstall.mjs          # --dry-run으로 미리보기
```

**우리 산출물만** 제거합니다 — 스킬 32개 디렉토리, 에이전트 11개, 룰, `omo-handlers\`, `hooks.json`의 우리 `omo-*` 키, `mcp_config.json`의 우리 5키(또는 `omo-<키>` 충돌 사본) — JSON 두 개를 `*.omo-backup-<타임스탬프>.json`으로 백업한 뒤에요. 설정의 다른 모든 것은 건드리지 않고, `*.omo-backup-*.json` 파일은 보존됩니다.

수동 대안(저장소가 없을 때): `~\.gemini\config\skills\<우리 32개 스킬 디렉토리>`, `agents\<우리 11개 .md>`, `rules\omo-port.md`, `omo-handlers\`를 삭제하고, `hooks.json`에서 `omo-*` 9키와 `mcp_config.json`에서 우리 5키를 제거 — 또는 `*.omo-backup-<타임스탬프>.json` 백업으로 두 파일을 복원.

## 이식 안 한 것

[NOT-PORTED.md](./NOT-PORTED.md) 참고 — 전수 백로그입니다: 업스트림 훅 디렉터리 56개 전부(각각 목적·사유·향후 이식 가능성 포함)와 비훅 기능(TUI, config 스키마, CLI 설치기, 모델 변형, bin 진입점, postinstall, team-mode 메일박스, 세션/compaction/monitor, workspace 패키지).

## 유지보수

**독립 포트**입니다: OMO 업데이트가 자동 동기화되지 않습니다. 최신 OMO를 다시 이식하려면 `MAPPING.md` 변환 규칙을 수동으로 적용하세요 — 자동화는 제공되지 않습니다.

## 라이선스

업스트림 **Sustainable Use License (SUL-1.0)**로 배포 — 무료, 비상업적 사용. [LICENSE](./LICENSE) 참고. 출처: YeonGyu-Kim의 [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) 파생.

**Q4 고지:** 구조 검증(`validate.mjs` green)만 수행했고 Antigravity 실구동 검증은 없습니다. 첫 실사용은 사용자가 직접 확인해야 합니다.
