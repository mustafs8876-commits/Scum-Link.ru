const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer:fine)').matches;

const toast = $('#toast');
let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('show');
  // restart spring animation if a second toast appears quickly
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

const menuBtn = $('#menuBtn');
const mobileNav = $('#mobileNav');
if (menuBtn && mobileNav) {
  menuBtn.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('a,button', mobileNav).forEach(el => el.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));
}

const modal = $('#keyModal');
function openModal() {
  modal?.classList.add('open');
  modal?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow='hidden';
  setTimeout(() => $('#activationKey')?.focus(), reduceMotion ? 0 : 220);
}
function closeModal() {
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow='';
}
$$('[data-open-key]').forEach(el => el.addEventListener('click', openModal));
$$('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closePaymentMethodModal?.(); closeTelegramPayModal?.(); closeActivationError?.(); } });

$('#activateForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const value = $('#activationKey')?.value.trim();
  if (!value) return showToast('Введите демонстрационный ключ.');
  showToast('Ошибка активации');
});

$$('[data-demo-action]').forEach(el => el.addEventListener('click', e => {
  if (el.tagName === 'A' && el.getAttribute('href')?.startsWith('#')) return;
  e.preventDefault();
  showToast('Это безопасная визуальная реконструкция. Внешнее действие отключено.');
}));

let pendingTariff = 'extra';

const tariffDetails = {
  extra: {
    name: '∞ EXTRA',
    rub: '1500₽',
    gold: '2998G',
    term: 'Пожизненный доступ',
    feature: 'Пожизненный доступ'
  },
  week: {
    name: 'Неделя',
    rub: '1198₽',
    gold: '2398G',
    term: 'Недельный доступ',
    feature: 'Доступ на 7 дней'
  },
  days3: {
    name: '3 дня',
    rub: '998₽',
    gold: '1998G',
    term: 'Доступ на 3 дня',
    feature: 'Доступ на 3 дня'
  }
};

