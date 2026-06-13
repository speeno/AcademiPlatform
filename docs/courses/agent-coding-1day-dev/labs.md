# [D1] 실습 랩 (개발자)

> 실제 레포(샘플 또는 본인 사이드)에서 에이전트 워크플로우를 체험합니다. 완성본은 "이렇게 되면 성공"의 기준입니다.
> 도구: Cursor 또는 Claude Code. 변경 diff는 **항상 읽고 수락**, 가능하면 **테스트로 검증**.

---

## 샘플 과제 (레포가 없으면 이걸로)
작은 Node 스크립트 `discount.js` — 의도된 버그가 있습니다.

```javascript
// discount.js — 가격에 할인율(%)을 적용해 최종가를 반환
function applyDiscount(price, percent) {
  // 버그: 퍼센트를 비율로 바꾸지 않고 그대로 빼고 있음
  return price - percent;
}

console.log(applyDiscount(10000, 10)); // 기대: 9000, 실제: 9990
module.exports = { applyDiscount };
```

---

## 랩 1 — 버그 수정 + 기능 추가 (80분)

### 1) 버그 수정 (플랜-퍼스트)
```
discount.js 의 applyDiscount가 잘못됐어. 입력 (10000, 10)에서 기대값은 9000인데 9990이 나와.
원인을 한 줄로 설명하고 최소 수정으로 고쳐줘. 그리고 회귀 테스트도 추가해줘.
```
**✅ 완성본**
```javascript
function applyDiscount(price, percent) {
  if (percent < 0 || percent > 100) throw new Error('percent must be 0..100');
  return Math.round(price * (1 - percent / 100));
}
module.exports = { applyDiscount };
```
```javascript
// discount.test.js (예: node:test 또는 jest)
const assert = require('node:assert');
const { test } = require('node:test');
const { applyDiscount } = require('./discount');

test('10% 할인', () => assert.strictEqual(applyDiscount(10000, 10), 9000));
test('0% 할인', () => assert.strictEqual(applyDiscount(5000, 0), 5000));
test('100% 할인', () => assert.strictEqual(applyDiscount(5000, 100), 0));
test('범위 밖은 에러', () => assert.throws(() => applyDiscount(100, 150)));
```
> 실행해서 통과 확인: `node --test`

### 2) 기능 추가
```
applyDiscount에 "쿠폰 추가 할인(원 단위)"을 더하는 기능을 추가해줘.
계획(영향 함수/시그니처)을 먼저 보여주고, 합의 후 구현 + 테스트.
```
- 변경 diff를 **읽고** 수락 → 테스트 통과 확인.

---

## 랩 2 — 커스텀 Skill + 프로젝트 메모리 (60분)

### CLAUDE.md (레포 루트)
```markdown
# 프로젝트 규칙 (CLAUDE.md)
- 언어/런타임: Node.js (CommonJS)
- 테스트: `node --test` (파일명 *.test.js)
- 스타일: 작은 함수, 입력 검증은 경계에서만, 외부 의존성 추가 금지(승인 필요)
- 변경 시: 관련 테스트를 함께 추가/수정한다
- 커밋 메시지: 한 줄 요약(영문, 명령형) + 본문(왜)
```

### SKILL.md (예: 테스트 작성 스킬)
`.skills/test-writer/SKILL.md`
```markdown
---
name: test-writer
description: 함수/모듈의 단위 테스트를 작성할 때 사용. "테스트 짜줘", "엣지 케이스 추가" 요청 시.
---
# 테스트 작성 스킬
## 절차
1. 대상의 입력/출력과 경계·예외를 표로 정리한다.
2. 정상/경계/예외 케이스를 node:test 로 작성한다.
3. 파일명은 <대상>.test.js, 실행은 `node --test`.
## 규칙
- 외부 라이브러리 추가하지 않는다.
- 한 테스트는 한 가지만 검증한다.
```

### 적용
```
.skills/test-writer/SKILL.md 의 절차에 따라 discount.js 의 테스트를 보강해줘.
CLAUDE.md 규칙을 지켜줘.
```
- 결과가 규칙/절차를 따르는지 확인 → 안 맞으면 SKILL.md를 다듬어 재시도.

---

## 랩 3 (미니) — 코드 리뷰 / 테스트 (30분)
```
방금 변경한 diff를 리뷰해줘. 버그·엣지케이스·보안 관점에서 확신도와 함께 지적하고, 사소한 스타일은 빼줘.
```
- 지적 중 타당한 것만 반영 → 테스트 재실행.

## 확인(검증)
- [ ] 버그 수정 + 테스트 통과(`node --test`)
- [ ] 기능 추가가 계획→구현→테스트 순으로 진행됨
- [ ] `CLAUDE.md` 적용으로 규칙이 반영됨
- [ ] `SKILL.md` 호출이 절차를 따름
- [ ] 모든 변경 diff를 읽고 수락함

## 산출물
- 적용 커밋/브랜치 + `CLAUDE.md` + `.skills/test-writer/SKILL.md`.
