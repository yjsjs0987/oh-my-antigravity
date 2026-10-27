# OMO → Antigravity 이식 — 종합 보고서

**완료일:** 2026-10-24
**소스:** OMO v5.1.40 (`~\.cache\opencode\packages\oh-my-openagent@latest`, 읽기 전용 — 무변경)
**대상:** Antigravity 전역 설정 (`~\.gemini\config\`)
**총 소요:** 3시간 4분 30초 · 커밋 17건 · 검증 20/20 통과 (구현 16 + 최종 게이트 4)

---

## 1. 설치 방법

### 사전 준비
- Node.js (설치 스크립트·핸들러·일부 스킬 번들 스크립트가 node로 실행)
- Antigravity 설치됨 (설치 후 재시작하여 설정을 다시 읽게 함)

### 설치
```powershell
# 저장소 루트에서
node scripts/install.mjs
```

**설치되는 위치** (`~` = 사용자 홈, Windows `%USERPROFILE%`):

| 대상 | 경로 | 내용 |
| --- | --- | --- |
| 스킬 32종 | `~\.gemini\config\skills\<name>\SKILL.md` | 자동 발견 + `/<name>` 슬래시 커맨드 |
| 에이전트 11종 | `~\.gemini\config\agents\<name>.md` | custom subagent로 등록 |
| 룰 1건 | `~\.gemini\config\rules\omo-port.md` | 설치된 스킬 선호 안내 |
| 핸들러 9종 | `~\.gemini\config\omo-handlers\*.mjs` | 훅 실행체 |
| MCP 등록 | `~\.gemini\config\mcp_config.json` (병합) | 5개 서버 키 |
| 훅 등록 | `~\.gemini\config\hooks.json` (병합) | 9개 `omo-*` 키 |

**안전장치:** 기존 `mcp_config.json`/`hooks.json`이 있으면 `*.omo-backup-<타임스탬프>.json`으로 **백업 후 병합**하고, 우리 키만 쓰습니다. 기존 키와 값 충돌 시 원본을 보존하고 우리 것을 `omo-<키>`로 저장합니다. 재실행해도 결과 동일(멱등).

### 플래그
- `--home <dir>` — 테스트용 사용자 홈 지정
- `--cli` — Antigravity CLI용으로 스킬을 `~\.gemini\antigravity-cli\skills\`에 추가 복사
- `--dry-run` — 쓰기 없이 설치 계획만 출력
- `--no-validate` — 종료 시 자동 구조 검증 생략

### 검증 / 제거
```powershell
node scripts\validate.mjs   # 구조 검증 (exit 0 = green)
```
제거는 스크립트 하나: `node scripts\uninstall.mjs` (저장소 루트에서; `--dry-run` 미리보기 지원). 우리 산출물만 지우고 남의 설정은 건드리지 않으며, JSON 수정 전 백업을 남깁니다. 수동 절차: 설치된 32개 스킬 디렉토리, 11개 에이전트 파일, `rules\omo-port.md`, `omo-handlers\`, `hooks.json`의 `omo-*` 9키, `mcp_config.json`의 5키(또는 백업 복원). 전체 절차는 README.md 참고.

### 사용 방법
- **스킬:** Antigravity가 자동 발견 — 본문 키워드로 발동하거나 `/<이름>`으로 수동 호출 (예: `/git-master`, `/debugging`, `/ulw-plan`)
- **에이전트:** 메인 에이전트가 `invoke_subagent`로 위임 (sisyphus를 기본 에이전트로 지정 시 오케스트레이션 체험과 동일)
- **MCP 도구:** Antigravity 도구 목록에 자동 노출 (context7 문서 조회, grep_app 코드 검색, websearch, lsp 진단/정의이동/참조검색, omo-git-bash)
- **훅:** 자동 동작 (아래 9종)
- **선택 사항:** `CONTEXT7_API_KEY` / `EXA_API_KEY`를 쓰면 MCP 서버 headers에 직접 추가해 라이트츠 제한 해제 가능 (기본값은 키 없이 동작)

---

## 2. 포함된 기능 전수 목록

### 스킬 32종

**개발 (10)**
| 스킬 | 용도 | `/커맨드` |
| --- | --- | --- |
| ast-grep | AST 기반 25개 언어 코드 검색·재작성 (패턴 매칭) | /ast-grep |
| debugging | 가설 기반 디버깅 루프 (크래시·무음 실패·행) | /debugging |
| frontend | HTML/CSS/SVG UI·차트·보고서 제작·폴리시 | /frontend |
| git-master | git 작업 전용 (원자 커밋·rebase·bisect·blame) | /git-master |
| init-deep | 프로젝트 AGENTS.md 지식베이스 초기화 | /init-deep |
| lsp-setup | 언어 서버 설치·연결 (diagnostics/go-to-def/rename) | /lsp-setup |
| programming | Python/Rust/TS/Go 엄격 모던 관행 | /programming |
| refactor | 리팩터·정리·재구성 가이드 | /refactor |
| remove-ai-slops | AI 코드 스멜 제거 (회귀 테스트 보호 하) | /remove-ai-slops |
| review-work | 구현 후 게이트 리뷰 (직접 QA + 단일 리뷰어) | /review-work |

**리서치/비주얼 (5)**
| 스킬 | 용도 |
| --- | --- |
| browser | omowright 기반 실제 브라우저 구동 (폼·클릭·스크린샷·웹 QA) |
| coding-agent-sessions | 로컬 에이전트 로그에서 과거 세션 검색·복원 |
| data-scientist | DuckDB/Polars 커널 데이터 분석 (CSV/parquet/JSON) |
| ultimate-browsing | WAF 차단·봇 검증 호스트 우회 열람 |
| visual-qa | Apple HIG 기준 시각 QA (라이트/다크·모바일/데스크톱 캡처) |

각 SKILL.md 말미에 "## External requirements" 절이 있어 필요 런타임(Node/Python/Playwright 등)과 실행법을 안내합니다.

**워크플로 (4)** — bare `ulw`/`/ulw` 진입 라우터 포함 (OMO 원본의 keyword-detector 훅 라우팅을 스킬로 근사)
| 스킬 | 용도 |
| --- | --- |
| ulw | 진입 라우터 — bare `ulw`/`/ulw`를 plan/execute/research로 분기 (모호하면 질문) |
| ulw-plan | 탐색 선행 계획 수립 (ground→route→interview→gate→plan + 승인 게이트, scaffold 번들 포함) |
| ulw-execute | 작성된 계획을 웨이브별 병렬 서브에이전트로 실행 (체크박스·증거·멱등) |
| ulw-research | 최대 포화 리서치 (팀 병렬·claim-graph 게이팅·인용 산출물) |

**팀형 프로젝트 (5)** — team-mode API를 "역할별 invoke_subagent 병렬 호출 + 종합" 절차로 변환
| 스킬 | 용도 |
| --- | --- |
| github-triage | 읽기 전용 GitHub 이슈/PR 트리아지 (1항목=1 서브에이전트) |
| hyperplan | 5개 적대 역할(skeptic/validator/researcher/architect/creative) 다중 에이전트 계획 |
| pre-publish-review | 12에이전트 핵심 등급 발행 전 게이트 |
| work-with-pr | 워크트리 기반 PR 전체 라이프사이클 |
| security-research | 취약점 헌터 3 + PoC 엔지니어 2 보안 감사 (+`## Slash-command usage` 절 = /security-research) |

**유지보수 (8)**
| 스킬 | 용도 | `/커맨드` 통합 |
| --- | --- | --- |
| codex-qa | OMO Codex Light 에디션 자체 QA (격리) | — |
| get-unpublished-changes | npm 미발행 변경 분석 | ✓ |
| omomomo | OMO 소개 이스터에그 | ✓ |
| opencode-qa | opencode 자체 QA (CLI/SSE 훅 증명) | — |
| publish | npm 게시 워크플로 (GitHub Actions 트리거·검증) | ✓ |
| remove-deadcode | LSP 검증 안전 데드코드 제거 (병렬 딥 에이전트) | ✓ |
| senpi-qa | Senpi 어댑터 실기기 격리 QA | — |
| tech-debt-audit | 9차원 기술 부채 감사 → TECH_DEBT_AUDIT.md | — |

→ 슬래시 커맨드 5종(security-research, get-unpublished-changes, omomomo, publish, remove-deadcode)이 대응 스킬에 "## Slash-command usage" 절로 통합되어 muscle memory 보존.

### 에이전트 11종 (`invoke_subagent` 위임 대상)

| 에이전트 | model | 역할 |
| --- | --- | --- |
| **sisyphus** | inherit | 오케스트레이션 리드 — 기본 에이전트(mainAgent: true), 위임 기본 |
| hephaestus | inherit | 자율 딥 워커 (목표→탐색→구현→검증 E2E) |
| sisyphus-junior | inherit | 집중 실행자 (추가 스폰 없이 위임 태스크 완수) |
| **oracle** | inherit | 읽기 전용 고난도 상담 (아키텍처·버그) — 메인을 Argon으로 두면 Argon 구동 |
| **metis** | inherit | 사전 계획 컨설턴트 (숨은 의도·모호성 분석) — 메인을 Argon으로 두면 Argon 구동 |
| **momus** | inherit | 계획/작업 비평 게이트 리뷰어 — 메인을 Argon으로 두면 Argon 구동 |
| librarian | inherit | 외부 문서·원격 저장소·사용례 검색 전문 |
| explore | inherit | 코드베이스 문맥 검색 ("X가 어디?") — 병렬 다수 발사용 |
| atlas | inherit | todo 전체 완수 오케스트레이터 |
| multimodal-looker | inherit | 이미지/PDF 입력 해석 (이미지 첨부 지원) |
| prometheus | inherit | ulw 스킬 계획 페르소나 (ulw-plan 의존) |

tools는 Antigravity 공식 화이트리스트 13종으로만 구성 (잘못된 이름은 서브에이전트 hang을 유발하는 known issue — 전원 검증 통과). 판단형 3종(oracle·metis·momus)은 원래 `model: pro`였으나, 2026-10 조사에서 최상위 모델 Gemini 4 Argon이 frontmatter enum({inherit,flash,pro})에 없어 직접 지정이 불가하다는 것이 확인되어 `model: inherit`으로 변경했다 — 메인 모델을 Argon으로 선택하면 이 3종도 자동으로 Argon을 탄다 (근거는 아래 "에이전트 모델 직접 지정/변경하기").

### 에이전트 모델 직접 지정/변경하기

각 에이전트의 모델은 **파일 한 곳의 한 줄**로 지정되며, 언제든 직접 바꿀 수 있습니다.

**현재 배정 (2026-10-24 기준 — 전원 `inherit`):**

| 에이전트 | model | 비고 |
| --- | --- | --- |
| oracle / metis / momus | `inherit` | 판단형 3종 — 메인 모델(Argon 권장)을 그대로 따름 |
| sisyphus | `inherit` | 메인 에이전트 |
| hephaestus / sisyphus-junior | `inherit` | 실행형 |
| librarian / explore / atlas / multimodal-looker / prometheus | `inherit` | 검색·보조형 |

**최신 모델 현황 — Gemini 4 Argon (2026-10-24 웹 조사):**
- Argon은 pro도 flash도 아닌 **별도의 최상위 추론 모델**이다 (2026-10-13 Antigravity 출시, 모델 ID `gemini-4-argon`, reasoning High/Medium/Low 변형 존재).
- 공식 서브에이전트 문서 기준 frontmatter `model` enum은 **{inherit, flash, pro} 그대로** — `model: argon` 직접 지정은 아직 없다 (CLI `--model`의 `gemini-4-argon-*` 슬러그·`agy models`는 별개 메커니즘).
- 따라서 Argon을 에이전트에 태우는 유일한 방법: **메인 모델 선택기에서 Gemini 4 Argon 선택 + 에이전트 `inherit`** → 위 배정(전원 inherit)이 그 전제다. 모델이 바뀌어도 inherit이면 자동 추적되어 재편집이 필요 없다.
- 이용 조건: 유료 플랜 (개인은 Ultra 확정, 일부 보도는 10월 중순부터 Pro 롤아웃 시작), **독립 Antigravity IDE에서는 Argon 사용 불가** — Antigravity App / CLI / IDE 확장(VS Code 등)에서만 선택 가능.
- 참고: Gemini 3.1 Pro는 이제 Enterprise 전용으로 강등되어 `model: pro`가 실제 어떤 모델에 매핑되는지는 플랜별로 다르고 공개되지 않았다 — 확실한 것은 `inherit`(메인 모델 그대로)뿐이므로 이것이 기본값이다.
- 원복: 판단형 3종을 메인과 무관하게 pro 티어에 고정하고 싶으면 `model: pro`로 되돌리면 된다 (아래 방법 A/B). Antigravity가 enum에 `argon`을 추가하면 `model: argon` 지정 + `scripts\validate.mjs` 17행 허용 목록에 `'argon'` 추가로 확장 가능하다.

**바꾸는 방법 (2가지 경로):**

- **방법 A — 설치본 직접 수정 (즉시 반영):**
  `~\.gemini\config\agents\<name>.md` 파일을 열어 frontmatter의 `model:` 값을 수정 → Antigravity 재시작.
  예: oracle을 pro 티어로 고정하려면 `model: inherit` → `model: pro`.
  ⚠️ 단, `node scripts\install.mjs`를 다시 실행하면 저장소 버전으로 덮어써집니다.

- **방법 B — 저장소 수정 후 재설치 (권장, 영구적):**
  1. 저장소 `agents\<name>.md`의 `model:` 줄 수정
  2. `node scripts\install.mjs` 재실행 (자동 구조 검증 포함)
  → 설치본이 갱신되고, 이후 재설치에도 유지됩니다.

**값의 의미 (Antigravity 스키마):** `inherit` = 메인 에이전트 모델 따름 · `flash` = 빠른 모델 티어 · `pro` = 강력한 모델 티어(현재 매핑은 플랜별·비공개).

**모델 라인업이 바뀌어 enum이 달라질 경우:** 새 값(예: Antigravity가 추가한 모델명)을 `model:`에 쓰려면 `scripts\validate.mjs` **17행**의 허용 목록도 같이 수정해야 합니다:
```js
const MODELS = new Set(['inherit', 'flash', 'pro']);   // ← 여기에 새 값 추가
```
수정하지 않으면 validate가 exit 1로 막습니다(설치 종료 시 자동 검증도 실패).

**같은 파일에서 함께 편집 가능한 것:** `description`(위임 시 에이전트 선택 기준 문구), `tools`(도구 화이트리스트), 본문(시스템 프롬프트) — 전부 같은 `.md` 파일의 같은 방식(방법 A/B)으로 바꿉니다. tools에 새 MCP 도구명을 추가할 때는 Antigravity가 실제 등록한 도구명만 사용하세요(검증되지 않은 이름은 hang 유발).

### MCP 서버 5종
| 키 | 방식 | 용도 |
| --- | --- | --- |
| context7 | 원격 (mcp.context7.com) | 라이브러리 공식 문서 조회 |
| grep_app | 원격 (mcp.grep.app) | 실제 오픈소스 사용례 코드 검색 |
| websearch | 원격 (mcp.exa.ai) | 웹 검색 |
| lsp | stdio (node, OMO 패키지 진입점) | diagnostics·goto_definition·find_references·format·symbols·rename·prepare_rename |
| omo-git-bash | stdio (node, OMO 패키지 진입점) | git-bash MCP 도구 |

lsp·omo-git-bash는 OMO 실제 빌드 산출물(`packages\lsp-tools-mcp\dist\cli.js`, `packages\git-bash-mcp\dist\cli.js`)을 가리킵니다 — **OMO를 삭제하면 이 2개는 작동 중지**됩니다(원본 3종은 원격이라 무관).

### 훅 9종 (omo-* 네임스페이스, 전부 fail-open 설계)
| 훅 | 이벤트 | 동작 |
| --- | --- | --- |
| omo-write-guard | PreToolUse | 읽지 않은 파일 덮어쓰기 차단 (`{"decision":"deny"}`); 불확실하면 무조건 허용 |
| omo-context-injector | SessionStart + PreInvocation | 세션 시작 시 방향 메시지(스킬은 /name, 위임은 포팅 서브에이전트) + 첫 호출 시 스킬 카테고리 리마인더 |
| omo-session-notify | SessionStart + Stop | 윈도우 비프 1회 (외부 의존 0, 실패해도 간섭 없음) |
| omo-stop-continuation | Stop | 활성 계획(`.omo\plans\*.md`)에 미완료 `- [ ]` 체크박스가 있으면 `{"decision":"continue"}`로 재개; 무조건 재개 아님 |
| omo-keyword-detector | PreInvocation | transcript 스캔으로 bare `ulw`/`hyperplan`/`team mode` 감지 → 대응 프로토콜 시스템 메시지 주입 (대화당 키워드 1회 디듀프, 주입 텍스트는 트리거 키워드를 포함하지 않아 재발동 루프 없음) |
| omo-task-reminder | PreInvocation | 턴 시작 시 최신 계획의 미완료 체크박스·열린 노트팹 문제를 리마인더로 주입 (0개면 조용) |
| omo-ast-grep-provision | PreInvocation | 턴 시작 시 `sg` 바이너리 가용성 확인 → ast-grep 스킬 사용 가능/불가 안내 1줄 주입 |
| omo-readme-injector | SessionStart | 워크스페이스 README.md 헤드(4천자) 주입 — 세션 시작 시 프로젝트 오리엔테이션 |
| omo-agents-md-injector | SessionStart | 워크스페이스 AGENTS.md 헤드 주입 (OMO의 hephaestus 전용 주입을 전 에이전트용으로 일반화) |

### 도구 스크립트 4종 + 원클릭 래퍼
| 스크립트 | 용도 |
| --- | --- |
| `scripts\install.mjs` | 백업-병합 설치기 (`--home`/`--cli`/`--dry-run`/`--no-validate`) |
| `scripts\validate.mjs` | 저장소 구조 검증 (위반 exit 1) |
| `scripts\uninstall.mjs` | 우리 산출물만 제거 (`--home`/`--dry-run`, JSON 키는 값 일치 시에만 제거, 수정 전 백업) |
| 원클릭 래퍼 | 루트의 install.cmd·uninstall.cmd·doctor.cmd·alidate.cmd — 더블클릭으로 실행 (터미널에서는 pause 없이 종료) |
| scripts\doctor.mjs | 설치 상태 자동 진단 — 32스킬/11에이전트/룰/핸들러 9종 파싱/MCP·훅 키/stdio 경로 실재/write-guard 라이브 스모크; FAIL 시 exit 1 + 재설치 안내 (`--repo`로 저장소 검증 병행) |

### 룰 1종
`rules\omo-port.md` (trigger: model_decision) — 모델이 git/review/debugging/planning/research 작업 시 설치된 스킬을 선호하도록 유도.

---

## 3. 변환 규칙 (MAPPING.md 요약)

opencode 도구 → Antigravity 도구 매핑의 단일 진실원. 스킬·에이전트 본문의 모든 opencode 전용 참조가 이 규칙으로 재작성되었고, validate.mjs가 금지 토큰 14종을 스캔합니다.

- read/edit/write/bash/glob/grep → view_file/replace_file_content/write_to_file/run_command/find_by_name/grep_search
- task(subagent_type/category) → invoke_subagent · background_output → manage_task · skill(name=X) → "follow the X skill" 텍스트
- Lsp* → MCP lsp 서버 실제 도구(diagnostics/goto_definition/find_references/format...) 또는 grep_search
- team_create/send/delete → "N개 역할 invoke_subagent 병렬 호출 후 종합" 절차
- todowrite → 워크스페이스 마크다운 체크박스 절차 · interactive_bash → run_command (PTY 없음 제한 명시)

금지 토큰 스캔 결과: 552개 스킬 파일 + 11개 에이전트 파일에서 **0건**.

## 4. 미이식 목록 (NOT-PORTED.md)

향후 골라 구현할 백로그 — 요약 금지 원칙으로 전수 나열:
- **훅 56개 디렉토리**: PORTED 10(→ 핸들러 9종; 2026-10-24 keyword-detector·task-reminder·ast-grep-sg-provision·directory-readme-injector·hephaestus-agents-md-injector 추가 이식), FUTURE-PORTABLE 24(후보 Antigravity 이벤트 명시 — PostToolUse 계열은 stdout 의미 미정의로 계약상 보류), RUNTIME-BOUND 22(opencode 세션/compaction/TUI 의존 — 사유 명시)
- **비훅 10개 섹션**: TUI, config 스키마 시스템, 모델 변형 시스템, bin 5종+CLI 인스톨러, postinstall, team-mode 메일박스, 세션/compaction/monitor 시스템, 40개 workspace packages

## 5. 검증 결과 (모두 실제 실행)

| 게이트 | 결과 | 핵심 |
| --- | --- | --- |
| validate.mjs | exit 0 | 6 스위트 PASS (skills/agents/mcp/hooks/rules/not-ported), 경고 0 |
| 실설치 멱등 | 통과 | 임시 홈에 32스킬·11에이전트·4핸들러 설치, 2회 실행 트리 diff 0 |
| 핸들러 fixture 7종 | 전부 green | deny/allow/injectSteps/continue/empty×2/notify — malformed 입력에도 크래시 없이 fail-open |
| 위반 주입 4종 | 전부 포착 | description 제거·잘못된 tools("Bash")·이벤트 오타·금지토큰 각각 exit 1 |
| 최종 F1~F4 | 4/4 APPROVE | evidence 1:1 대조·코드 품질(fail-open·무의존)·실구동 QA·IS-1..7 충족 |

> **주석 (2026-10-27, 계약 토론 재판정 반영 — 원본 기록은 보존):** 위 표의 수치는 2026-10-24 승인 시점 기준이다. "4핸들러"는 현재 출하 9종의 이전 단계 수치이고, "fixture 7종"은 현재 문서화 17행(hooks/fixtures/README.md)의 이전 수치다. "실구동 QA"는 실제 Antigravity 구동이 아니라 **핸들러 fixture 재생**을 의미했으며, 실기기 QA는 수행되지 않았다(§6.1 Q4 — README.md의 공개 문구와 일치). 현재 상태: 구조 검증(validate.mjs)에 더해 핸들러 fixture 상시 게이트(scripts/test-handlers.mjs)가 추가되었고, 호스트 경계 계약의 미검증 항목은 HOST-CONTRACT.md 원장이 UNKNOWN/ASSUMED로 추적하며 Wave 2 라이브 프로브로만 OBSERVED로 전환된다.

## 6. 제약사항 / 유의사항

1. **실기기 미검증 (Q4)**: 구조 검증만 수행. Antigravity 실구동 QA 없음 — **첫 실사용 시 직접 확인** 권장 (`/git-master` 등 슬래시 1회 호출, 위임 1회, 훅 동작 확인).
2. **독립 포트**: OMO 업데이트 자동 반영 안 됨. 재이식 시 MAPPING.md 규칙 수동 적용.
3. **lsp·omo-git-bash MCP는 OMO 패키지 경로 의존**: OMO를 지우면 해당 2개만 비활성.
4. **OMO 원본은 전 과정 읽기 전용** (IS-7): 쓰기 0건 확인됨.
5. 워크플로 계열(ulw-*)의 `.omo\plans` 파일시스템 규약은 플랫폼 무관 규약이라 그대로 유지 — Antigravity 워크스페이스에서도 동일하게 작동.
