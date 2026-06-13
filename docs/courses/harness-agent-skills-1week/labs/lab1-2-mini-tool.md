# 랩 1-2 — 첫 미니 도구: 할 일 체크리스트 웹앱 (Day 1)

> 목표: **자연어 지시만으로** 화면에서 동작하는 도구 하나를 완성한다.
> 소요: 약 60~90분. 결과물: `todo.html` (브라우저로 열면 동작).

## 진행 단계 (작게 쪼개기)
Cursor의 AI 패널에서 한 단계씩 시키고, 매번 **수락(Apply)** 후 브라우저로 열어 확인합니다.

**1단계 — 뼈대**
```
ax-week 폴더에 todo.html 파일을 만들어줘. 제목 "오늘의 할 일", 입력칸 하나, "추가" 버튼 하나만 있는 한 페이지 웹앱으로. 한국어 UI.
```
→ `todo.html`을 브라우저로 열어 화면 확인.

**2단계 — 추가 기능**
```
추가 버튼을 누르면 입력한 내용이 아래 목록에 추가되게 해줘. 추가 후 입력칸은 비워줘.
```
→ 새로고침(F5) 후 항목이 추가되는지 확인.

**3단계 — 체크 표시**
```
각 항목 앞에 체크박스를 넣고, 체크하면 그 항목 글자에 줄이 그어지게(완료 표시) 해줘.
```

**4단계 — 다듬기**
```
전체를 파란색 테마로 깔끔하게 다듬고, 엔터키로도 추가되게 해줘.
```

## 확인(검증)
- [ ] 항목을 추가할 수 있다
- [ ] 체크하면 줄이 그어진다
- [ ] 엔터로도 추가된다
- [ ] 스크린샷 저장

---

## ✅ 완성본 (정답) — `todo.html`
> 막히면 이 파일을 그대로 만들어 비교하세요. 브라우저로 열면 바로 동작합니다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>오늘의 할 일</title>
  <style>
    body { font-family: system-ui, 'Apple SD Gothic Neo', sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; color: #1f2937; }
    h1 { font-size: 22px; }
    .row { display: flex; gap: 8px; margin-bottom: 16px; }
    input[type="text"] { flex: 1; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; }
    button { padding: 10px 16px; border: 0; border-radius: 8px; background: #2563eb; color: #fff; font-size: 15px; cursor: pointer; }
    button:hover { background: #1d4ed8; }
    ul { list-style: none; padding: 0; }
    li { display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid #eee; }
    li.done span { text-decoration: line-through; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>오늘의 할 일 ✅</h1>
  <div class="row">
    <input id="task" type="text" placeholder="할 일을 입력하세요" />
    <button id="add">추가</button>
  </div>
  <ul id="list"></ul>

  <script>
    const input = document.getElementById('task');
    const list = document.getElementById('list');

    function addTask() {
      const text = input.value.trim();
      if (!text) return;
      const li = document.createElement('li');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      const span = document.createElement('span');
      span.textContent = text;
      cb.addEventListener('change', () => li.classList.toggle('done', cb.checked));
      li.appendChild(cb);
      li.appendChild(span);
      list.appendChild(li);
      input.value = '';
      input.focus();
    }

    document.getElementById('add').addEventListener('click', addTask);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
  </script>
</body>
</html>
```

## 응용(빠른 팀)
- "목록을 새로고침해도 유지되게 저장해줘" (브라우저 저장)
- "완료한 항목 개수를 위에 보여줘"
- 본인 업무용으로 바꾸기: 체크리스트 → 간단 계산기/문구 생성기 등
