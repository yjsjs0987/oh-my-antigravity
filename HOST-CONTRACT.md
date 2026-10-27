# HOST-CONTRACT.md — Antigravity 호스트 경계 계약 원장

MAPPING.md가 변환(transform)의 단일 진실원이듯, 이 문서는 **Antigravity 호스트 경계**(설정 읽기 → 핸들러 스폰 → stdin 공급 → stdout 파싱 → 결정 집행)의 단일 진실원이다. 이 경계는 저장소 안의 어떤 도구로도 검증할 수 없으므로, 계약 지점마다 근거 수준을 명시한다.

**provenance 값:**
- `DOC-VERIFIED` — 포팅 시점에 Antigravity 문서에서 확인된 필드/시맨틱 (출처 병기)
- `ASSUMED` — 핸들러 코드가 가정하는 값. 틀려도 fail-open 설계상 **무음 no-op**이 된다 (신호 없음)
- `UNKNOWN` — 근거가 전혀 없는 항목. 라이브 프로브 전까지 어떤 코드도 이 값을 근거로 수정하지 않는다
- `OBSERVED` — Wave 2 라이브 프로브가 실제 페이로드로 관측해 확정한 값 (redacted 샘플과 함께 §3에 기록)

`ASSUMED`/`UNKNOWN` 항목이 하나라도 남아 있으면 Q4(실기기 검증 격차)가 열려 있는 것이다. 공개 문구(README Q4, REPORT §6)는 §3에 dated 라이브 실행 기록이 생기기 전까지 유지된다.

---

## 1. 계약 원장 (provenance ledger)

