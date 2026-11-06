// Спортпитник: каталог, поиск, листы, заказ в WhatsApp. Данные: js/tovary-*.js (tools/sobrat.py).
// Заказ хранится в браузере покупателя (localStorage «sp-zakaz»). Цен нет: цену называет магазин в чате.
(function () {
  'use strict';
  var NOMER = '79667294506'; // WhatsApp Муслима для заказов (решение автора 2026-11-06)
  var RAZDELY = window.SP_RAZDELY || [];
  var TOVARY = (window.SP || []).map(function (t) {
    return { id: t[0], r: t[1], brend: t[2], imya: t[3], vkusy: t[4].length ? t[4] : [''] };
  });
  var PO_ID = {};
  TOVARY.forEach(function (t, i) { t.n = i; PO_ID[t.id] = t; });

  // Слова поиска: русское слово находит латинские названия
  var SLOVA = {
    'протеин': 'whey protein isolate casein iso', 'белок': 'whey protein', 'гейнер': 'mass gainer',
    'креатин': 'creatine crea', 'амино': 'bcaa eaa amino', 'бцаа': 'bcaa', 'глютамин': 'glutamine gluta',
    'карнитин': 'carnitine', 'кофеин': 'caffeine', 'предтрен': 'pump pre-workout pwo', 'витамин': 'vitamin',
    'магний': 'magnesium', 'цинк': 'zinc', 'омега': 'omega', 'коллаген': 'collagen', 'железо': 'iron ferr',
    'кальций': 'calcium', 'батончик': 'bar', 'шейкер': 'shaker', 'жиросжигат': 'burn carnitine cla',
    'суставы': 'joint flex collagen', 'мелатонин': 'melatonin', 'ашваганда': 'ashwagandha',
    'ваниль': 'vanilla', 'шоколад': 'chocolate', 'клубника': 'strawberry', 'банан': 'banana'
  };

  var zakaz = chitat('sp-zakaz', {});
  var tekushiy = null; // товар в листе
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function chitat(k, def) { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } }
  function pisat(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* без памяти браузера тоже работает */ } }
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function ico(id) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'ico'); s.innerHTML = '<use href="#' + id + '"/>'; return s; }
  function klyuch(t, v) { return t.id + '|' + v; }
  function skolko(t) { return t.vkusy.reduce(function (s, v) { return s + (zakaz[klyuch(t, v)] || 0); }, 0); }
  function vkusov(n) { var d = n % 10, s = n % 100; return n + ' ' + (d === 1 && s !== 11 ? 'вкус' : d >= 2 && d <= 4 && (s < 10 || s >= 20) ? 'вкуса' : 'вкусов'); }
  function polnoe(t) { return (t.brend ? t.brend + ' ' : '') + t.imya; }

  // Заказ без товаров, которых больше нет в прайсе
  Object.keys(zakaz).forEach(function (k) {
    var t = PO_ID[k.split('|')[0]];
    if (!t || t.vkusy.indexOf(k.slice(k.indexOf('|') + 1)) < 0 || !(zakaz[k] > 0)) delete zakaz[k];
  });

  // Список товаров по разделам
  var spisok = $('#spisok'), lenta = $('#lenta'), stroki = {};
  RAZDELY.forEach(function (imya, r) {
    var svoi = TOVARY.filter(function (t) { return t.r === r; });
    if (!svoi.length) return;
    var blok = h('section', 'razdel-blok'); blok.id = 'r' + r;
    blok.appendChild(h('h2', 'h2', imya));
    var ul = h('ul', 'tovary-spisok');
    svoi.forEach(function (t) {
      var li = h('li'), b = h('button', 'stroka'), tx = h('span', 'stroka-tekst');
      b.type = 'button'; b.dataset.id = t.id;
      if (t.brend) tx.appendChild(h('span', 'podpis', t.brend));
      tx.appendChild(h('span', 'stroka-imya', t.imya));
      tx.appendChild(h('span', 'podpis', t.vkusy.length > 1 ? vkusov(t.vkusy.length) : t.vkusy[0]));
      b.appendChild(tx); b.appendChild(h('span', 'stroka-metka'));
      li.appendChild(b); ul.appendChild(li);
      t.poisk = (polnoe(t) + ' ' + t.vkusy.join(' ') + ' ' + imya).toLowerCase();
      stroki[t.id] = li;
    });
    blok.appendChild(ul); spisok.appendChild(blok);
    var chip = h('button', 'razdel', imya); chip.type = 'button'; chip.dataset.r = r;
    lenta.appendChild(chip);
    var pr = h('li'), pb = h('button'); pb.type = 'button'; pb.dataset.r = r;
    pb.appendChild(document.createTextNode(imya)); pb.appendChild(h('span', '', String(svoi.length))); pb.appendChild(ico('i-dalee'));
    pr.appendChild(pb); $('#razdely-spisok').appendChild(pr);
  });

  function metka(t) {
    var m = stroki[t.id].querySelector('.stroka-metka'), n = skolko(t);
    m.textContent = n ? 'В заказе ' + n : 'Выбрать';
    m.classList.toggle('est', n > 0);
  }

  function itogi() {
    var n = Object.keys(zakaz).reduce(function (s, k) { return s + zakaz[k]; }, 0);
    $$('[data-chislo]').forEach(function (e) { e.textContent = n; });
    $$('[data-metka]').forEach(function (e) { e.textContent = n; e.hidden = !n; });
    pisat('sp-zakaz', zakaz);
    return n;
  }

  function pomenyat(t, v, d) {
    var k = klyuch(t, v), q = Math.max(0, Math.min(99, (zakaz[k] || 0) + d));
    if (q) zakaz[k] = q; else delete zakaz[k];
    metka(t); itogi();
    if (tekushiy) risovatTovar();
    if ($('#list-zakaz').open) risovatZakaz();
  }

  // Строка «вкус + кнопка или счётчик»
  function vkusStroka(t, v, podpis) {
    var li = h('li', 'vkus'), q = zakaz[klyuch(t, v)] || 0, im = h('span', 'vkus-imya', podpis.imya);
    if (podpis.mel) im.appendChild(h('small', '', podpis.mel));
    li.appendChild(im);
    if (!q) {
      var b = h('button', 'knopka knopka-vtoraya', 'В заказ'); b.type = 'button';
      b.onclick = function () { pomenyat(t, v, 1); };
      li.appendChild(b);
    } else {
      var s = h('div', 'schyot'), minus = h('button', '', '−'), plus = h('button', '', '+'), o = h('output', '', String(q));
      minus.type = plus.type = 'button';
      minus.setAttribute('aria-label', 'Меньше'); plus.setAttribute('aria-label', 'Больше');
      minus.onclick = function () { pomenyat(t, v, -1); };
      plus.onclick = function () { pomenyat(t, v, 1); };
      s.appendChild(minus); s.appendChild(o); s.appendChild(plus); li.appendChild(s);
    }
    return li;
  }

  function risovatTovar() {
    var t = tekushiy, ul = $('#tovar-vkusy');
    $('#tovar-brend').textContent = t.brend;
    $('#tovar-imya').textContent = t.imya;
    $('#tovar-podskazka').textContent = t.vkusy.length > 1 ? 'Выберите вкус и количество' : '';
    ul.textContent = '';
    t.vkusy.forEach(function (v) { ul.appendChild(vkusStroka(t, v, { imya: v || 'Количество' })); });
  }

  function poryadok() {
    return TOVARY.filter(function (t) { return skolko(t); }).sort(function (a, b) { return a.r - b.r || a.n - b.n; });
  }

  function tekstZakaza() {
    var s = ['Ассаламу алейкум. Заказ из каталога Спортпитник:'], n = 0;
    poryadok().forEach(function (t) {
      t.vkusy.forEach(function (v) {
        var q = zakaz[klyuch(t, v)];
        if (q) s.push(++n + '. ' + polnoe(t) + (v ? ', вкус ' + v : '') + ': ' + q + ' шт.');
      });
    });
    s.push('', 'Подскажите, пожалуйста, цену и наличие.');
    var imya = $('#imya').value.trim();
    if (imya) s.push('Имя: ' + imya);
    return s.join('\n');
  }

  function risovatZakaz() {
    var ul = $('#zakaz-spisok'), est = itogi() > 0;
    ul.textContent = '';
    poryadok().forEach(function (t) {
      t.vkusy.forEach(function (v) {
        if (zakaz[klyuch(t, v)]) ul.appendChild(vkusStroka(t, v, { imya: polnoe(t), mel: v }));
      });
    });
    $('#zakaz-pusto').hidden = est;
    $('#zakaz-niz').hidden = !est;
    var a = $('#otpravit');
    a.href = 'https://wa.me/' + NOMER + '?text=' + encodeURIComponent(tekstZakaza());
    a.setAttribute('aria-disabled', String(!est));
  }

  // Листы: «назад» на телефоне закрывает лист
  function otkryt(imya) {
    var d = $('#list-' + imya);
    $$('dialog[open]').forEach(function (o) { o.close(); });
    if (imya === 'zakaz') risovatZakaz();
    d.showModal();
    d.scrollTop = 0;
    if (!(history.state && history.state.list)) history.pushState({ list: imya }, '');
    else history.replaceState({ list: imya }, '');
  }
  function zakryt() {
    if (history.state && history.state.list) history.back();
    else $$('dialog[open]').forEach(function (o) { o.close(); });
  }
  window.addEventListener('popstate', function () {
    $$('dialog[open]').forEach(function (o) { o.close(); });
  });
  $$('dialog').forEach(function (d) {
    d.addEventListener('close', function () { if (d.id === 'list-tovar') tekushiy = null; });
    d.addEventListener('cancel', function (e) { e.preventDefault(); zakryt(); });
    d.addEventListener('click', function (e) { if (e.target === d) zakryt(); });
  });
  $$('[data-zakryt]').forEach(function (b) { b.onclick = zakryt; });
  $$('[data-otkryt]').forEach(function (b) { b.onclick = function () { otkryt(b.dataset.otkryt); }; });

  spisok.addEventListener('click', function (e) {
    var b = e.target.closest('.stroka');
    if (!b) return;
    tekushiy = PO_ID[b.dataset.id];
    risovatTovar();
    otkryt('tovar');
  });

  // Разделы: лента и лист
  function kRazdelu(r) {
    var blok = document.getElementById('r' + r);
    if (blok) blok.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  lenta.addEventListener('click', function (e) { var b = e.target.closest('[data-r]'); if (b) kRazdelu(b.dataset.r); });
  $('#razdely-spisok').addEventListener('click', function (e) {
    var b = e.target.closest('[data-r]');
    if (!b) return;
    var r = b.dataset.r;
    zakryt();
    setTimeout(function () { kRazdelu(r); }, 60);
  });
  if ('IntersectionObserver' in window) {
    var nabl = new IntersectionObserver(function (zapisi) {
      zapisi.forEach(function (z) {
        if (!z.isIntersecting) return;
        var r = z.target.id.slice(1);
        $$('#lenta [data-r]').forEach(function (c) {
          var da = c.dataset.r === r;
          c.setAttribute('aria-pressed', String(da));
          if (da) lenta.scrollTo({ left: c.offsetLeft - 16, behavior: 'smooth' });
        });
      });
    }, { rootMargin: '-140px 0px -70% 0px' });
    $$('.razdel-blok').forEach(function (b) { nabl.observe(b); });
  }

  // Поиск
  function iskat(q) {
    var slova = q.toLowerCase().replace(/ё/g, 'е').split(/\s+/).filter(Boolean), vsego = 0;
    TOVARY.forEach(function (t) {
      var da = slova.every(function (s) {
        if (t.poisk.indexOf(s) >= 0) return true;
        return Object.keys(SLOVA).some(function (ru) {
          return (ru.indexOf(s) === 0 || s.indexOf(ru) === 0) && SLOVA[ru].split(' ').some(function (en) { return t.poisk.indexOf(en) >= 0; });
        });
      });
      stroki[t.id].hidden = !da;
      if (da) vsego++;
    });
    $$('.razdel-blok').forEach(function (b) { b.hidden = !b.querySelector('li:not([hidden])'); });
    $('#pusto').hidden = vsego > 0;
  }
  $$('[data-poisk]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      $$('[data-poisk]').forEach(function (o) { if (o !== inp) o.value = inp.value; });
      iskat(inp.value);
    });
  });
  $('[data-poisk-knopka]').onclick = function () {
    window.scrollTo({ top: 0 });
    $('#poisk').focus();
  };

  // Имя и отправка
  var imyaPole = $('#imya');
  imyaPole.value = chitat('sp-imya', '');
  imyaPole.addEventListener('input', function () { pisat('sp-imya', imyaPole.value); risovatZakaz(); });
  var ochistit = $('#ochistit'), zhdat = 0;
  ochistit.onclick = function () {
    if (!zhdat) {
      ochistit.textContent = 'Нажмите ещё раз, чтобы очистить';
      zhdat = setTimeout(function () { zhdat = 0; ochistit.textContent = 'Очистить заказ'; }, 3000);
      return;
    }
    clearTimeout(zhdat); zhdat = 0; ochistit.textContent = 'Очистить заказ';
    zakaz = {};
    TOVARY.forEach(metka);
    risovatZakaz();
  };

  TOVARY.forEach(metka);
  itogi();
})();
