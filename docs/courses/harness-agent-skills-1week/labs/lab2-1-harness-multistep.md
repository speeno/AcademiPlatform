# 랩 2-1 — 하네스로 다단계 작업: 팀 소개 미니사이트 (Day 2)

> 목표: 하네스(Cursor)가 **여러 단계·여러 파일**을 스스로 처리하고, 우리가 매 단계 **확인·통제**하는 흐름을 체험한다.
> 결과물: `mini-site/index.html`

## 진행 단계
한 번에 하나씩 시키고, 변경을 **수락(Apply)** 한 뒤 브라우저로 확인합니다.

```
1) ax-week 안에 mini-site 폴더를 만들고, 그 안에 index.html(한국어 소개 웹페이지)을 만들어줘.
```
```
2) 상단에 큰 제목 "우리 팀 소개", 아래에 소개 문단 한 줄, 그리고 "문의하기" 버튼을 넣어줘.
```
```
3) 문의하기 버튼을 누르면 "문의 접수됨! 곧 연락드리겠습니다." 알림이 뜨게 해줘.
```
```
4) 전체를 파란색 테마로 깔끔하게 다듬어줘.
```

### 일부러 오류 내보기 (학습 포인트)
- 아무 동작이 안 되면 다음을 그대로 보내 **AI의 수정 루프**를 관찰:
```
버튼을 눌러도 알림이 안 떠. 왜 그런지 한 문장으로 설명하고 고쳐줘.
```

## 확인(검증)
- [ ] 폴더와 파일이 만들어졌다(왼쪽 탐색기)
- [ ] 제목·문단·버튼이 보인다
- [ ] 버튼을 누르면 알림이 뜬다
- [ ] 파란 테마가 적용됐다

## 관찰 포인트 (강사 강조)
- 하네스의 **루프**: AI가 파일을 만들고 → 우리가 확인 → 다음 지시. 매 단계 **수락**이 곧 통제.
- "한 번에 다" 보다 **단계별로** 시키면 어디서 틀렸는지 바로 보인다.

---

## ✅ 완성본 (정답) — `mini-site/index.html`
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>우리 팀 소개</title>
  <style>
    body { font-family: system-ui, 'Apple SD Gothic Neo', sans-serif; margin: 0; color: #0f172a; background: #f8fafc; }
    header { background: #2563eb; color: #fff; padding: 48px 20px; text-align: center; }
    header h1 { margin: 0; font-size: 28px; }
    main { max-width: 640px; margin: 0 auto; padding: 28px 20px; }
    p { line-height: 1.7; font-size: 16px; }
    button { background: #2563eb; color: #fff; border: 0; padding: 12px 22px; border-radius: 10px; font-size: 16px; cursor: pointer; }
    button:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <header><h1>우리 팀 소개</h1></header>
  <main>
    <p>안녕하세요! 저희는 AX 1주 과정 N팀입니다. 이 페이지는 코드를 직접 짜지 않고 바이브 코딩으로 만들었습니다.</p>
    <button id="contact">문의하기</button>
  </main>

  <script>
    document.getElementById('contact').addEventListener('click', () => {
      alert('문의 접수됨! 곧 연락드리겠습니다.');
    });
  </script>
</body>
</html>
```

## 응용(빠른 팀)
- "팀원 이름을 카드 3개로 보여줘"
- "문의 버튼을 누르면 입력창(이름·내용)이 나타나게 해줘"
