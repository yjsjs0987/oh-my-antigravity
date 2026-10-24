# NOT-PORTED.md — OMO 미이식 전수 백로그

이 문서는 OMO(OpenCode 확장 팩, v5.1.40)의 **전체 훅 82종(디렉터리 56개 + loose 파일 session-notification-*.d.ts)**과 비훅 기능 중, 이번 Antigravity 포팅에서 **이식하지 않은 항목**을 전수 나열한 백로그입니다. 사용자가 나중에 골라 구현할 수 있도록 항목별로 이름, 목적, 미이식 사유, 향후 이식 가능성/후보 Antigravity 이벤트를 기록합니다.

요약 금지. 전수 나열. 분류 없는 행, "기타" 그룹 없음.

---

## Section 1. Hooks not ported (exhaustive)

출처: `<OMO>\dist\hooks` 디렉터리 전체(`Get-ChildItem -Directory`). 파일 시스템이 진실원이며, 인벤토리 목록을 신뢰하지 않음.

표 형식: `이름 | 한 줄 목적 | 상태 | 사유 | 향후 이식 가능성/후보 Antigravity 이벤트`

상태 값: `PORTED` / `FUTURE-PORTABLE` / `RUNTIME-BOUND`

Antigravity 이벤트 6종: `SessionStart, PreToolUse, PostToolUse, PreInvocation, PostInvocation, Stop`

