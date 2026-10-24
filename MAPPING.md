# MAPPING.md — opencode → Antigravity 변환 규칙

이 문서는 OMO(OpenCode 확장 팩)의 스킬·에이전트·훅을 Antigravity 전역 설정 포맷으로 이식할 때 따르는 단일 변환 규칙 참조입니다. todos 4-12(스킬/에이전트 이식)와 todo 15(validate.mjs FORBIDDEN 스캔)의 진실원입니다.

## Tool mapping

| opencode 도구 | Antigravity 대응 | 비고 |
|---|---|---|
| `read` | `view_file` | 파일 내용 읽기 |
| `edit` | `replace_file_content` | 1회 문자열 치환 |
| `write` | `write_to_file` | 파일 생성/덮어쓰기 |
| `bash` | `run_command` | 셸 명령 실행 |
| `glob` | `find_by_name` | 파일명 패턴 탐색 |
| `grep` | `grep_search` | 파일 내용 정규식 탐색 |
| `webfetch` | `read_url_content` | URL 내용 가져오기 |
| `websearch` | `search_web` | 웹 검색(또는 MCP websearch 서버 도구) |
| `task(subagent_type="X")` | `invoke_subagent` | 포팅된 서브에이전트 X 지정 |
| background task / `background_output` | `manage_task` | 비동기 태스크 생성·결과 수집 |
| `skill(name="X")` 호출 | "follow the X skill (globally installed)" 텍스트 지침 | 스킬 이름 텍스트로 재작성 |
| `todowrite` | "작업 목록을 워크스페이스 마크다운 체크박스로 유지" 절차 지침 | 체크박스 기반 작업 추적 |
| `LspDiagnostics` / `LspFormat` / `LspGotoDefinition` / `LspFindReferences` | MCP lsp 서버 도구(`mcp-config.fragment.json`에 등록) 또는 `grep_search` fallback | T3 MCP 등록 필요 |
| `interactive_bash` | `run_command` | PTY 없음 — 이 제한을 표에 명시 |
| `team_create` / `team_send_message` / `team_delete` | "N개 역할 `invoke_subagent` 병렬 호출 후 결과 종합" 절차 지침 | 한 행에 3개 도구 모두 |
| `question` 도구 | 일반 텍스트로 사용자에게 질문 | 대화형 확인 |

## Structure rules

스킬 변환 규칙:

1. 스킬 frontmatter는 `name`(선택, 폴더명이 기본값)과 `description`(필수, ≤1024자)만 허용합니다. 그 외 키는 추가하지 않습니다.
2. `<command-instruction>` XML 블록은 삭제하지 말고 본문 섹션으로 유지합니다(예: `## Slash-command usage` 절로 병합).
3. 스킬 간 상호참조는 도구 호출(`skill()`, `task()`)이 아니라 스킬 이름 텍스트로 재작성합니다.
4. 스킬은 자동으로 `/<name>` 슬래시 커맨드가 됩니다.

## FORBIDDEN TOKENS

아래 14개 콜-형태 패턴은 `validate.mjs`가 포팅된 스킬/에이전트 본문에서 스캔합니다. 각 줄은 스캔 대상 리터럴/정규식 서브스트링입니다(한 줄에 하나):

```
task(subagent_type
task(category
background_output(
skill(name=
todowrite
interactive_bash
LspDiagnostics
LspFormat
LspGotoDefinition
LspFindReferences
lsp_diagnostics
team_create(
team_send_message(
team_delete(
```

`validate.mjs`는 이 패턴들 중 하나라도 일치하면 위반으로 처리하고 exit 1을 반환합니다.
