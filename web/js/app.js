// =================== NotGPT App ===================
// Core application: chat history, UI, settings, init

// =================== DATA ===================
const STORAGE_KEY = 'notgpt_chats';
const MAX_CHATS = 25;
const WATER_PER_QUERY_ML = 10;

// Google Sheets endpoint for opt-in data collection
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyuyiKgpBL9RPH81m9E4KLpmHVcn3yOXaJvg-hG3yyZF-bU2I8M_gXcj97RpLjBR0zGsA/exec';

let allChats = [];
let activeChatId = null;
let sessionWaterMl = 0;



// =================== INIT ===================
function init() {
  // Fix the modal heading
  const modalH2 = document.querySelector('.modal h2');
  if (modalH2 && modalH2.textContent === 'What can NotGPT do?') {
    modalH2.textContent = 'What can I do?';
  }

  loadChats();
  if (allChats.length === 0) {
    createNewChat(true);
  } else {
    activeChatId = allChats[0].id;
    renderChatList();
    loadChat(activeChatId);
  }
  setWelcomeMessage();
  document.getElementById('composerInput').focus();
  cleanupOldFailedChats();
}

// =================== CHAT STORAGE ===================
function loadChats() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    allChats = data ? JSON.parse(data) : [];
  } catch(e) { allChats = []; }
}

function saveChats() {
  if (allChats.length > MAX_CHATS) {
    allChats = allChats.slice(0, MAX_CHATS);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allChats));
  } catch(e) {}
}

function getActiveChat() {
  return allChats.find(c => c.id === activeChatId);
}