function openPaymentMethodModal(plan = 'extra') {
  pendingTariff = plan || 'extra';
  const methodModal = $('#paymentMethodModal');
  if (!methodModal) return;
  methodModal.classList.add('open');
  methodModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closePaymentMethodModal() {
  const methodModal = $('#paymentMethodModal');
  methodModal?.classList.remove('open');
  methodModal?.setAttribute('aria-hidden', 'true');
  if (!$('#telegramPayModal')?.classList.contains('open') && !modal?.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

function openTelegramPayModal(plan = pendingTariff) {
  pendingTariff = plan || pendingTariff || 'extra';
  const details = tariffDetails[pendingTariff] || tariffDetails.extra;
  const payModal = $('#telegramPayModal');
  if (!payModal) return;

  $('#telegramTariffName') && ($('#telegramTariffName').textContent = details.name);
  $('#telegramTariffPrice') && ($('#telegramTariffPrice').textContent = details.gold);
  $('#telegramTariffTerm') && ($('#telegramTariffTerm').textContent = details.term);
  $('#telegramTariffIcon') && ($('#telegramTariffIcon').textContent = 'G');
  $('#goldFeatureAccess') && ($('#goldFeatureAccess').textContent = details.feature || details.term);

  payModal.classList.add('open');
  payModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeTelegramPayModal() {
  const payModal = $('#telegramPayModal');
  payModal?.classList.remove('open');
  payModal?.setAttribute('aria-hidden', 'true');
  if (!$('#paymentMethodModal')?.classList.contains('open') && !modal?.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

/* Любой выбор тарифа сначала открывает выбор способа оплаты. */
$$('[data-plan]').forEach(el => el.addEventListener('click', () => {
  openPaymentMethodModal(el.dataset.plan || 'extra');
}));

$$('[data-open-payment-method]').forEach(el => el.addEventListener('click', () => {
  openPaymentMethodModal(el.dataset.tariff || pendingTariff || 'extra');
}));

$$('[data-close-payment-method]').forEach(el => el.addEventListener('click', closePaymentMethodModal));
$$('[data-close-telegram-pay]').forEach(el => el.addEventListener('click', closeTelegramPayModal));

$('#paymentMethodModal')?.addEventListener('click', e => {
  if (e.target?.id === 'paymentMethodModal') closePaymentMethodModal();
});

$('#telegramPayModal')?.addEventListener('click', e => {
  if (e.target?.id === 'telegramPayModal') closeTelegramPayModal();
});

/* Рубли и Другое идут на свои страницы. Голда — единственный вариант, который открывает Telegram-блок. */
$$('[data-payment-method]').forEach(el => el.addEventListener('click', e => {
  const method = el.dataset.paymentMethod;

  if (method === 'gold') {
    e.preventDefault();
    closePaymentMethodModal();
    window.setTimeout(() => openTelegramPayModal(pendingTariff), 120);
    return;
  }

  if (el.tagName === 'A') {
    e.preventDefault();
    const base = el.getAttribute('href') || 'payment-rub.html';
    window.location.href = `${base}?tariff=${encodeURIComponent(pendingTariff)}`;
  }
}));


$$('[data-back-to-payment-method]').forEach(el => el.addEventListener('click', () => {
  closeTelegramPayModal();
  window.setTimeout(() => openPaymentMethodModal(pendingTariff), 120);
}));

const copyBtn = $('#copyDemoCard');
copyBtn?.addEventListener('click', async () => {
  const value = '0000 0000 0000 0000';
  try { await navigator.clipboard.writeText(value); } catch {}
  copyBtn.animate?.([
    { transform: 'scale(1) rotate(0deg)' },
    { transform: 'scale(.88) rotate(-7deg)' },
    { transform: 'scale(1.06) rotate(2deg)' },
    { transform: 'scale(1) rotate(0deg)' }
  ], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1)' });
  showToast('Скопировано');
});

const sticky = $('#stickyBuy');
function updateSticky() {
  if (!sticky) return;
  const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 260;
  sticky.classList.toggle('hidden', atBottom);
}
window.addEventListener('scroll', updateSticky, {passive:true});
updateSticky();

$('#scrollTop')?.addEventListener('click', () => window.scrollTo({top:0,behavior: reduceMotion ? 'auto' : 'smooth'}));

const params = new URLSearchParams(location.search);
const tariff = params.get('tariff');
if (tariff) {
  const map = {
    extra: ['EXTRA (Навсегда)', '1500₽'],
    week: ['Неделя', '1198₽'],
    days3: ['3 дня', '998₽']
  };
  const [name, price] = map[tariff] || map.extra;
  const planName = $('#selectedPlan');
  const planPrice = $('#selectedPrice');
  if (planName) planName.textContent = name;
  if (planPrice) planPrice.textContent = price;
}

/* ---------------------------------------------------------
   Ambient scene + progress. Added entirely by JS so markup
   stays clean and every page receives the same visual system.
   --------------------------------------------------------- */
function buildAmbientScene() {
  if (reduceMotion) return;

  const stage = document.createElement('div');
  stage.className = 'fx-stage';
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = `
    <div class="fx-orb fx-orb--1"></div>
    <div class="fx-orb fx-orb--2"></div>
    <div class="fx-orb fx-orb--3"></div>
    <div class="fx-mesh"></div>
    <div class="fx-grain"></div>`;
  document.body.prepend(stage);

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  if (finePointer) {
    const aura = document.createElement('div');
    aura.className = 'cursor-aura';
    aura.setAttribute('aria-hidden', 'true');
    document.body.append(aura);

    let targetX = innerWidth / 2, targetY = innerHeight / 3;
    let currentX = targetX, currentY = targetY;
    document.addEventListener('pointermove', e => {
      targetX = e.clientX;
      targetY = e.clientY;
      aura.classList.add('is-active');
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
      document.documentElement.style.setProperty('--my', `${e.clientY}px`);
    }, {passive:true});
    document.addEventListener('pointerleave', () => aura.classList.remove('is-active'));

    const follow = () => {
      currentX += (targetX - currentX) * .12;
      currentY += (targetY - currentY) * .12;
      aura.style.transform = `translate3d(${currentX}px,${currentY}px,0)`;
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
  }
}
buildAmbientScene();

/* Spark particles are intentionally sparse so the interface stays premium. */
function addHeroSparks() {
  if (reduceMotion) return;
  const heroContent = $('.hero__content');
  if (!heroContent) return;
  const field = document.createElement('div');
  field.className = 'spark-field';
  field.setAttribute('aria-hidden', 'true');
  const count = finePointer ? 18 : 10;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('i');
    s.className = 'spark';
    s.style.left = `${5 + Math.random() * 90}%`;
    s.style.top = `${18 + Math.random() * 78}%`;
    s.style.setProperty('--spark-size', `${1.5 + Math.random() * 2.5}px`);
    s.style.setProperty('--spark-speed', `${6.5 + Math.random() * 7}s`);
    s.style.setProperty('--spark-delay', `${-Math.random() * 10}s`);
    s.style.setProperty('--spark-drift', `${-45 + Math.random() * 90}px`);
    field.append(s);
  }
  heroContent.prepend(field);
}
addHeroSparks();

/* Reveal system with mixed directions, blur and section-local staggering. */
const revealTargets = [
  ...$$('.section-title'),
  ...$$('.step'),
  ...$$('.plan'),
  ...$$('.feature'),
  ...$$('.quote'),
  ...$$('.process__item'),
  ...$$('.info-box'),
  ...$$('.welcome-card'),
  ...$$('.pay-title'),
  ...$$('.summary'),
  ...$$('.checkout')
];

revealTargets.forEach((el, index) => {
  const variants = ['reveal-left', 'reveal-pop', 'reveal-right', 'reveal-pop'];
  el.classList.add('reveal', variants[index % variants.length], `reveal-delay-${(index % 4) + 1}`);
});

if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
  revealTargets.forEach(el => observer.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('is-visible'));
}

/* Pointer-driven glass lens on cards. */
const reactiveCards = $$('.plan, .feature, .step__card, .quote, .welcome-card, .checkout, .summary, .info-box, .pay-title, .price-box, .card-demo');
reactiveCards.forEach(card => card.classList.add('glass-reactive'));

if (finePointer && !reduceMotion) {
  reactiveCards.forEach(card => {
    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--spot-x', `${x}%`);
      card.style.setProperty('--spot-y', `${y}%`);
    }, {passive:true});
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--spot-x', '50%');
      card.style.setProperty('--spot-y', '20%');
    });
  });

  /* Magnetic buttons: small travel only, preserving usability. */
  $$('.btn').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const rect = btn.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      btn.style.setProperty('--mag-x', `${dx * .075}px`);
      btn.style.setProperty('--mag-y', `${dy * .10}px`);
    }, {passive:true});
    btn.addEventListener('pointerleave', () => {
      btn.style.setProperty('--mag-x', '0px');
      btn.style.setProperty('--mag-y', '0px');
    });
  });

  /* Hero pointer parallax is deliberately tiny to avoid motion sickness. */
  const hero = $('.hero');
  const heroContent = $('.hero__content');
  hero?.addEventListener('pointermove', e => {
    if (!heroContent) return;
    const rect = hero.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - .5;
    const ny = (e.clientY - rect.top) / rect.height - .5;
    heroContent.style.setProperty('--hero-x', `${nx * 8}px`);
    heroContent.style.setProperty('--hero-y', `${ny * 6}px`);
  }, {passive:true});
  hero?.addEventListener('pointerleave', () => {
    heroContent?.style.setProperty('--hero-x', '0px');
    heroContent?.style.setProperty('--hero-y', '0px');
  });
}

