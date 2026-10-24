const API_BASE_URL = (window.CHAT_API_BASE_URL || "").replace(/\/$/, "");
const chat = document.querySelector('#chat');
const input = document.querySelector('#message');
const send = document.querySelector('#send');
const clear = document.querySelector('#clear');
const status = document.querySelector('#status');
const welcome = document.querySelector('#welcome');
let history = [];
let busy = false;
function bubble(role, text) {
  const article = document.createElement('article');
  article.className = role;
  const label = document.createElement('strong');
  label.textContent = role === 'user' ? 'You' : 'Everyday AI';
  const body = document.createElement('div');
  body.textContent = text; // Never execute model/user HTML.
  article.append(label, body);
  chat.append(article);
  chat.scrollTop = chat.scrollHeight;
  return article;
}
async function submit(event) {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;
  busy = true; send.disabled = true; clear.disabled = true; input.disabled = true;
  welcome.hidden = true;
  const pending = bubble('user', text);
  status.textContent = 'Thinking… A sleeping demo server may take about a minute to start.';
  // Keep complete pairs, reserving room for the newest user turn.
  let context = history.slice(-20);
  while (context.length && context.reduce((n, m) => n + m.content.length, 0) + text.length > 24000) context = context.slice(2);
  const messages = [...context, {role: 'user', content: text}];
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({messages}), signal: AbortSignal.timeout(190000)});
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Message rejected. Shorten your question and try again.');
    bubble('assistant', data.reply);
    history = [...messages, {role: 'assistant', content: data.reply}];
    input.value = '';
    status.textContent = '';
  } catch (error) {
    pending.remove();
    status.textContent = error.name === 'TimeoutError' ? 'Request timed out. Please try again.' : error.message;
    welcome.hidden = history.length > 0;
  } finally {
    busy = false; send.disabled = false; clear.disabled = false; input.disabled = false; input.focus();
  }
}
document.querySelector('#form').addEventListener('submit', submit);
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); document.querySelector('#form').requestSubmit(); }
});
clear.addEventListener('click', () => {
  if (busy) return;
  history = []; chat.querySelectorAll('article').forEach(el => el.remove());
  welcome.hidden = false; status.textContent = ''; input.value = ''; input.focus();
});
document.querySelectorAll('.suggestions button').forEach(button => button.addEventListener('click', () => { input.value = button.textContent; input.focus(); }));