| 이름 | 한 줄 목적 | 상태 | 사유 | 향후 이식 가능성/후보 Antigravity 이벤트 |
| --- | --- | --- | --- | --- |
| agent-usage-reminder | 도구 실행 후 에이전트 사용 알림 | FUTURE-PORTABLE | opencode 전용 `tool.execute.after` 이벤트에 의존, Antigravity PostToolUse로 재매핑 가능 | PostToolUse |
| anthropic-context-window-limit-recovery | Anthropic 컨텍스트 윈도우 한계 복구/요약 | RUNTIME-BOUND | opencode 세션/컴팩션/토큰 제한 상태 저장소에 강결합 | — (opencode compaction API 전용) |
| ast-grep-sg-provision | ast-grep-sg 도구 프로비저닝 | FUTURE-PORTABLE | 도구 설치/준비는 세션 시작 시 한 번 수행 | PreInvocation |
| atlas | 아틀라스 오케스트레이터 세션/계획 추적 | RUNTIME-BOUND | boulder/ralph 연속 시스템과 opencode 세션 상태에 강결합 | — (opencode 세션/continuation API 전용) |
| auto-slash-command | 슬래시 명령어 감지 및 실행 | FUTURE-PORTABLE | 도구 호출 전 명령어 인터셉트 | PreInvocation |
| auto-update-checker | 자동 업데이트 확인 | FUTURE-PORTABLE | 세션 시작 시 버전 채널 확인 | SessionStart |
| background-notification | 백그라운드 에이전트 알림 | RUNTIME-BOUND | `features/background-agent` BackgroundManager와 opencode 채팅 메시지 API에 강결합 | — (opencode background-agent API 전용) |
| category-skill-reminder | 카테고리별 스킬 사용 알림 | FUTURE-PORTABLE | 도구 실행 후 스킬 카테고리 리마인더 | PostToolUse |
| claude-code-hooks | Claude Code 호환 훅 디스패치 | RUNTIME-BOUND | opencode 플러그인/세션/트랜스크립트 API 전체에 강결합 | — (opencode 플러그인 API 전용) |
| comment-checker | 코드 주석 검사 | FUTURE-PORTABLE | 도구 실행 후 주석 존재 여부 확인 | PostToolUse |
| compaction-context-injector | 컴팩션 시 컨텍스트 프롬프트 주입 | RUNTIME-BOUND | opencode 컴팩션/세션 꼬리( tail ) 모니터에 강결합 | — (opencode compaction API 전용) |
| compaction-todo-preserver | 컴팩션 시 할 일 보존 | RUNTIME-BOUND | opencode 컴팩션/세션 상태에 강결합 | — (opencode compaction API 전용) |
| delegate-task-retry | 위임 작업 재시도 안내 | FUTURE-PORTABLE | 서브에이전트 완료 후 재시도 권고 | PostInvocation |
| directory-agents-injector | 디렉터리 에이전트 주입 | PORTED | 이미 이식됨 → `omo-context-injector` (SessionStart + PreInvocation) | 이미 이식됨 |
| directory-readme-injector | 디렉터리 README 주입 | FUTURE-PORTABLE | 세션 시작 시 작업 디렉터리 README 주입 | SessionStart |
| edit-error-recovery | 편집 오류 복구 | FUTURE-PORTABLE | 도구 실행 후 오류 복구 안내 | PostToolUse |
| fsync-skip-warning | fsync 건너뛰기 경고 | FUTURE-PORTABLE | 도구 실행 후 fsync 미수행 경고 | PostToolUse |
| goal | 목표/할 일 시스템 | RUNTIME-BOUND | opencode goal 스토어/컨트롤러와 세션 상태에 강결합 | — (opencode goal API 전용) |
| hashline-read-enhancer | 해시라인 읽기 강화 | FUTURE-PORTABLE | 도구 실행 후 해시라인 강조 | PostToolUse |
| hephaestus-agents-md-injector | hephaestus agents.md 주입 | FUTURE-PORTABLE | 세션 시작 시 에이전트 마크다운 주입 | SessionStart |
| interactive-bash-session | 대화형 bash 세션(tmux) | RUNTIME-BOUND | tmux/대화형 셸과 opencode TUI 런타임에 강결합 | — (opencode TUI/tmux API 전용) |
| json-error-recovery | JSON 오류 복구 | FUTURE-PORTABLE | 도구 실행 후 JSON 파싱 오류 복구 | PostToolUse |
| keyword-detector | 키워드 감지(hyperplan/team/ultrawork) | FUTURE-PORTABLE | 도구 실행 후 키워드 기반 알림 | PostToolUse |
| legacy-plugin-toast | 레거시 플러그인 마이그레이션 토스트 | RUNTIME-BOUND | opencode 플러그인 진입점 마이그레이션과 토스트 UI에 강결합 | — (opencode 플러그인/토스트 API 전용) |
| model-fallback | 모델 폴백/재시도 | RUNTIME-BOUND | opencode 런타임 모델 설정/폴백 상태에 강결합 | — (opencode 모델 런타임 API 전용) |
| monitor-status-injector | 모니터 상태 주입 | RUNTIME-BOUND | opencode 모니터 시스템과 세션 상태에 강결합 | — (opencode monitor API 전용) |
| native-edition-nudge | 네이티브 에디션 유도 토스트 | RUNTIME-BOUND | 네이티브 호스트 앱 감지/토스트와 opencode 버전 상태에 강결합 | — (opencode 네이티브/토스트 API 전용) |
| no-hephaestus-non-GPT | hephaestus 비-GPT 모델 차단 | FUTURE-PORTABLE | 도구 호출 전 모델 게이트 | PreInvocation |
| no-sisyphus-gpt | sisyphus GPT 모델 차단 | FUTURE-PORTABLE | 도구 호출 전 모델 게이트 | PreInvocation |
| non-interactive-env | 비대화형 환경 감지 | FUTURE-PORTABLE | 세션 시작 시 환경 모드 판정 | SessionStart |
| notepad-write-guard | 노트파일 쓰기 가드 | FUTURE-PORTABLE | 노트파일 덮어쓰기 전 읽기 확인(PreToolUse 유사) | PreToolUse |
| plan-format-validator | 계획 파일 형식 검증 | FUTURE-PORTABLE | 도구 실행 후 계획 형식 검사 | PostToolUse |
| prometheus-md-only | 프로메테우스 마크다운 전용 | RUNTIME-BOUND | ulw/프로메테우스 계획 페르소나와 opencode 세션에 강결합 | — (opencode ulw/계획 시스템 전용) |
| question-label-truncator | 질문 라벨 잘림 | FUTURE-PORTABLE | 도구 실행 전 질문 라벨 단축 | PreToolUse |
| ralph-loop | ralph 루프 연속/검증 | RUNTIME-BOUND | boulder/ralph 연속 시스템과 opencode 세션 이벤트에 강결합 | — (opencode 세션/continuation API 전용) |
| read-image-resizer | 이미지 크기 조정 | FUTURE-PORTABLE | 도구 실행 후 이미지 리사이즈 | PostToolUse |
| rules-injector | 규칙 주입 | PORTED | 이미 이식됨 → `omo-context-injector` (SessionStart + PreInvocation) | 이미 이식됨 |
| runtime-fallback | 런타임 폴백 | RUNTIME-BOUND | opencode 런타임 모델 설정/폴백 상태에 강결합 | — (opencode 모델 런타임 API 전용) |
| shared | 공유 유틸리티(컴팩션 모델 리졸버 등) | RUNTIME-BOUND | opencode 엔진 공유 모듈과 세션 유휴 정리에 강결합 | — (opencode 엔진 내부 API 전용) |
| sisyphus-junior-notepad | sisyphus-junior 노트패드 연동 | FUTURE-PORTABLE | 도구 실행 후 노트패드 상태 갱신 | PostToolUse |
| stop-continuation-guard | 스톱 연속 가드 | PORTED | 이미 이식됨 → `omo-stop-continuation` (Stop) | 이미 이식됨 |
| task-reminder | 작업 리마인더 | FUTURE-PORTABLE | 도구 호출 전 작업 알림 | PreInvocation |
| task-resume-info | 작업 재개 정보 | FUTURE-PORTABLE | 서브에이전트 완료 후 재개 정보 | PostInvocation |
| tasks-todowrite-disabler | todowrite 비활성화 | FUTURE-PORTABLE | 도구 호출 전 todowrite 사용 제어 | PreInvocation |
| team-mailbox-injector | 팀 메일박스 주입 | RUNTIME-BOUND | opencode 팀 모드 메일박스와 세션 상태에 강결합 | — (opencode 팀 모드 API 전용) |
| team-mode-status-injector | 팀 모드 상태 주입 | RUNTIME-BOUND | opencode 팀 모드 상태와 세션에 강결합 | — (opencode 팀 모드 API 전용) |
| team-session-events | 팀 세션 이벤트 | RUNTIME-BOUND | opencode 팀 세션/멤버 상태 핸들러에 강결합 | — (opencode 팀 모드 API 전용) |
| team-tool-gating | 팀 도구 게이팅 | RUNTIME-BOUND | opencode 팀 모드 도구 제어에 강결합 | — (opencode 팀 모드 API 전용) |
| think-mode | 생각 모드 전환 | FUTURE-PORTABLE | 도구 호출 전 think 모드 판정 | PreInvocation |
| todo-continuation-enforcer | 할 일 연속 강제 | PORTED | 이미 이식됨 → `omo-stop-continuation` (Stop) | 이미 이식됨 |
| todo-description-override | 할 일 설명 덮어쓰기 | FUTURE-PORTABLE | 도구 실행 후 할 일 설명 갱신 | PostToolUse |
| tool-pair-validator | 도구 쌍 검증 | FUTURE-PORTABLE | 도구 실행 전 쌍 검증 | PreToolUse |
| ulw-execute | ulw 실행(워크트리/계획) | RUNTIME-BOUND | opencode ulw 계획/워크트리/노트패드 스캐폴드에 강결합 | — (opencode ulw/워크트리 API 전용) |
| unstable-agent-babysitter | 불안정 에이전트 돌보미 | RUNTIME-BOUND | opencode background-agent 작업 추적과 세션 메시지에 강결합 | — (opencode background-agent API 전용) |
| webfetch-redirect-guard | webfetch 리디렉션 가드 | FUTURE-PORTABLE | 도구 실행 후 리디렉션 해결 | PostToolUse |
| write-existing-file-guard | 기존 파일 쓰기 가드 | PORTED | 이미 이식됨 → `omo-write-guard` (PreToolUse) | 이미 이식됨 |