/* Scroll-driven details: progress, glass header, very mild background parallax. */
let scrollTicking = false;
function updateScrollEffects() {
  scrollTicking = false;
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const progress = Math.min(1, Math.max(0, scrollY / max));
  document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(4));
  $('.header')?.classList.toggle('is-scrolled', scrollY > 18);

  if (!reduceMotion) {
    const stage = $('.fx-stage');
    if (stage) stage.style.transform = `translate3d(0,${Math.min(38, scrollY * .018)}px,0)`;
  }
}
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(updateScrollEffects);
    scrollTicking = true;
  }
}, {passive:true});
updateScrollEffects();

/* A tiny entrance animation for the whole page after CSS has loaded. */
if (!reduceMotion) {
  requestAnimationFrame(() => document.documentElement.classList.add('motion-ready'));
}

const activateForm = $('#activateForm');
const activationErrorModal = $('#activationErrorModal');

function openActivationError() {
  activationErrorModal?.classList.add('open');
  activationErrorModal?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeActivationError() {
  activationErrorModal?.classList.remove('open');
  activationErrorModal?.setAttribute('aria-hidden', 'true');
  if (!modal?.classList.contains('open')) document.body.style.overflow = '';
}

activateForm?.addEventListener('submit', e => {
  e.preventDefault();

  const keyInput = $('#activationKey');
  const value = keyInput?.value.trim();

  if (!value) {
    keyInput?.focus();
    return;
  }

  closeModal();
  window.setTimeout(openActivationError, 140);
});

$$('[data-close-activation-error]').forEach(el => {
  el.addEventListener('click', closeActivationError);
});

activationErrorModal?.addEventListener('click', e => {
  if (e.target?.id === 'activationErrorModal') closeActivationError();
});
const copyDemoCard = document.getElementById('copyDemoCard');

copyDemoCard?.addEventListener('click', async () => {
  const cardNumber = copyDemoCard
    .closest('.card-number')
    ?.querySelector('span')
    ?.textContent
    .replace(/\s/g, '')
    .trim();

  if (!cardNumber) return;

  try {
    await navigator.clipboard.writeText(cardNumber);

    const oldText = copyDemoCard.textContent;

    copyDemoCard.textContent = '✓';
    copyDemoCard.title = 'Скопировано';

    setTimeout(() => {
      copyDemoCard.textContent = oldText;
      copyDemoCard.title = 'Скопировать номер карты';
    }, 1500);

  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = cardNumber;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();

    copyDemoCard.textContent = '✓';

    setTimeout(() => {
      copyDemoCard.textContent = '⧉';
    }, 1500);
  }
});

