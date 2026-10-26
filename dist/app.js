/* UI only. Scoring rules live in analyzer.js. */
const input = document.querySelector('#input');
const result = document.querySelector('#result');
const error = document.querySelector('#input-error');
let mode = 'url';
const samples = {
  url:'http://192.168.10.24/account/verify?user=bank&urgent=true',
  email:'URGENT: Your account will be blocked today. Verify your password and OTP now using the link below to avoid suspension.'
};
function clearResult() {
  result.classList.remove('show');
  error.textContent = '';
  input.removeAttribute('aria-invalid');
}
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  mode = tab.dataset.mode;
  document.querySelectorAll('.tab').forEach(other => {
    other.classList.toggle('active',other === tab);
    other.setAttribute('aria-pressed',String(other === tab));
  });
  input.placeholder = mode === 'url' ? 'Paste a link you are unsure about…' : 'Paste the text of a suspicious email or message…';
  input.value = '';
  clearResult();
}));
input.addEventListener('input',clearResult);
document.querySelector('#sample').addEventListener('click',() => {
  input.value = samples[mode];
  clearResult();
  input.focus();
});
document.querySelector('#scan').addEventListener('click',() => {
  const out = PhishShield.analyze(input.value,mode);
  clearResult();
  if (!out.ok) {
    error.textContent = out.error;
    input.setAttribute('aria-invalid','true');
    input.focus();
    return;
  }
  const score = document.querySelector('#score');
  score.textContent = out.points;
  score.style.color = out.level === 'high' ? 'var(--red)' : out.level === 'caution' ? 'var(--yellow)' : 'var(--cyan)';
  document.querySelector('#riskTitle').textContent = out.level === 'high'
    ? 'High warning score — verify independently'
    : out.level === 'caution' ? 'Caution advised — inspect before acting'
    : 'Few warning patterns — safety is unverified';
  document.querySelector('#findings').replaceChildren(...out.notes.map(note => {
    const item = document.createElement('li');
    item.textContent = note;
    return item;
  }));
  result.classList.add('show');
  result.scrollIntoView({behavior:'smooth',block:'nearest'});
});