// =================== RENDER CHAT LIST ===================
function renderChatList() {
  const list = document.getElementById('chatList');
  list.innerHTML = '';
  allChats.forEach(chat => {
    const div = document.createElement('div');
    div.className = 'sidebar-item' + (chat.id === activeChatId ? ' active' : '');
    div.innerHTML = `
      <span class="item-text">${escapeHtml(chat.name)}</span>
      <button class="delete-btn" onclick="event.stopPropagation();deleteChat('${chat.id}')" title="Delete">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    div.onclick = () => switchChat(chat.id);
    list.appendChild(div);
  });
}

// =================== CHAT OPERATIONS ===================
function createNewChat(silent) {
  const chat = {
    id: 'chat_' + Date.now(),
    name: '\ud83d\udcac New chat',
    messages: [],
    created: Date.now()
  };
  allChats.unshift(chat);
  activeChatId = chat.id;
  saveChats();
  renderChatList();

  document.getElementById('welcomeScreen').style.display = '';
  document.getElementById('messagesContainer').style.display = 'none';
  document.getElementById('messagesContainer').innerHTML = '';
  document.getElementById('composerInput').value = '';
  toggleSend();
  setWelcomeMessage();
  document.getElementById('sessionWater').classList.remove('visible');
  sessionWaterMl = 0;
  if (!silent) document.getElementById('composerInput').focus();
}

function switchChat(chatId) {
  activeChatId = chatId;
  renderChatList();
  loadChat(chatId);
  closeSidebarMobile();
}

function loadChat(chatId) {
  const chat = allChats.find(c => c.id === chatId);
  if (!chat) return;

  const container = document.getElementById('messagesContainer');
  container.innerHTML = '';

  if (chat.messages.length === 0) {
    document.getElementById('welcomeScreen').style.display = '';
    container.style.display = 'none';
    setWelcomeMessage();
    document.getElementById('sessionWater').classList.remove('visible');
    sessionWaterMl = 0;
  } else {
    document.getElementById('welcomeScreen').style.display = 'none';
    container.style.display = 'block';

    let lastDate = '';
    chat.messages.forEach(msg => {
      const msgDate = formatDateLabel(msg.timestamp);
      if (msgDate !== lastDate) {
        addDateDivider(msgDate);
        lastDate = msgDate;
      }
      if (msg.type === 'user') {
        addUserMessageDOM(msg.text, msg.timestamp);
      } else {
        addBotMessageDOM(msg.html, msg.timestamp);
      }
    });
    scrollToBottom();
    updateWaterBadge();
  }
}

function deleteChat(chatId) {
  allChats = allChats.filter(c => c.id !== chatId);
  saveChats();
  if (chatId === activeChatId) {
    if (allChats.length > 0) {
      switchChat(allChats[0].id);
    } else {
      createNewChat(true);
    }
  } else {
    renderChatList();
  }
}

// =================== TIMESTAMPS ===================
function formatTime(ts) {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + m + ' ' + ampm;
}

function formatDateLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

// =================== DOM HELPERS ===================
function addDateDivider(label) {
  const container = document.getElementById('messagesContainer');
  const div = document.createElement('div');
  div.className = 'date-divider';
  div.innerHTML = '<span>' + label + '</span>';
  container.appendChild(div);
}

function addUserMessageDOM(text, ts) {
  const container = document.getElementById('messagesContainer');
  const div = document.createElement('div');
  div.className = 'message msg-user';
  div.innerHTML = `
    <div class="msg-user-inner">
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <div class="msg-time">${formatTime(ts)}</div>
    </div>`;
  container.appendChild(div);
}

function addBotMessageDOM(html, ts) {
  const container = document.getElementById('messagesContainer');
  const div = document.createElement('div');
  div.className = 'message msg-bot';
  div.setAttribute('data-chars', html.length.toString());
  div.innerHTML = `
    <div class="msg-content">${html}</div>
    <div class="msg-meta">
      <div class="msg-time">${formatTime(ts)}</div>
      <button class="copy-btn" onclick="copyBotMessage(this)" title="Copy">
        <i class="fa-regular fa-clone"></i>
      </button>
    </div>`;
  container.appendChild(div);
  updateWaterBadge();
}

// =================== COPY BUTTON ===================
function copyBotMessage(btn) {
  const msgBot = btn.closest('.msg-bot');
  if (!msgBot) return;
  const contentEl = msgBot.querySelector('.msg-content');
  if (!contentEl) return;

  // Get text content (strips HTML)
  const text = contentEl.innerText || contentEl.textContent;

  navigator.clipboard.writeText(text).then(() => {
    // Show "Copied!" tooltip
    const icon = btn.querySelector('i');
    const origClass = icon.className;
    icon.className = 'fa-solid fa-check';
    btn.style.color = 'var(--accent)';
    btn.style.borderColor = 'var(--accent)';

    const tooltip = document.createElement('span');
    tooltip.textContent = 'Copied!';
    tooltip.style.cssText = 'position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:var(--bg-active);color:var(--accent);font-size:10px;padding:2px 8px;border-radius:4px;white-space:nowrap;pointer-events:none;animation:msgIn 0.2s ease-out;';
    btn.appendChild(tooltip);

    setTimeout(() => {
      icon.className = origClass;
      btn.style.color = 'var(--text-muted)';
      btn.style.borderColor = 'var(--border)';
      if (tooltip.parentNode) tooltip.remove();
    }, 1500);
  }).catch(() => {
    // Fallback: select text
    const range = document.createRange();
    range.selectNodeContents(contentEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    try { document.execCommand('copy'); } catch(e) {}
    sel.removeAllRanges();
  });
}

let loadingCounter = 0;
function showLoading() {
  const id = 'loading-' + (++loadingCounter);
  const container = document.getElementById('messagesContainer');
  const div = document.createElement('div');
  div.id = id;
  div.className = 'loading-indicator';
  const msg = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
  div.innerHTML = `
    <div class="loading-dots"><span></span><span></span><span></span></div>
    <div class="loading-text">${msg}</div>`;
  container.appendChild(div);
  scrollToBottom();
  return id;
}
function removeLoading(id) { const el = document.getElementById(id); if (el) el.remove(); }
function scrollToBottom() { const a = document.getElementById('chatArea'); requestAnimationFrame(() => a.scrollTop = a.scrollHeight); }
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

// =================== SEND ===================
function sendMessage(text) {
  if (!text.trim()) return;
  const chat = getActiveChat();
  if (!chat) return;

  const now = Date.now();

  // Show messages view
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('messagesContainer').style.display = 'block';

  // Date divider check
  const lastMsg = chat.messages[chat.messages.length - 1];
  const todayLabel = formatDateLabel(now);
  if (!lastMsg || formatDateLabel(lastMsg.timestamp) !== todayLabel) {
    addDateDivider(todayLabel);
  }

  // Add user message
  chat.messages.push({ type: 'user', text: text, timestamp: now });
  addUserMessageDOM(text, now);

  // Auto-name chat on first message
  if (chat.messages.length === 1) {
    chat.name = generateChatName(text);
    renderChatList();
  }

  // Clear composer
  const input = document.getElementById('composerInput');
  input.value = '';
  autoGrow(input);
  toggleSend();

  // Show loading
  const loadingId = showLoading();
  saveChats();

  // Simulate response delay
  setTimeout(() => {
    removeLoading(loadingId);
    const respTime = Date.now();

    // Route through NLP parser (preprocessing is handled inside parseAndRouteEnhanced)
    var result = parseAndRoute(text);

    if (result && result.type === 'help') {
      openModal();
      const helpHtml = "I've opened the full tool catalog for you! Take a look at everything I can do - all without AI. \ud83d\udca7";
      logQuery(text, 'help', true);
      chat.messages.push({ type: 'bot', html: helpHtml, timestamp: respTime });
      addBotMessageDOM(helpHtml, respTime);
      addWaterSaved();
      saveChats();
      scrollToBottom();
      return;
    }

    if (result && result.html) {
      logQuery(text, result.type, true);
      chat.messages.push({ type: 'bot', html: result.html, timestamp: respTime });
      addBotMessageDOM(result.html, respTime);
      addWaterSaved();
      saveChats();
      scrollToBottom();
      return;
    }

    // Fallback
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    const responseHtml = fallback;
    logQuery(text, 'unmatched', false);
    chat.messages.push({ type: 'bot', html: responseHtml, timestamp: respTime });
    addBotMessageDOM(responseHtml, respTime);
    addWaterSaved();
    saveChats();
    scrollToBottom();

  }, 700 + Math.random() * 600);
}

function sendFromComposer() {
  sendMessage(document.getElementById('composerInput').value);
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (document.getElementById('composerInput').value.trim()) sendFromComposer();
  }
}
function autoGrow(el) { el.style.height = '22px'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; }
function toggleSend() { document.getElementById('sendBtn').disabled = !document.getElementById('composerInput').value.trim(); }

// =================== WATER ===================
function addWaterSaved() {
  /* handled by updateWaterBadge */
}

function calcWaterSaved(charCount) {
  return Math.max(5, Math.round(5 + (charCount / 100) * 2));
}

function updateWaterBadge() {
  var container = document.getElementById('messagesContainer');
  var el = document.getElementById('sessionWater');

  var botMsgs = container.querySelectorAll('.msg-bot');

  if (botMsgs.length === 0) {
    el.classList.remove('visible');
    sessionWaterMl = 0;
    return;
  }

  var totalWater = 0;
  botMsgs.forEach(function(msg) {
    var chars = parseInt(msg.getAttribute('data-chars') || '200');
    totalWater += calcWaterSaved(chars);
  });

  var responseCount = botMsgs.length;
  sessionWaterMl = totalWater;
  el.classList.add('visible');
  document.getElementById('sessionWaterAmount').textContent = '~' + totalWater + ' ml saved';
  el.title = '~' + totalWater + ' ml saved with ' + responseCount + ' response' + (responseCount > 1 ? 's' : '');
}

// =================== WELCOME ===================
function setWelcomeMessage() {
  const msg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  document.getElementById('welcomeTitle').innerText = msg.title;
  document.getElementById('welcomeSub').innerText = msg.sub;
}

// =================== MODAL ===================
function openModal() { document.getElementById('modalOverlay').classList.add('active'); }
function closeModal(e) { if (e.target === document.getElementById('modalOverlay')) closeModalDirect(); }
function closeModalDirect() { document.getElementById('modalOverlay').classList.remove('active'); }

// =================== MOBILE SIDEBAR ===================
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
}
function closeSidebarMobile() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}


// =================== SETTINGS ===================
var SETTINGS_KEY = 'notgpt_settings';

function loadSettings() {
  try {
    var data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { chatLimit: 25, shareFailedChats: false };
  } catch(e) { return { chatLimit: 25, shareFailedChats: false }; }
}

function saveSettings() {
  var settings = {
    chatLimit: parseInt(document.getElementById('chatLimitSlider').value),
    shareFailedChats: document.getElementById('shareChatsToggle').checked
  };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch(e) {}
}

function openSettings() {
  var settings = loadSettings();
  document.getElementById('chatLimitSlider').value = settings.chatLimit;
  document.getElementById('chatLimitVal').textContent = settings.chatLimit;
  document.getElementById('shareChatsToggle').checked = settings.shareFailedChats;
  document.getElementById('settingsOverlay').classList.add('active');
}

function closeSettings(e) { if (e.target === document.getElementById('settingsOverlay')) closeSettingsDirect(); }
function closeSettingsDirect() { document.getElementById('settingsOverlay').classList.remove('active'); }
function updateChatLimitLabel(val) { document.getElementById('chatLimitVal').textContent = val; }

// =================== DATA LOGGING (opt-in) ===================
function logQuery(query, toolMatched, matched) {
  try {
    var settings = loadSettings();
    if (!settings.shareFailedChats) return;
    // Only log failed/unmatched queries
    if (matched) return;
    fetch(SHEETS_URL, {
      method: 'POST',
      body: JSON.stringify({
        _t: 'notgpt_v2',
        type: 'failed_query',
        query: query,
        tool: toolMatched || 'unmatched',
        matched: 'no',
        timestamp: new Date().toISOString()
      })
    }).catch(function() {});
  } catch(e) {}
}

function sendFeedback(message) {
  if (!message || !message.trim()) return;
  fetch(SHEETS_URL, {
    method: 'POST',
    body: JSON.stringify({
      _t: 'notgpt_v2',
      type: 'feedback',
      message: message.trim()
    })
  }).then(function() {
    alert('Thank you for your feedback! \ud83d\ude4f');
  }).catch(function() {
    alert('Could not send feedback. Please try again.');
  });
}

// =================== AUTO-CLEANUP ===================
// Asks the sheet to drop entries older than 7 days. Sent only by people who opted in to sharing,
// so nobody else's browser contacts the endpoint. (Best: also run the scheduled cleanup in
// docs/apps-script.gs, so deletion doesn't depend on visits.)
function cleanupOldFailedChats() {
  try {
    if (!loadSettings().shareFailedChats) return;
    fetch(SHEETS_URL, {
      method: 'POST',
      body: JSON.stringify({
        _t: 'notgpt_v2',
        type: 'cleanup',
        maxAgeDays: 7
      })
    }).catch(function() {});
  } catch(e) {}
}

// =================== BOOT ===================
init();