/* Local-only dashboard simulation. Never fetches credentials, stores real tokens,
   or calls any remote endpoint. Key gate is cosmetic client-side access, not auth. */
(() => {
  'use strict';
  const ACCESS_KEY = 'QIH_wshjdw_BUYLINK828';
  const SESSION_KEY = 'linkscum:demo:unlocked:v1';
  const DATA_KEY = 'linkscum:demo:history:v1';
  const LINK_KEY = 'linkscum:demo:lastLink:v1';
  const byId = (id) => document.getElementById(id);
  const panel = byId('scumPanel');
  const gate = byId('keyModal');
  const detail = byId('tokenDetails');
  if (!panel || !gate) return;

  const getStore = (type, key) => { try { return window[type].getItem(key); } catch { return null; } };
  const setStore = (type, key, value) => { try { window[type].setItem(key, value); } catch {} };
  const removeStore = (type, key) => { try { window[type].removeItem(key); } catch {} };
  let authorized = getStore('sessionStorage', SESSION_KEY) === '1';
  let lastLink = null;
  let currentToken = null;
  let currentRecord = null;
  let toastTimer = null;
  const readHistory = () => {
    try {
      const value = JSON.parse(getStore('localStorage', DATA_KEY) || '[]');
      return Array.isArray(value) ? value.filter(e => e && typeof e.token === 'string').slice(0, 100) : [];
    } catch { return []; }
  };
  let history = readHistory();
  try { lastLink = JSON.parse(getStore('localStorage', LINK_KEY) || 'null'); } catch {}
  // Migrate links saved by earlier file:// versions to a real HTTPS preview URL.
  if (lastLink && /^[a-f0-9]{24}$/.test(lastLink.id || '')) {
    const expiry=Number(lastLink.created || Date.now())+Number(lastLink.ttl || 1440)*60000;
    lastLink.url=new URL(`preview.html?ref=${encodeURIComponent(lastLink.id)}&exp=${expiry}`, 'https://scum-link-ru.vercel.app/').href;
    setStore('localStorage',LINK_KEY,JSON.stringify(lastLink));
  }

  function notify(message) {
    const toast = byId('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  }
  function closeGate() {
    gate.classList.remove('open'); gate.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function showGate() {
    gate.classList.add('open'); gate.setAttribute('aria-hidden', 'false');
    byId('keyFeedback').textContent = '';
    document.body.style.overflow = 'hidden';
    byId('activationKey')?.focus();
  }
  function openPanel() {
    closeGate();
    panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderHistory(); renderLastLink();
    byId('panelClose')?.focus();
  }
  function closePanel() {
    closeDetails();
    panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function openGate() { if (authorized) openPanel(); else showGate(); }
  window.ScumDemoPanel = { openGate };

  byId('activateForm')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const value = byId('activationKey').value.trim();
    if (value !== ACCESS_KEY) {
      byId('keyFeedback').textContent = 'Ключ не найден. Проверьте символы и попробуйте ещё раз.';
      byId('activationKey').focus();
      return;
    }
    authorized = true;
    setStore('sessionStorage', SESSION_KEY, '1');
    byId('activationKey').value = '';
    notify('Доступ к панели открыт');
    openPanel();
  });
  byId('panelClose')?.addEventListener('click', closePanel);
  panel.addEventListener('click', ev => { if (ev.target === panel) closePanel(); });
  const logout = () => {
    authorized = false; removeStore('sessionStorage', SESSION_KEY);
    closePanel(); notify('Сессия завершена');
  };
  byId('panelLogout')?.addEventListener('click', logout);
  byId('panelMobileLogout')?.addEventListener('click', logout);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      if (detail.classList.contains('open')) closeDetails();
      else if (panel.classList.contains('open')) closePanel();
    }
  });

  function switchTab(tab) {
    const isHistory = tab === 'history';
    byId('panelCreateView').hidden = isHistory;
    byId('panelHistoryView').hidden = !isHistory;
    byId('panelTitle').textContent = isHistory ? 'История токенов' : 'Создание ссылки';
    document.querySelectorAll('[data-panel-tab]').forEach(button => {
      const active = button.dataset.panelTab === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    if (isHistory) renderHistory();
  }
  document.querySelectorAll('[data-panel-tab]').forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.panelTab));
  });

  const utc = (d) => new Date(d).toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit',minute:'2-digit'});
  const time = (d) => new Date(d).toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit'});
  const randomHex = (n=12) => {
    const bytes = new Uint8Array(n);
    // Secure randomness prevents accidentally repeating tokens between browsers/devices.
    if (!window.crypto?.getRandomValues) throw new Error('Secure random is unavailable');
    window.crypto.getRandomValues(bytes);
    return [...bytes].map(v => v.toString(16).padStart(2,'0')).join('');
  };
  // Fully valid JWT structure and HMAC-SHA256 signature, but for this demo issuer only.
  // Signing key lives in the browser; these tokens cannot authenticate to any real service.
  const SIGN_KEY = 'linkscum:demo:signingKey:v2';
  const toB64Url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const utf8 = (s) => new TextEncoder().encode(s);
  const jsonB64 = (obj) => toB64Url(utf8(JSON.stringify(obj)));
  async function getSigningKey() {
    let raw = getStore('localStorage',SIGN_KEY);
    if (!raw || !/^[0-9a-f]{64}$/.test(raw)) {
      raw = randomHex(32);
      setStore('localStorage',SIGN_KEY,raw);
    }
    const bytes = Uint8Array.from(raw.match(/../g),h=>parseInt(h,16));
    return crypto.subtle.importKey('raw',bytes,{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
  }
  async function fakeJwt(platform, deviceInfo, created, id, expiry) {
    const header = {alg:'HS256',typ:'JWT'};
    const payload = {
      iss:'linkscum-demo',aud:'local-simulator',sub:'demo-' + randomHex(12),jti:id,nonce:randomHex(16),
      platform,device:deviceInfo.device,os:deviceInfo.os,browser:deviceInfo.browser,
      iat:Math.floor(created/1000),exp:Math.floor(expiry/1000),scope:'simulation'
    };
    const unsigned=`${jsonB64(header)}.${jsonB64(payload)}`;
    const signature = await crypto.subtle.sign('HMAC',await getSigningKey(),utf8(unsigned));
    return `${unsigned}.${toB64Url(new Uint8Array(signature))}`;
  }
  async function validateDemoJwt(token) {
    try {
      const parts=token.split('.');if(parts.length!==3)return false;
      const payload=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
      if(payload.iss!=='linkscum-demo'||payload.aud!=='local-simulator')return false;
      const signature=Uint8Array.from(atob(parts[2].replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
      return await crypto.subtle.verify('HMAC',await getSigningKey(),signature,utf8(`${parts[0]}.${parts[1]}`));
    } catch {return false;}
  }

  function renderLastLink() {
    const valid = lastLink && typeof lastLink.id === 'string' && typeof lastLink.url === 'string';
    byId('linkResult').hidden = !valid;
    if (!valid) return;
    byId('generatedLink').value = lastLink.url;
    byId('linkCreatedAt').textContent = utc(lastLink.created);
    byId('previewGeneratedLink').href = lastLink.url;
  }
  byId('createDemoLink')?.addEventListener('submit', ev => {
    ev.preventDefault();
    const name = byId('linkName').value.trim() || 'Standoff 2';
    const platform = byId('linkPlatform').value;
    const ttl = Number(byId('linkTtl').value) || 1440;
    const id = randomHex(12);
    const exp = Date.now() + ttl*60000;
    const url = 'https://www.youtube.com/watch?v=R2UnZ7hHJDeffef34';
    lastLink = {id,name,platform,created:Date.now(),ttl,url};
    setStore('localStorage',LINK_KEY,JSON.stringify(lastLink));
    renderLastLink();
    notify('Ссылка создана');
  });
  async function copyString(str) {
    try { await navigator.clipboard.writeText(str); return true; }
    catch {
      try {
        const elem = document.createElement('textarea');
        elem.value = str; elem.style.position='fixed'; elem.style.opacity='0';
        document.body.append(elem); elem.select();
        const result = document.execCommand('copy'); elem.remove(); return result;
      } catch { return false; }
    }
  }
  byId('copyGeneratedLink')?.addEventListener('click', async () => {
    if (lastLink?.url) notify(await copyString(lastLink.url) ? 'Ссылка скопирована' : 'Не удалось скопировать');
  });
  const devices = [
    {device:'Samsung Galaxy S24',os:'Android 15',browser:'Chrome Mobile'},
    {device:'iPhone 15',os:'iOS 18',browser:'Safari'},
    {device:'Xiaomi 14',os:'Android 14',browser:'Chrome Mobile'},
    {device:'Windows PC',os:'Windows 11',browser:'Chrome'},
    {device:'iPad Air',os:'iPadOS 18',browser:'Safari'}
  ];
  byId('simulateVisit')?.addEventListener('click', async () => {
    if (!lastLink) return;
    const now = Date.now();
    const selected=byId('testDevice')?.value || 'random';
    const d=selected==='random' ? devices[Math.floor(Math.random()*devices.length)] : devices.find(x=>x.device===selected) || devices[0];
    const id = randomHex(16).toUpperCase();
    let token;
    try { token=await fakeJwt(lastLink.platform,d,now,id,now+3600000); }
    catch { notify('Криптография недоступна в этом браузере'); return; }
    const record = {id,token,created:now,expires:now+3600000,platform:lastLink.platform,linkName:lastLink.name,device:d.device,os:d.os,browser:d.browser,sourceId:lastLink.id};
    history.unshift(record); history=history.slice(0,100);
    setStore('localStorage',DATA_KEY,JSON.stringify(history));
    renderHistory(); switchTab('history');
    notify('Создан новый уникальный тестовый токен');
  });

  function renderHistory() {
    byId('tokenCounter').textContent = String(history.length);
    byId('historyCount').textContent = String(history.length);
    byId('lastHistoryAt').textContent = history[0] ? time(history[0].created) : '—';
    byId('tokenHistoryEmpty').hidden = history.length > 0;
    const list=byId('tokenHistoryList'); list.replaceChildren();
    for (const item of history) {
      const card = document.createElement('div'); card.className='panel-history-card';
      const icon = document.createElement('div'); icon.className='panel-history-icon'; icon.textContent='⬡';
      const copy = document.createElement('div'); copy.className='panel-history-copy';
      const title = document.createElement('strong'); title.textContent=item.device;
      const sub = document.createElement('small'); sub.textContent=`${utc(item.created)} · ${item.os} · ${item.platform}`;
      copy.append(title,sub);
      const button = document.createElement('button'); button.type='button'; button.className='panel-history-button'; button.textContent='Токен и детали →';
      button.addEventListener('click', () => showDetails(item));
      card.append(icon,copy,button); list.append(card);
    }
  }
  byId('clearTokenHistory')?.addEventListener('click', () => {
    if (!history.length) return;
    if (!window.confirm('Очистить всю локальную историю токенов?')) return;
    history=[];
    removeStore('localStorage',DATA_KEY);
    renderHistory(); notify('История очищена');
  });
  async function showDetails(item) {
    currentRecord = item;
    currentToken = item.token;
    const info = byId('tokenDetailsBody'); info.replaceChildren();
    const grid=document.createElement('div'); grid.className='token-info-grid';
    const fields=[['ID',item.id],['Дата и время',utc(item.created)],['Устройство',item.device],['Система',item.os],['Браузер',item.browser],['Платформа',item.platform],['Истекает',utc(item.expires)],['Источник',item.linkName]];
    for (const [label,value] of fields) {
      const box=document.createElement('div'); const tag=document.createElement('span'); const val=document.createElement('strong');
      tag.textContent=label; val.textContent=value; box.append(tag,val); grid.append(box);
    }
    const tokenLabel=document.createElement('span'); tokenLabel.className='token-full-label'; tokenLabel.textContent='TOKEN';
    const tokenText=document.createElement('div'); tokenText.className='token-full-text'; tokenText.textContent=item.token;
    info.append(grid,tokenLabel,tokenText);
    const status=document.createElement('div');status.className='token-verification';
    const verified=await validateDemoJwt(item.token);
    const expires=item.expires>Date.now();
    status.textContent=verified?`✓ HMAC-SHA256 проверена · ${expires?'срок не истёк':'срок истёк'} · локальная симуляция`:'⚠ Подпись старой записи не подтверждается';
    info.append(status);
    detail.classList.add('open'); detail.setAttribute('aria-hidden','false');
    byId('tokenDetailsClose').focus();
  }
  function closeDetails() { currentRecord=null; detail.classList.remove('open');detail.setAttribute('aria-hidden','true'); }
  byId('tokenDetailsClose')?.addEventListener('click',closeDetails);
  detail.addEventListener('click',ev => { if (ev.target===detail) closeDetails(); });
  byId('renewDetailToken')?.addEventListener('click',async () => {
    if (!currentRecord) return;
    const prev=currentRecord;
    const now=Date.now();
    const id=randomHex(16).toUpperCase();
    const details={device:prev.device,os:prev.os,browser:prev.browser};
    try {
      const token=await fakeJwt(prev.platform,details,now,id,now+3600000);
      const record={...prev,id,token,created:now,expires:now+3600000};
      history.unshift(record);history=history.slice(0,100);
      setStore('localStorage',DATA_KEY,JSON.stringify(history));
      renderHistory();
      await showDetails(record);
      notify('Новый токен создан для того же тестового устройства');
    } catch {notify('Нельзя создать токен в этом браузере');}
  });
  byId('copyDetailToken')?.addEventListener('click',async () => {
    if (currentToken) notify(await copyString(currentToken) ? 'Токен скопирован' : 'Не удалось скопировать');
  });
  renderHistory(); renderLastLink();
})();
