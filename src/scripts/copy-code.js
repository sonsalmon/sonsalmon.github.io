// 코드 상자 [복사] 단추. 줄 번호는 빼고 코드 글자만 복사한다. 이 스크립트가 없어도 코드는 그대로 보인다.
for (const btn of document.querySelectorAll('.codecopy')) {
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    const code = [...btn.closest('.codebox').querySelectorAll('.t')].map((t) => t.textContent).join('\n');
    let msg = '복사했어요';
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      msg = '복사 못 했어요';
    }
    btn.textContent = msg;
    setTimeout(() => (btn.textContent = '복사'), 1500);
  });
}