**합계: 56개 훅 디렉터리 (PORTED 5 / FUTURE-PORTABLE 29 / RUNTIME-BOUND 22)**

### Footnote: session-notification (loose files, ported)

`<OMO>\dist\hooks`에는 디렉터리가 아닌 **loose `.d.ts` 파일**로 `session-notification-*`이 존재합니다(`session-notification.d.ts`, `session-notification-content.d.ts`, `session-notification-event-properties.d.ts`, `session-notification-formatting.d.ts`, `session-notification-init.d.ts`, `session-notification-linux.d.ts`, `session-notification-log.d.ts`, `session-notification-macos.d.ts`, `session-notification-platform.d.ts`, `session-notification-runner.d.ts`, `session-notification-scheduler.d.ts`, `session-notification-send.d.ts`, `session-notification-sender.d.ts`, `session-notification-sound.d.ts`, `session-notification-utils.d.ts`, `session-notification-windows.d.ts`). 이는 디렉터리 기준 표에 포함되지 않으며, 이미 이식 완료: **`omo-session-notify`** (SessionStart 시작 알림 + Stop 종료 알림, Windows 사운드/알림 1회).

---

## Section 2. Non-hook features not ported

이 섹션은 훅이 아닌 OMO 기능 중 이번 포팅에서 이식하지 않은 항목의 원장(ledger)입니다. 각 항목: 무엇인지, 왜 이식하지 않았는지, 향후 이식 가능성.

