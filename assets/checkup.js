(function () {
  'use strict';
  var CONFIG = { publicKey: 'sb68otMBGAKsrW3QL', serviceId: 'fcm_gmail', templateId: 'template_r8vh2nx', toEmail: 'commercialistafcm@gmail.com' };
  var form = document.getElementById('cu-form');
  if (!form) return;

  var NEEDS = {
    piva: ['Aprire la partita IVA', 'Scegliere o cambiare regime (forfettario / ordinario)', 'Contabilità e dichiarazioni', 'Cambiare commercialista', 'Capire quante tasse pagherò', 'Altro'],
    societa: ['Contabilità e bilancio', 'Consulenza societaria e operazioni straordinarie', 'Revisione legale / collegio sindacale', 'Controllo di gestione e prevenzione della crisi', 'Cambiare commercialista', 'Sostenibilità e richieste ESG', 'Altro'],
    privato: ['Dichiarazione dei redditi / 730', 'Successioni e donazioni', 'Immobili', 'Pianificazione patrimoniale', 'Altro']
  };
  var PROFILO = { piva: 'Partita IVA', societa: 'Società / impresa', privato: 'Privato' };
  var FASCE = {
    piva: ['Meno di 15.000 €', '15.000 – 30.000 €', '30.000 – 50.000 €', '50.000 – 85.000 €', '85.000 – 100.000 €', 'Oltre 100.000 €', 'Non lo so'],
    societa: ['Meno di 500.000 €', '500.000 € – 2 mln', '2 – 10 mln', 'Oltre 10 mln', 'Non lo so']
  };

  var steps = ['cu1', 'cu2', 'cu3', 'cu4'].map(function (i) { return document.getElementById(i); });
  var cur = 0, profilo = '', sending = false;
  var next = document.getElementById('cu-next'), back = document.getElementById('cu-back');
  var err = document.getElementById('cu-error');

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html) e.textContent = html;
    return e;
  }
  function field(label, node, id) {
    var d = el('div', { 'class': 'f' });
    d.appendChild(el('label', { 'for': id }, label));
    d.appendChild(node);
    return d;
  }
  function select(id, opts, first) {
    var s = el('select', { id: id });
    s.appendChild(el('option', { value: '' }, first || 'Seleziona'));
    opts.forEach(function (o) { s.appendChild(el('option', { value: o }, o)); });
    return s;
  }
  function v(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
  function msg(t) { err.textContent = t || ''; }

  function buildNeeds() {
    var box = document.getElementById('cu-needs');
    box.innerHTML = '';
    NEEDS[profilo].forEach(function (n, i) {
      var l = el('label', { 'class': 'cu-opt' });
      var inp = el('input', { type: 'checkbox', name: 'need', value: n });
      var sp = el('span'); sp.appendChild(el('b', {}, n));
      l.appendChild(inp); l.appendChild(sp); box.appendChild(l);
    });
  }
  function buildContext() {
    var c = document.getElementById('cu-context');
    c.innerHTML = '';
    if (profilo === 'piva') {
      c.appendChild(field('A che punto sei?', select('c-stato', ['Devo ancora aprirla', 'L’ho aperta da meno di un anno', 'Ce l’ho da più di un anno']), 'c-stato'));
      c.appendChild(field('Di cosa ti occupi? (settore o attività)', el('input', { type: 'text', id: 'c-settore', autocomplete: 'off' }), 'c-settore'));
      c.appendChild(field('Fatturato annuo (previsto)', select('c-fatt', FASCE.piva), 'c-fatt'));
    } else if (profilo === 'societa') {
      c.appendChild(field('Forma giuridica', select('c-forma', ['Srl / Srls', 'Spa', 'Snc / Sas', 'Altro / non lo so']), 'c-forma'));
      c.appendChild(field('Settore di attività', el('input', { type: 'text', id: 'c-settore', autocomplete: 'off' }), 'c-settore'));
      c.appendChild(field('Fatturato annuo', select('c-fatt', FASCE.societa), 'c-fatt'));
      c.appendChild(field('Dipendenti', select('c-dip', ['Nessuno', '1 – 9', '10 – 49', '50 o più']), 'c-dip'));
      c.appendChild(field('Avete già un revisore o un collegio sindacale?', select('c-rev', ['Sì', 'No', 'Non lo so']), 'c-rev'));
    } else {
      var t = el('textarea', { id: 'c-libero' });
      c.appendChild(field('Descrivi in breve la situazione', t, 'c-libero'));
    }
  }

  function show(n) {
    cur = n;
    steps.forEach(function (s, i) { s.hidden = i !== n; });
    document.getElementById('cu-fill').style.width = ((n + 1) * 25) + '%';
    document.getElementById('cu-step-label').textContent = 'Passo ' + (n + 1) + ' di 4';
    back.hidden = n === 0;
    next.textContent = n === 3 ? 'Invia la richiesta' : 'Avanti';
    msg('');
    var f = steps[n].querySelector('input,select,textarea');
    if (f && n > 0) f.focus();
    var top = form.getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > top) window.scrollTo(0, top);
  }

  function checked(name) {
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
  }

  function validate() {
    if (cur === 0) {
      var p = checked('profilo')[0];
      if (!p) { msg('Scegli una delle tre opzioni per proseguire.'); return false; }
      if (p !== profilo) { profilo = p; buildNeeds(); buildContext(); }
    } else if (cur === 1) {
      if (!checked('need').length) { msg('Scegli almeno una voce.'); return false; }
    } else if (cur === 2) {
      if (!v('urgenza')) { msg('Indicaci con che urgenza, anche solo in modo approssimativo.'); return false; }
    } else {
      if (!v('cu-nome') || !v('cu-cognome')) { msg('Inserisci nome e cognome.'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('cu-email'))) { msg('Inserisci un indirizzo email valido.'); return false; }
      var pref = v('cu-pref');
      if (pref !== 'Email' && !v('cu-tel')) { msg('Hai scelto di essere ricontattato a voce: inserisci un numero di telefono.'); return false; }
      if (!document.getElementById('cu-privacy').checked) { msg('Per inviare la richiesta devi confermare di aver letto l’informativa privacy.'); return false; }
    }
    return true;
  }

  function priority() {
    var u = v('urgenza'), score = 0;
    if (u.indexOf('Subito') === 0) score += 2; else if (u.indexOf('Nelle') === 0) score += 1;
    if (profilo === 'societa') score += 1;
    return score >= 3 ? 'ALTA' : score >= 2 ? 'MEDIA' : 'BASSA';
  }

  function send() {
    if (sending) return;
    if (v('cu-web')) { done(); return; } // honeypot
    if (typeof emailjs === 'undefined') {
      msg('Il modulo non è al momento disponibile. Scrivici a info@studiomarchipartners.it o chiama lo 0574 571400.'); return;
    }
    sending = true; next.disabled = true; next.textContent = 'Invio in corso…';
    var ctx = [];
    ['c-stato', 'c-forma', 'c-settore', 'c-fatt', 'c-dip', 'c-rev'].forEach(function (id) { if (document.getElementById(id) && v(id)) ctx.push(id.replace('c-', '') + ': ' + v(id)); });
    var libero = v('c-libero');
    var src = (new URLSearchParams(location.search)).get('src');
    emailjs.init({ publicKey: CONFIG.publicKey });
    emailjs.send(CONFIG.serviceId, CONFIG.templateId, {
      to_email: CONFIG.toEmail,
      nome: v('cu-nome'),
      cognome: v('cu-cognome'),
      email_cliente: v('cu-email'),
      telefono: v('cu-tel') || '—',
      situazione: 'PRIORITÀ ' + priority() + ' — ' + PROFILO[profilo] + ' — ' + checked('need').join('; '),
      attivita: v('c-settore') || v('c-forma') || '—',
      idea_desc: (ctx.join(' | ') || libero || '—'),
      fatturato: v('c-fatt') || '—',
      regime: [v('c-dip') && 'Dipendenti: ' + v('c-dip'), v('c-rev') && 'Revisore/collegio: ' + v('c-rev')].filter(Boolean).join(' | ') || '—',
      extra: 'Newsletter: ' + (document.getElementById('cu-news').checked ? 'SÌ (consenso dato)' : 'no') + ' | Contatto preferito: ' + v('cu-pref'),
      urgenza: v('urgenza'),
      provenienza: 'Check-up sito (percorso ' + PROFILO[profilo] + ')' + (src ? ' — src=' + src.slice(0, 40) : ''),
      note: (libero && ctx.length ? libero + '\n' : '') + (v('cu-msg') || '—')
    }).then(done).catch(function () {
      sending = false; next.disabled = false; next.textContent = 'Invia la richiesta';
      msg('Invio non riuscito. Riprova tra poco, oppure scrivici a info@studiomarchipartners.it o chiama lo 0574 571400.');
    });
  }
  function note() {
    var t = '', f = v('c-fatt');
    if (profilo === 'piva') {
      if (f === '85.000 – 100.000 €' || f === 'Oltre 100.000 €') t = 'Con ricavi sopra 85.000 € il regime forfettario non è più applicabile dall’anno successivo; oltre 100.000 € in corso d’anno si esce subito dal regime. Conviene valutare per tempo il passaggio al regime ordinario.';
      else if (v('c-stato') === 'Devo ancora aprirla') t = 'Chi apre la partita IVA con ricavi previsti entro 85.000 € può spesso valutare il regime forfettario (imposta sostitutiva al 15%, ridotta al 5% per le nuove attività se ricorrono i requisiti). Non è però sempre la scelta più conveniente: dipende dall’attività e dalla cassa previdenziale.';
      else t = 'La scelta del regime (forfettario o ordinario) e della cassa previdenziale incide in modo rilevante sulle imposte: si valuta sui numeri reali, non in astratto.';
    } else if (profilo === 'societa') {
      if (v('c-rev') === 'No' && (f === '2 – 10 mln' || f === 'Oltre 10 mln')) t = 'Per le Srl, al superamento di determinate soglie dimensionali è obbligatorio nominare un organo di controllo o un revisore (art. 2477 c.c.). Con questi volumi vale la pena verificare subito se la vostra società rientra.';
      else t = 'Per una società contano scadenze di bilancio, organo di controllo e adempimenti sulla crisi d’impresa (art. 2086 c.c.): partiamo da un quadro della vostra situazione.';
    } else t = 'Per la dichiarazione dei redditi, i casi con immobili o successioni conviene raccogliere i documenti per tempo: ti diremo quali servono.';
    document.getElementById('cu-note-text').textContent = t;
    document.getElementById('cu-note').hidden = false;
  }
  function done() {
    if (profilo) note();
    form.hidden = true;
    var ok = document.getElementById('cu-ok'); ok.hidden = false; ok.focus();
    window.scrollTo(0, 0);
  }

  /* ---- percorso rapido "Richiamami" ---- */
  var qs = document.getElementById('q-send');
  function qmsg(t) { document.getElementById('q-error').textContent = t || ''; }
  if (qs) qs.addEventListener('click', function () {
    var nome = document.getElementById('q-nome').value.trim(), tel = document.getElementById('q-tel').value.trim();
    if (document.getElementById('q-web').value) { return; }
    if (!nome) { qmsg('Inserisci il tuo nome.'); return; }
    if (tel.replace(/\D/g, '').length < 6) { qmsg('Inserisci un numero di telefono valido.'); return; }
    if (!document.getElementById('q-privacy').checked) { qmsg('Per essere richiamato devi confermare di aver letto l’informativa privacy.'); return; }
    if (typeof emailjs === 'undefined') { qmsg('Il modulo non è al momento disponibile. Chiama lo 0574 571400.'); return; }
    qs.disabled = true; qs.textContent = 'Invio in corso…'; qmsg('');
    emailjs.init({ publicKey: CONFIG.publicKey });
    emailjs.send(CONFIG.serviceId, CONFIG.templateId, {
      to_email: CONFIG.toEmail, nome: nome, cognome: '—', email_cliente: '—', telefono: tel,
      situazione: 'RICHIAMARE ENTRO 24 ORE — richiesta rapida dal check-up',
      attivita: '—', idea_desc: '—', fatturato: '—', regime: '—', extra: '—', urgenza: '—',
      provenienza: 'Check-up sito (percorso rapido Richiamami)', note: '—'
    }).then(function () {
      qs.hidden = true; document.getElementById('q-ok').hidden = false;
    }).catch(function () {
      qs.disabled = false; qs.textContent = 'Richiamatemi';
      qmsg('Invio non riuscito. Riprova o chiama lo 0574 571400.');
    });
  });

  next.addEventListener('click', function () {
    if (!validate()) return;
    if (cur === 3) send(); else show(cur + 1);
  });
  back.addEventListener('click', function () { if (cur > 0) show(cur - 1); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.addEventListener('change', function (e) { if (e.target.name === 'profilo') msg(''); });
})();
