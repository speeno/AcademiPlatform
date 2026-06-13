# [N1] 실습 — 첫 미니 도구 만들기 (랩 A + B)

> 자연어 지시만으로 **동작하는 도구**를 만든다. 막히면 아래 완성본을 참고하세요(= "이렇게 나오면 성공").
> 결과물: `todo.html` (브라우저로 열면 동작)

## 랩 A — 만들기 (90분)
Cursor의 AI 패널에서 한 단계씩 시키고, **수락(Apply)** 후 브라우저로 확인합니다.

```
1) ax-1day 폴더에 todo.html 을 만들어줘. 제목 "오늘의 할 일", 입력칸 하나, "추가" 버튼 하나만. 한국어 UI.
```
```
2) 추가 버튼을 누르면 입력 내용이 아래 목록에 추가되고, 입력칸은 비워줘.
```
```
3) 각 항목에 체크박스를 넣고, 체크하면 글자에 줄이 그어지게 해줘.
```
```
4) 파란색 테마로 깔끔히 다듬고, 엔터로도 추가되게 해줘.
```

> 체크리스트 대신 **본인 업무용**(예: 할인·환율 계산기, 글 요약기)으로 바꿔도 좋습니다.

## 랩 B — 한 단계 키우기 (50분)
아래 중 하나를 골라 기능을 추가(맥락을 주고 한 번에 하나씩):
```
새로고침해도 목록이 유지되게 저장해줘.
```
```
완료한 항목 개수를 제목 옆에 보여줘.
```

## 확인(검증)
- [ ] 항목 추가/체크/줄긋기 동작
- [ ] 엔터로 추가됨
- [ ] (랩 B) 추가 기능 동작
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
  <h1>오늘의 할 일 ✅ <small id="count" style="font-size:13px;color:#6b7280;"></small></h1>
  <div class="row">
    <input id="task" type="text" placeholder="할 일을 입력하세요" />
    <button id="add">추가</button>
  </div>
  <ul id="list"></ul>

  <script>
    const input = document.getElementById('task');
    const list = document.getElementById('list');
    const count = document.getElementById('count');

    function updateCount() {
      const done = list.querySelectorAll('li.done').length;
      const total = list.querySelectorAll('li').length;
      count.textContent = total ? `(${done}/${total} 완료)` : '';
    }

    function addTask(text) {
      const li = document.createElement('li');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      const span = document.createElement('span');
      span.textContent = text;
      cb.addEventListener('change', () => { li.classList.toggle('done', cb.checked); updateCount(); save(); });
      li.appendChild(cb);
      li.appendChild(span);
      list.appendChild(li);
    }

    function save() {
      const items = [...list.querySelectorAll('li')].map(li => ({ text: li.querySelector('span').textContent, done: li.classList.contains('done') }));
      localStorage.setItem('todos', JSON.stringify(items));
    }

    function load() {
      const items = JSON.parse(localStorage.getItem('todos') || '[]');
      items.forEach(it => { addTask(it.text); if (it.done) { const li = list.lastChild; li.classList.add('done'); li.querySelector('input').checked = true; } });
      updateCount();
    }

    function onAdd() {
      const text = input.value.trim();
      if (!text) return;
      addTask(text);
      input.value = '';
      input.focus();
      updateCount();
      save();
    }

    document.getElementById('add').addEventListener('click', onAdd);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') onAdd(); });
    load();
  </script>
</body>
</html>
```

> 이 완성본은 랩 B의 두 기능(저장 유지 + 완료 개수)까지 포함합니다. 랩 A만 할 땐 `save/load/count` 부분을 빼고 가장 단순하게 시작해도 됩니다.
