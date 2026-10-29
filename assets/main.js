/* Studio Marchi & Partners — script del sito (nessun cookie, nessun tracciamento) */
(function () {
  'use strict';

  /* ---- menu mobile ---- */
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---- form contatti (EmailJS) ----
     Stessi servizio e template del questionario. Sul template i campi non usati
     arrivano come "—". Per un template dedicato ai contatti basta cambiare
     TEMPLATE_ID e rinominare i parametri qui sotto. */
  var CONFIG = {
    publicKey: 'sb68otMBGAKsrW3QL',
    serviceId: 'fcm_gmail',
    templateId: 'template_r8vh2nx',
    toEmail: 'info@studiomarchipartners.it'
  };


  /* ---- ultimi post LinkedIn ----
     Legge assets/linkedin.json: [{"data":"2026-10-20","titolo":"…","pilastro":"PMI","url":"https://www.linkedin.com/posts/…"}]
     Se il file è vuoto o non raggiungibile resta l'invito a seguire il profilo. Nessun contenuto di LinkedIn viene caricato. */
  var li = document.getElementById('li-posts');
  if (li && window.fetch) {
    fetch(li.getAttribute('data-src'), { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (items) {
        if (!Array.isArray(items)) return;
        items = items.filter(function (i) {
          return i && i.titolo && /^https:\/\/([a-z]+\.)?linkedin\.com\//.test(i.url || '');
        }).sort(function (a, b) { return String(b.data).localeCompare(String(a.data)); }).slice(0, 3);
        if (!items.length) return;
        var ul = li.querySelector('.li-list');
        items.forEach(function (i) {
          var a = document.createElement('a');
          a.href = i.url; a.rel = 'noopener';
          var meta = document.createElement('span'); meta.className = 'li-meta';
          var d = new Date(i.data);
          meta.textContent = (i.pilastro ? i.pilastro + ' · ' : '') + (isNaN(d) ? '' : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }));
          var t = document.createElement('span'); t.className = 'li-title'; t.textContent = i.titolo;
          a.appendChild(meta); a.appendChild(t);
          var li2 = document.createElement('li'); li2.appendChild(a); ul.appendChild(li2);
        });
        ul.hidden = false;
        var fb = li.querySelector('.li-fallback'); if (fb) fb.hidden = true;
      })
      .catch(function () {});
  }

  var form = document.getElementById('contact-form');
  if (!form) return;

  var status = document.getElementById('form-status');
  var submit = form.querySelector('button[type=submit]');
  var sending = false;

  function show(msg, cls) {
    status.className = 'status ' + cls;
    status.textContent = msg;
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;

    if (val('website')) return; // campo trappola anti-spam: i visitatori reali lo lasciano vuoto

    if (!val('nome') || !val('cognome')) {
      show('Inserisci nome e cognome.', 'err'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email'))) {
      show('L’indirizzo email non sembra corretto. Controllalo e riprova.', 'err'); return;
    }
    if (val('messaggio').length < 10) {
      show('Scrivi almeno una riga su ciò di cui hai bisogno.', 'err'); return;
    }
    if (!document.getElementById('consenso').checked) {
      show('Per inviare il messaggio devi confermare di aver letto l’informativa privacy.', 'err'); return;
    }
    if (typeof emailjs === 'undefined') {
      show('Il modulo non è al momento disponibile. Scrivici a info@studiomarchipartners.it o chiama lo 0574 571400.', 'err'); return;
    }

    sending = true;
    submit.disabled = true;
    submit.textContent = 'Invio in corso…';
    show('', '');

    emailjs.init({ publicKey: CONFIG.publicKey });
    emailjs.send(CONFIG.serviceId, CONFIG.templateId, {
      to_email: CONFIG.toEmail,
      nome: val('nome'),
      cognome: val('cognome'),
      email_cliente: val('email'),
      telefono: val('telefono') || '—',
      situazione: 'Messaggio dal modulo Contatti del sito',
      attivita: document.getElementById('servizio').selectedOptions[0].text,
      idea_desc: '—',
      fatturato: '—',
      regime: '—',
      extra: '—',
      urgenza: '—',
      provenienza: 'Sito — pagina Contatti',
      note: val('messaggio')
    }).then(function () {
      form.reset();
      form.hidden = true;
      var ok = document.getElementById('form-ok');
      ok.hidden = false;
      ok.focus();
    }).catch(function () {
      sending = false;
      submit.disabled = false;
      submit.textContent = 'Invia il messaggio';
      show('Il messaggio non è partito. Riprova tra qualche minuto oppure scrivi a info@studiomarchipartners.it o chiama lo 0574 571400.', 'err');
    });
  });
})();