### TUI (dist\tui.js, tui-sidebar, btw-side)

**무엇:** OMO의 텍스트 기반 사용자 인터페이스. `dist\tui.js`가 존재하고, `dist\tui-sidebar`와 `dist\btw-side`는 `dist\features` 하위에 존재(사이드바/대화형 컴포넌트).

**왜 이식하지 않았는가:** Antigravity는 자체 TUI/사이드바를持ち, opencode 전용 tmux/터미널 렌더링에 강결합. Antigravity 본체 수정 금지(plan guardrail) 하에 물리적 재구현 불가.

**향후 이식 가능성:** 낮음. Antigravity 네이티브 UI와 별개로 opencode TUI를 이식하려면 Antigravity 프런트엔드 수정이 필요하므로 본 포팅 범위 밖.

### Config schema system (dist\oh-my-opencode.schema.json + dist\plugin-handlers\)

**무엇:** OMO 설정 스키마(`oh-my-opencode.schema.json`)와 플러그인 핸들러 시스템(`dist\plugin-handlers\`).

**왜 이식하지 않았는가:** Antigravity는 자체 설정 스키마(`mcp_config.json`, `hooks.json`, `skills/`, `agents/`, `rules/`)를 사용. OMO 스키마는 opencode 플러그인 인프라에 강결합.

**향후 이식 가능성:** 낮음. Antigravity 설정 포맷으로 재정의 필요; OMO 스키마 자체는 이식 대상이 아님.

### Model variant system

**무엇:** OMO의 모델 변형/폴백 시스템(`dist\model-fallback\` 훅, `dist\cli\` 내 모델 리졸버, `packages/model-core`).

**왜 이식하지 않았는가:** Antigravity는 `model: inherit|flash|pro` enum과 서브에이전트별 모델 지정을 자체 지원. OMO의 opencode 런타임 모델 설정/폴백 상태에 강결합.

**향후 이식 가능성:** 중간. Antigravity 서브에이전트 `model` 필드로 대체 가능; 세부 폴백 로직은 향후 추가 검토.

### Bin entrypoints + CLI installer (dist\cli\ — 5 bins)

**무엇:** OMO CLI 진입점 5개(`oh-my-opencode`, `oh-my-openagent`, `omo-agent-toolkit`, `lazycodex`, `lazycodex-ai`, 모두 `bin/oh-my-opencode.js`) 및 `dist\cli\` 하위 CLI 설치/실행 모듈(`cli-installer`, `cli-program`, `install`, `tui-installer`, `doctor`, `run`, `config-manager` 등 12개 디렉터리 + 다수 모듈).

**왜 이식하지 않았는가:** 본 포팅은 Antigravity 전역 설정 파일 설치(skills/agents/rules/hooks/mcp)를 목표로 하며, 별도 CLI 바이너리 배포는 계획 범위 밖(plan: GitHub 공개/마켓플레이스 등록 금지).

**향후 이식 가능성:** 중간. `scripts/install.mjs`가 설치 역할을 대체; CLI 바이너리는 향후 독립 배포 시 검토.

### Postinstall bootstrap

**무엇:** OMO 설치 후 부트스트랩(`dist\cli\install\`, `install-ast-grep-sg`, `install-validators`, `tui-install-prompts` 등).

**왜 이식하지 않았는가:** Antigravity는 `scripts/install.mjs` 한 번 실행으로 전체 설치를 처리. opencode 전용 postinstall 훅과 네이티브 설치 플래그에 강결합.

**향후 이식 가능성:** 낮음. `install.mjs`가 이미 부트스트랩 역할을 대체.

### Team-mode mailbox (dist\features\)

**무엇:** `dist\features\` 하위의 팀 모드 기능들(`background-agent`, `boulder-state`, `btw-side`, `team-mode`, `tmux-subagent`, `task-toast-manager`, `skill-mcp-manager`, `mcp-oauth`, `monitor`, `native-edition-nudge`, `context-injector`, `hook-message-injector`, `opencode-runtime-skills`, `opencode-skill-loader`, `opengateway-provider`, `run-continuation-state`, `tool-metadata-store`, `claude-code-*` 등).

**왜 이식하지 않았는가:** opencode 팀 모드(메일박스, 배경 에이전트, tmux 서브에이전트, 연속 상태)에 강결합. Antigravity는 팀 모드 개념이 없으며, 팀 협업은 `invoke_subagent` 다중 호출로 대체(plan MAPPING.md).

**향후 이식 가능성:** 낮음. Antigravity 팀/메일박스 개념 부재; `invoke_subagent` 기반 협업으로 대체 가능.

### Session system

**무엇:** OMO 세션 시스템(`claude-code-session-state`, `session-resolver`, `session-event-handler`, `session-state`, `session-idle-settle` 등).

**왜 이식하지 않았는가:** opencode 세션 ID/트랜스크립트/세션 상태 저장소에 강결합. Antigravity는 `conversationId`, `transcriptPath` 등 훅 stdin 필드로 세션 정보를 전달하나, OMO 세션 스토어 자체는 이식 대상이 아님.

**향후 이식 가능성:** 중간. 훅 핸들러 내에서 Antigravity stdin 세션 필드로 부분 대체 가능.

### Compaction system

**무엇:** OMO 컴팩션 시스템(`compaction-context-injector`, `compaction-todo-preserver` 훅, `packages/boulder-state`, `packages/comment-checker-core` 등).

**왜 이식하지 않았는가:** opencode 컴팩션/토큰 제한/세션 꼬리 모니터에 강결합. Antigravity는 컴팩션 이벤트가 없음(6종 이벤트에 컴팩션 없음).

**향후 이식 가능성:** 낮음. Antigravity 컴팩션 이벤트 부재; PostToolUse/Stop에서 부분 모방만 가능.

### Monitor system

**무엇:** OMO 모니터 시스템(`monitor-status-injector` 훅, `dist\features\monitor`).

**왜 이식하지 않았는가:** opencode 모니터 상태/세션에 강결합. Antigravity는 모니터 개념이 없음.

**향후 이식 가능성:** 낮음. Antigravity 모니터 개념 부재.

### Workspace packages (40 internal engine dependencies — list count from <OMO>\package.json workspaces)

**무엇:** OMO 내부 엔진 의존성 워크스페이스 패키지들. `<OMO>\package.json`의 `workspaces` 필드에 **34개** 패키지 등록(`packages/rules-engine`, `packages/delegate-core`, `packages/ast-grep-mcp`, `packages/git-bash-mcp`, `packages/mcp-stdio-core`, `packages/mcp-client-core`, `packages/lsp-core`, `packages/utils`, `packages/model-core`, `packages/omo-config-core`, `packages/prompts-core`, `packages/comment-checker-core`, `packages/hashline-core`, `packages/tmux-core`, `packages/team-core`, `packages/openclaw-core`, `packages/boulder-state`, `packages/memory-core`, `packages/isolation-core`, `packages/telemetry-core`, `packages/claude-code-compat-core`, `packages/skills-loader-core`, `packages/agents-md-core`, `packages/shared-skills`, `packages/omo-codex`, `packages/omo-senpi`, `packages/senpi-task`, `packages/senpi-desktop-protocol`, `packages/senpi-desktop-engine`, `packages/senpi-desktop-prelude`, `packages/senpi-desktop-service`, `packages/senpi-desktop-tool`, `packages/omo-opencode`, `packages/omo-native`).

**왜 이식하지 않았는가:** opencode 엔진 내부 패키지들로, Antigravity 전역 설정 파일 포팅 범위를 벗어남. Antigravity는 자체 엔진을 사용.

**향후 이식 가능성:** 낮음. Antigravity 엔진과 1:1 대응되지 않음; 개별 기능만 필요 시 재검토.

---

## Verification evidence

- Hook directory count (source of truth): **56** (`Get-ChildItem <OMO>\dist\hooks -Directory`)
- Table rows in Section 1: **56** (one per directory, 5 columns each)
- PORTED rows: **5** (≥ 4 required)
- Non-hook subsection headers in Section 2: **10** (TUI, Config schema system, Model variant system, Bin entrypoints + CLI installer, Postinstall bootstrap, Team-mode mailbox, Session system, Compaction system, Monitor system, Workspace packages)
