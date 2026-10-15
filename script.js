(function () {
  'use strict';

  // Шапка: прозрачная над видео, белая после прокрутки
  var header = document.getElementById('header');
  var hero = document.getElementById('top');
  var mobileCta = document.getElementById('mobile-cta');
  var formSection = document.getElementById('form');

  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-solid', y > 40);
    var pastHero = y > hero.offsetHeight - 200;
    var nearForm = formSection.getBoundingClientRect().top < window.innerHeight;
    mobileCta.classList.toggle('is-shown', pastHero && !nearForm);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Мобильное меню
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  // Видео: тихий автоплей, без ошибок на iOS
  var video = document.querySelector('.hero__media');
  if (video) {
    video.muted = true;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  // Данные опроса дилеров
  var rows = [
    ['Персональный менеджер', 'Поможет с подбором, расчётами и заказами', 85],
    ['Качество станций', 'Продаёте оборудование, в котором уверены', 81],
    ['Быстрая отгрузка', 'Быстрее получаете станцию для монтажа', 78],
    ['Гарантийная поддержка', 'Решаете проблему клиента вместе с заводом', 67],
    ['Наличие складов', 'Заказываете оборудование из готового запаса', 63],
    ['Известный бренд', 'Предлагаете марку, которую клиент уже может знать', 56],
    ['Обучение', 'Готовите сотрудников к продажам и монтажу', 52],
    ['Широкий модельный ряд', 'Подбираете станции под разные объекты и бюджеты', 52],
    ['Маркетинговые материалы', 'Используете готовые материалы для продвижения', 41],
    ['Помощь с нестандартными объектами', 'Берёте сложные заказы с поддержкой производителя', 37]
  ];
  var bars = document.getElementById('bars');
  bars.innerHTML = rows.map(function (r) {
    return '<li><span class="bars__title">' + r[0] + '</span>' +
      '<span class="bars__pct">' + r[2] + '%</span>' +
      '<span class="bars__text">' + r[1] + '</span>' +
      '<span class="bars__track"><span class="bars__fill" style="--w:' + r[2] + '%"></span></span></li>';
  }).join('');

  // График бренда: столбики растут, числа набираются, затем появляются проценты
  var chart = document.querySelector('.chart');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  var chartVals = chart.querySelectorAll('[data-to]');
  if (!reduceMotion) chartVals.forEach(function (el) { el.textContent = '0'; });

  var chartStarted = false;
  function runChart() {
    if (chartStarted) return;
    chartStarted = true;
    if (reduceMotion) { chart.classList.add('is-counting', 'is-done'); return; }
    chart.classList.add('is-counting');
    var start = null, dur = 1400;
    function tick(t) {
      if (!start) start = t;
      var k = Math.min((t - start) / dur, 1);
      var e = 1 - Math.pow(1 - k, 3);
      chartVals.forEach(function (el) { el.textContent = fmt(Math.round(+el.dataset.to * e)); });
      if (k < 1) requestAnimationFrame(tick);
      else chart.classList.add('is-done');
    }
    requestAnimationFrame(tick);
  }

  // Иконки станций в карточках дохода: сколько станций — столько иконок
  document.querySelectorAll('.tier[data-count]').forEach(function (tier) {
    var n = +tier.dataset.count, html = '';
    for (var i = 0; i < n; i++) html += '<svg style="--i:' + i + '"><use href="#i-station"/></svg>';
    var box = document.createElement('span');
    box.className = 'tier__icons';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = html;
    tier.querySelector('.tier__qty').appendChild(box);
  });

  // Появление блоков при прокрутке
  var targets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          if (en.target === chart) setTimeout(runChart, 300);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    runChart();
  }

  // Страховка: если наблюдатель не сработал (старые браузеры, встроенные браузеры мессенджеров),
  // показываем блок, как только он оказался на экране
  function revealFallback() {
    var vh = window.innerHeight;
    targets.forEach(function (el) {
      if (el.classList.contains('is-visible')) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.95 && r.bottom > 0) {
        el.classList.add('is-visible');
        if (el === chart) setTimeout(runChart, 300);
      }
    });
  }
  window.addEventListener('scroll', revealFallback, { passive: true });
  window.addEventListener('load', revealFallback);
  setTimeout(revealFallback, 1500);

  // Видео в карточке материалов играет, только когда видно на экране
  var matVideo = document.querySelector('.mat__video');
  if (matVideo && 'IntersectionObserver' in window && !reduceMotion) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { var pr = matVideo.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else matVideo.pause();
      });
    }, { threshold: 0.25 }).observe(matVideo);
  }

  // Интерактивная карта: координаты точек в пикселях исходной картинки 1260×1120
  var MAP_W = 1260, MAP_H = 1120;
  var LABELS = { prod: 'Производство Евролос', stock: 'Склад быстрой отгрузки', dealer: 'Официальные дилеры Евролос' };
  var points = [
    { name: 'Москва и Московская область', x: 292, y: 349, items: [['prod', 'Производство — Истра'], ['prod', 'Производство — Бронницы'], ['stock', 'Склад — Истра'], ['stock', 'Склад — Бронницы']], note: 'Центральное производство и логистический центр' },
    { name: 'Санкт-Петербург', x: 327, y: 166, items: [['stock']] },
    { name: 'Ярославль', x: 309, y: 277, items: [['stock']] },
    { name: 'Казань', x: 444, y: 510, items: [['stock']] },
    { name: 'Екатеринбург', x: 636, y: 527, items: [['prod'], ['stock']] },
    { name: 'Краснодар', x: 88, y: 549, items: [['prod'], ['stock']] },
    { name: 'Тюмень', x: 714, y: 602, items: [['stock']] },
    { name: 'Новосибирск', x: 858, y: 699, items: [['stock']] },
    { name: 'Бишкек, Кыргызстан', x: 696, y: 1045, items: [['prod'], ['stock']], note: 'В 240 км от Алматы, отгрузки внутри ЕАЭС' },
    { name: 'Казахстан', x: 554, y: 770, items: [['dealer']], note: 'Ищем дилеров — оставьте заявку' },
    { name: 'Беларусь', x: 150, y: 256, items: [['dealer']] },
    { name: 'Узбекистан', x: 465, y: 898, items: [['dealer']] },
    { name: 'Грузия', x: 78, y: 727, items: [['dealer']] },
    { name: 'Монголия', x: 1224, y: 1001, items: [['dealer']] }
  ];

  var map = document.getElementById('map');
  var tip = document.getElementById('map-tip');
  var activePt = null;

  points.forEach(function (p) {
    var types = p.items.map(function (i) { return i[0]; });
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'map__pt';
    btn.style.left = (p.x / MAP_W * 100) + '%';
    btn.style.top = (p.y / MAP_H * 100) + '%';
    btn.dataset.type = types.filter(function (t, i) { return types.indexOf(t) === i; }).join(' ');
    btn.setAttribute('aria-label', p.name + ': ' + p.items.map(function (i) { return i[1] || LABELS[i[0]]; }).join(', '));
    btn._data = p;
    btn.addEventListener('mouseenter', function () { showTip(btn); });
    btn.addEventListener('focus', function () { showTip(btn); });
    btn.addEventListener('mouseleave', hideTip);
    btn.addEventListener('blur', hideTip);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      showTip(btn);
    });
    map.appendChild(btn);
  });

  function showTip(btn) {
    var p = btn._data;
    if (activePt) activePt.classList.remove('is-on');
    activePt = btn;
    btn.classList.add('is-on');
    tip.innerHTML = '<strong>' + p.name + '</strong><ul>' +
      p.items.map(function (i) { return '<li class="t-' + i[0] + '">' + (i[1] || LABELS[i[0]]) + '</li>'; }).join('') +
      '</ul>' + (p.note ? '<small>' + p.note + '</small>' : '');
    tip.hidden = false;
    // держим подсказку в границах карты
    var mw = map.clientWidth, tw = tip.offsetWidth, half = tw / 2 + 8;
    var left = Math.max(half, Math.min(mw - half, p.x / MAP_W * mw));
    tip.style.left = left + 'px';
    tip.style.top = (p.y / MAP_H * 100) + '%';
    tip.classList.toggle('is-below', p.y / MAP_H * map.clientHeight < tip.offsetHeight + 30);
  }
  function hideTip() {
    tip.hidden = true;
    if (activePt) activePt.classList.remove('is-on');
    activePt = null;
  }
  document.addEventListener('click', function (e) { if (!map.contains(e.target)) hideTip(); });

  // Подсветка точек при наведении на цифры слева
  document.querySelectorAll('.scale__stats [data-filter]').forEach(function (li) {
    function on() {
      map.classList.add('is-filtered');
      map.dataset.f = li.dataset.filter;
      li.classList.add('is-active');
      map.querySelectorAll('.map__pt').forEach(function (pt) {
        pt.classList.toggle('is-match', pt.dataset.type.split(' ').indexOf(li.dataset.filter) > -1);
      });
    }
    function off() {
      map.classList.remove('is-filtered');
      li.classList.remove('is-active');
    }
    li.addEventListener('mouseenter', on);
    li.addEventListener('focus', on);
    li.addEventListener('mouseleave', off);
    li.addEventListener('blur', off);
    li.addEventListener('click', function () { li.classList.contains('is-active') ? off() : on(); });
  });

  // Переключатель валюты
  var income = document.getElementById('income');
  var toggles = income.querySelectorAll('.toggle__btn');
  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cur = btn.dataset.cur;
      if (btn.classList.contains('is-active')) return;
      toggles.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      income.classList.add('is-switching');
      setTimeout(function () {
        income.classList.toggle('is-kzt', cur === 'kzt');
        income.querySelectorAll('[data-usd]').forEach(function (el) {
          el.textContent = el.dataset[cur];
        });
        income.classList.remove('is-switching');
      }, 180);
    });
  });

  // Маска телефона +7 (XXX) XXX-XX-XX
  function maskPhone(input) {
    input.addEventListener('input', function () {
      var d = input.value.replace(/\D/g, '');
      if (!d) { input.value = ''; return; }
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (!d.startsWith('7')) d = '7' + d;
      d = d.slice(0, 11);
      var out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 4) out += ') ' + d.slice(4, 7);
      if (d.length >= 7) out += '-' + d.slice(7, 9);
      if (d.length >= 9) out += '-' + d.slice(9, 11);
      input.value = out;
    });
  }

  // Формы заявки: внизу страницы и во всплывающем окне (отправку на сервер/CRM подключить в submit)
  function initLead(root) {
    var form = root.querySelector('.lead-form');
    var done = root.querySelector('.form-done');
    var error = root.querySelector('.form__error');
    var phone = form.elements.phone;
    maskPhone(phone);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      [].forEach.call(form.querySelectorAll('input[type=text][required]'), function (el) {
        var bad = el.value.trim().length < 2;
        el.classList.toggle('is-invalid', bad);
        if (bad) ok = false;
      });
      var phoneBad = phone.value.replace(/\D/g, '').length < 11;
      phone.classList.toggle('is-invalid', phoneBad);
      if (phoneBad) ok = false;
      var consent = form.elements.consent;
      consent.closest('.consent').classList.toggle('is-invalid', !consent.checked);
      if (!consent.checked) ok = false;

      error.hidden = ok;
      if (!ok) {
        var first = form.querySelector('.is-invalid input, input.is-invalid');
        if (first) first.focus();
        return;
      }
      form.hidden = true;
      done.hidden = false;
      root.classList.add('is-sent');
    });

    form.addEventListener('input', function (e) {
      if (e.target.classList.contains('is-invalid')) e.target.classList.remove('is-invalid');
      if (e.target.name === 'consent') e.target.closest('.consent').classList.remove('is-invalid');
    });

    root.querySelector('.form-reset').addEventListener('click', function () {
      form.reset();
      error.hidden = true;
      done.hidden = true;
      form.hidden = false;
      root.classList.remove('is-sent');
    });
  }
  document.querySelectorAll('[data-lead]').forEach(initLead);

  // Всплывающая форма по кнопкам «Стать дилером»
  var modal = document.getElementById('lead-modal');
  var lastFocus = null;
  function openModal() {
    lastFocus = document.activeElement;
    setMenu(false);
    modal.hidden = false;
    document.documentElement.classList.add('modal-open');
    requestAnimationFrame(function () { modal.classList.add('is-open'); });
    setTimeout(function () {
      var first = modal.querySelector('input:not([type=checkbox])');
      if (first && !modal.querySelector('[data-lead]').classList.contains('is-sent')) first.focus({ preventScroll: true });
    }, 250);
  }
  function closeModal() {
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('modal-open');
    setTimeout(function () { modal.hidden = true; }, 250);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  document.querySelectorAll('a[href="#form"]').forEach(function (btn) {
    btn.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
  });
  modal.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', closeModal); });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      var f = [].filter.call(modal.querySelectorAll('button, input, a[href]'), function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
})();