| # | 계약 지점 | 가정된 값 | 사용처 | provenance | 반증 프로브 |
|---|---|---|---|---|---|
| 1 | 훅 stdin: `conversationId`, `transcriptPath` 필드 | 세션 식별자 + transcript JSONL 경로 | write-guard, keyword-detector, stop-continuation 등 | **DOC-VERIFIED** (NOT-PORTED.md §Session system: "Antigravity는 conversationId, transcriptPath 등 훅 stdin 필드로 세션 정보를 전달") | ① |
| 2 | 훅 stdin: `toolCall.args` 하위 경로 키 | `path` / `PathToCurrentFile` / `file_path` / `fileName` (산탄총 4키) | write-guard.mjs PATH_KEYS | ASSUMED | ② |
| 3 | 훅 stdin: `invocationNum` (0 = 턴 시작) | 정수 카운터 | task-reminder, ast-grep-provision | ASSUMED | ① |
| 4 | 훅 stdin: `workspacePaths[0]` | 워크스페이스 루트 (상대경로 resolve 기준) | write-guard, 인젝터 전반 | ASSUMED | ② |
| 5 | 훅 stdin: `artifactDirectoryPath` | 대화별 아티팩트 디렉터 | keyword-detector 상태 저장 | ASSUMED | ① |
| 6 | PreToolUse stdout `{"decision":"deny","reason":...}` | 해당 도구 호출 차단 | write-guard | ASSUMED | ② |
| 7 | Stop stdout `{"decision":"continue"}` | 세션 재개 | stop-continuation | ASSUMED | ③ |
| 8 | SessionStart/PreInvocation stdout `{"injectSteps":[{"systemMessage":...}]}` | 시스템 메시지 주입 | 인젝터 6종 | ASSUMED | ①④ |
| 9 | `hooks.json` 등록 스키마 | `{"omo-*": {Event: [{matcher?, hooks:[{type,command,timeout}]}]}}` (Claude-Code 유사 중첩) | hooks/hooks.fragment.json | ASSUMED | ① |
| 10 | 훅 커맨드 실행 CWD | `~\.gemini\config` (상대경로 `node omo-handlers/...` 성립 전제) | 전 핸들러 등록 | **UNKNOWN** | ① |
| 11 | `timeout: 10` 단위 | 초로 가정 (ms면 전 훅 즉사) | hooks.fragment.json 전체 | **UNKNOWN** | ① |
| 12 | 서브에이전트 도구 화이트리스트 13종 | 런타임 실제 등록 도구명과 일치 (오명 시 서브에이전트 hang known-issue) | agents/*.md frontmatter | ASSUMED (2026-10 문서 조사 기반) | ⑤ |
| 13 | `mcpServers`의 모든 키 = 서버 등록 | `omo-<key>` 충돌 사본도 개별 서버로 등록됨 (중복 등록 가능성) | install.mjs 병합 | ASSUMED | ⑥ |
| 14 | transcript JSONL 내 경로 이스케이프 | JSON 문자열이므로 백슬래시는 `\\`로 이스케이프됨 | write-guard 매처 | **CONTRACT-INDEPENDENT** (RFC 8259 — Antigravity 스키마와 무관한 JSON 사양; write-guard 매처는 모든 표기 변형을 수용하도록 구현됨, hooks/fixtures/README.md 참고) | — |
| 15 | PostToolUse stdout 시맨틱 | **정의되지 않음** (Antigravity 훅 계약상 미정) | 24개 FUTURE-PORTABLE 훅 보류 사유 | DOC-VERIFIED (NOT-PORTED.md §1 각주, 2026-10-24 확정) | — (구현 보류 중) |

---

## 2. 라이브 검증 프로토콜 (Wave 2 — 수동, sandbox 우선)

> **실행 규칙 (하드 제약):**
> - **Sandbox 우선**: `node scripts\install.mjs --home <임시홈>`로 설치하고 임시 홈에서 실행. 데일리 드라이버에서 실행할 경우 QA 직후 uninstall을 기록.
> - **probe.fragment.json은 절대 출하용 hooks.fragment.json에 병합 금지** (별도 파일, sandbox에만 설치).
> - OMO 원본(`~\.cache\opencode\...`)은 읽기 전용 유지 (IS-7).
> - 모든 단계는 pass/fail/N-A(사유 명시) 행으로 기록 — **무음 생략 금지**.
> - 결과는 §3 로그에 날짜 + Antigravity 버전과 함께 기입하고, 원장의 provenance 셀을 OBSERVED로 전환.

**프로브 준비**: `hooks/probe.mjs`(stdin 원문을 `agy-probe-<event>.json`으로 덤프 후 exit 0, ~15줄) + `hooks/probe.fragment.json`(6개 이벤트 전부 등록)을 sandbox home에 설치. 하나의 세션에서 SessionStart·PreInvocation·PreToolUse·Stop을 모두 발화시켜 **실제 페이로드 원문을 수집**한다.

| # | 단계 | 검증 계약 (원장 행) | 통과 기준 |
|---|---|---|---|
| ① | 설치 + 완전 재시작 + 프로브 페이로드 수집 | #9 스키마, #10 CWD, #11 timeout 단위, #3 #5 stdin 필드 | Antigravity 기동 오류 0 + 6 이벤트 원문 캡처 성공 |
| ② | write-guard live deny: 읽지 않은 기존 파일 덮어쓰기 시도 → 차단 확인 후, 읽고 재시도 → 허용 | #2 args 키, #4 workspacePaths, #6 deny 시맨틱, #1 transcriptPath 실체 | 차단 메시지 노출 + 재시도 허용 (양방향) |
| ③ | stop-continuation: 미완료 `- [ ]` 플랜을 남기고 Stop **2회 이상** 연속 관측 | #7 decision:continue 수용 여부 + 무한 루프 여부 | 행동 관측 기록. 무한 수용이 확인되면 바인딩(최대 continue 횟수) 후속 작업 착수 |
| ④ | 채팅에 bare `ulw` 입력 → 워크플로 부스트 노출 확인 | #8 injectSteps 주입 시맨틱 | 부스트 메시지가 실제로 모델 컨텍스트에 나타남 |
| ⑤ | 서브에이전트 1회 위임 (예: sisyphus) | #12 도구 화이트리스트 13종 | hang 없이 완료 (11종 에이전트가 동일 13종을 공유하므로 1회로 전체 대표 검증) |
| ⑥ | `/git-master` 로드 + lsp MCP 도구 1회 + context7 1회 호출 | 스킬 계층 + stdio MCP 경로 유효성 | 전부 정상 응답 |
| ⑦ | 기록 | — | §3에 `live-run verified:` 행 추가, 원장 provenance 전환, README/REPORT 공개 문구 갱신 (업그레이드만, 삭제 금지), 발견된 계약 사실을 MAPPING.md에 반영 |

---

## 3. 라이브 QA 실행 로그

(아직 실행 없음 — Wave 2 대기. 완료 시 아래 형식으로 추가한다. doctor.mjs는 이 섹션의 `live-run verified:` 마커를 검사한다.)

```
- live-run verified: <YYYY-MM-DD> <Antigravity 버전/빌드>
  - ①: <pass/fail/N-A + 요약>
  - ②: ...
  (각 단계별 행 — 무음 생략 없이 전부)
  - 원장 전환: #<n> OBSERVED (redacted 샘플: <파일 경로 또는 인라인>)
```
