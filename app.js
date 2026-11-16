import { html, render, Component as PreactComponent } from './vendor/htm-preact.module.js';
class DCLogic extends PreactComponent {}

class Component extends DCLogic {
  constructor(props) {
    super(props);
    var saved = {};
    try { saved = JSON.parse(window.localStorage.getItem('studio-estetica-v1') || '{}') || {}; } catch (e) { saved = {}; }
    this.state = {
      auth: saved.auth || null,
      logged: false,
      lf: { user: '', pass: '', pass2: '' },
      loginErr: '',
      tab: 'clientes',
      studio: (!saved.studio || saved.studio === 'Studio Estética') ? 'Optimus' : saved.studio,
      clients: saved.clients || [],
      services: saved.services || [],
      appts: saved.appts || [],
      expenses: saved.expenses || [], quick: saved.quick || this._defaultQuick(), qf: { id: '', title: '', text: '' }, qfErr: '', quickTo: {}, ef: { id: '', name: '', amount: '', day: '' }, efErr: '', finPeriod: 'mes',
      tpl: Object.assign({}, this._defaultTpl(), saved.tpl || {}),
      cf: this._emptyCF(), sf: this._emptySF(), af: this._emptyAF(),
      search: '', agFilter: 'abertos', notifOpen: true, confirmDel: '',
      cfErr: '', sfErr: '', afErr: ''
    };
  }

  componentDidUpdate() {
    var s = this.state;
    try {
      window.localStorage.setItem('studio-estetica-v1', JSON.stringify({
        auth: s.auth, studio: s.studio, clients: s.clients, services: s.services, appts: s.appts, tpl: s.tpl, expenses: s.expenses, quick: s.quick
      }));
    } catch (e) {}
  }

  /* ---------- helpers ---------- */
  _defaultTpl() {
    return {
      bday: 'Olá, {nome}! Hoje o dia é todo seu. A equipe do {studio} deseja um feliz aniversário, com muita saúde, leveza e autocuidado. Preparamos um mimo especial para você neste mês: venha nos visitar!',
      confirm: 'Olá, {nome}! Tudo bem? Passando para confirmar seu horário no {studio}: {servico} na {dia}, {data}, às {hora}. Valor: {valor}. Podemos confirmar? Qualquer imprevisto, é só nos avisar.',
      follow: 'Olá, {nome}! Como você está se sentindo após o seu atendimento de {servico}? Estamos acompanhando seu cuidado de perto. Qualquer dúvida ou sensação diferente, fale com a gente. Obrigada pela confiança no {studio}!'
    };
  }
  _defaultQuick() {
    return [
      { id: 'q-retorno', title: 'Lembrete de retorno', text: 'Olá, {nome}! Já faz um tempinho desde o seu último cuidado no {studio}. Que tal agendar seu retorno? Temos horários disponíveis esta semana.' },
      { id: 'q-obrigada', title: 'Agradecimento', text: 'Olá, {nome}! Obrigada pela visita ao {studio}. Foi um prazer cuidar de você. Esperamos você em breve!' }
    ];
  }
  saveQuick() {
    var s = this.state, f = s.qf;
    if (!f.title.trim()) return this.setState({ qfErr: 'Dê um título para a mensagem.' });
    if (!f.text.trim()) return this.setState({ qfErr: 'Escreva o texto da mensagem.' });
    var data = { title: f.title.trim(), text: f.text.trim() };
    var list = s.quick || [];
    var quick = f.id
      ? list.map(function (x) { return x.id === f.id ? Object.assign({}, x, data) : x; })
      : list.concat([Object.assign({ id: this._uid() }, data)]);
    this.setState({ quick: quick, qf: { id: '', title: '', text: '' }, qfErr: '' });
  }
  _emptyCF() { return { id: '', name: '', phone: '', birth: '', notes: '' }; }
  _emptySF() { return { id: '', name: '', price: '', duration: '' }; }
  _emptyAF() { return { clientId: '', serviceId: '', date: this._iso(new Date()), time: '', price: '', notes: '' }; }
  _pad(n) { return String(n).padStart(2, '0'); }
  _iso(d) { return d.getFullYear() + '-' + this._pad(d.getMonth() + 1) + '-' + this._pad(d.getDate()); }
  _parse(iso) { var p = String(iso).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  _fmt(iso) { if (!iso) return ''; var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  _dm(iso) { var p = iso.split('-'); return p[2] + '/' + p[1]; }
  _wd(iso, long) {
    var s = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    var l = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    var i = this._parse(iso).getDay();
    return long ? l[i] : s[i];
  }
  _money(v) {
    var n = Number(v) || 0;
    try { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    catch (e) { return 'R$ ' + n.toFixed(2).replace('.', ','); }
  }
  _digits(p) { return String(p || '').replace(/\D/g, ''); }
  _wa(phone, msg) {
    var d = this._digits(phone);
    if (d.length < 10) return '';
    if (d.length <= 11) d = '55' + d;
    return 'https://wa.me/' + d + '?text=' + encodeURIComponent(msg);
  }
  _phoneFmt(p) {
    var d = this._digits(p);
    if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return p || 'Sem telefone';
  }
  _fill(t, v) { return String(t || '').replace(/\{(\w+)\}/g, function (m, k) { return v[k] !== undefined ? v[k] : m; }); }
  _first(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
  _initials(n) {
    var p = String(n || '').trim().split(/\s+/);
    var a = (p[0] || '').charAt(0);
    var b = p.length > 1 ? p[p.length - 1].charAt(0) : '';
    return a + b;
  }
  _daysUntil(birth) {
    var p = birth.split('-').map(Number);
    var n = new Date();
    var t0 = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    var nx = new Date(n.getFullYear(), p[1] - 1, p[2]);
    if (nx < t0) nx = new Date(n.getFullYear() + 1, p[1] - 1, p[2]);
    return Math.round((nx - t0) / 86400000);
  }
  _ageNext(birth, days) {
    var y = Number(birth.split('-')[0]);
    var d = new Date(); d.setDate(d.getDate() + days);
    return d.getFullYear() - y;
  }
  _hash(s) {
    var h1 = 5381, h2 = 52711;
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); h1 = (h1 * 33) ^ c; h2 = (h2 * 33) ^ c; }
    return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
  }
  _uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  _bind(form, key) {
    var self = this;
    return function (e) {
      var v = e.target.value;
      self.setState(function (st) { var o = Object.assign({}, st[form]); o[key] = v; var r = {}; r[form] = o; return r; });
    };
  }

  /* ---------- actions ---------- */
  doAuth() {
    var s = this.state, u = s.lf.user.trim(), p = s.lf.pass;
    if (!s.auth) {
      if (!u || p.length < 4) return this.setState({ loginErr: 'Escolha um usuário e uma senha com pelo menos 4 caracteres.' });
      if (p !== s.lf.pass2) return this.setState({ loginErr: 'As senhas não coincidem.' });
      return this.setState({ auth: { user: u, hash: this._hash(p) }, logged: true, loginErr: '', lf: { user: '', pass: '', pass2: '' } });
    }
    if (u.toLowerCase() === String(s.auth.user).toLowerCase() && this._hash(p) === s.auth.hash) {
      this.setState({ logged: true, loginErr: '', lf: { user: '', pass: '', pass2: '' } });
    } else {
      this.setState({ loginErr: 'Usuário ou senha incorretos.' });
    }
  }
  saveClient() {
    var s = this.state, f = s.cf;
    if (!f.name.trim()) return this.setState({ cfErr: 'Informe o nome da cliente.' });
    var data = { name: f.name.trim(), phone: f.phone.trim(), birth: f.birth, notes: f.notes.trim() };
    var clients = f.id
      ? s.clients.map(function (c) { return c.id === f.id ? Object.assign({}, c, data) : c; })
      : s.clients.concat([Object.assign({ id: this._uid() }, data)]);
    this.setState({ clients: clients, cf: this._emptyCF(), cfErr: '' });
  }
  saveService() {
    var s = this.state, f = s.sf;
    if (!f.name.trim()) return this.setState({ sfErr: 'Informe o nome do serviço.' });
    if (f.price === '' || isNaN(Number(f.price))) return this.setState({ sfErr: 'Informe o valor do serviço.' });
    var data = { name: f.name.trim(), price: Number(f.price), duration: Number(f.duration) || 0 };
    var services = f.id
      ? s.services.map(function (x) { return x.id === f.id ? Object.assign({}, x, data) : x; })
      : s.services.concat([Object.assign({ id: this._uid() }, data)]);
    this.setState({ services: services, sf: this._emptySF(), sfErr: '' });
  }
  saveAppt() {
    var s = this.state, f = s.af;
    if (!f.clientId) return this.setState({ afErr: 'Selecione a cliente.' });
    if (!f.serviceId) return this.setState({ afErr: 'Selecione o serviço.' });
    if (!f.date || !f.time) return this.setState({ afErr: 'Informe a data e o horário.' });
    var c = s.clients.find(function (x) { return x.id === f.clientId; }) || {};
    var sv = s.services.find(function (x) { return x.id === f.serviceId; }) || {};
    var price = f.price === '' ? (sv.price || 0) : Number(f.price) || 0;
    var a = { id: this._uid(), clientId: f.clientId, serviceId: f.serviceId, clientName: c.name, serviceName: sv.name,
      date: f.date, time: f.time, price: price, notes: f.notes.trim(), confirmed: false, done: false, followed: false };
    var af = this._emptyAF(); af.date = f.date;
    this.setState({ appts: s.appts.concat([a]), af: af, afErr: '', agFilter: 'abertos' });
  }
  patchAppt(id, patch) {
    this.setState(function (st) {
      return { appts: st.appts.map(function (a) { return a.id === id ? Object.assign({}, a, typeof patch === 'function' ? patch(a) : patch) : a; }) };
    });
  }
  saveExpense() {
    var s = this.state, f = s.ef;
    if (!f.name.trim()) return this.setState({ efErr: 'Informe a descrição do gasto.' });
    if (f.amount === '' || isNaN(Number(f.amount)) || Number(f.amount) <= 0) return this.setState({ efErr: 'Informe o valor mensal.' });
    var day = Math.min(31, Math.max(0, parseInt(f.day, 10) || 0));
    var data = { name: f.name.trim(), amount: Number(f.amount), day: day };
    var list = s.expenses || [];
    var expenses = f.id
      ? list.map(function (x) { return x.id === f.id ? Object.assign({}, x, data) : x; })
      : list.concat([Object.assign({ id: this._uid() }, data)]);
    this.setState({ expenses: expenses, ef: { id: '', name: '', amount: '', day: '' }, efErr: '' });
  }
  markBday(id) {
    var y = new Date().getFullYear();
    this.setState(function (st) { return { clients: st.clients.map(function (c) { return c.id === id ? Object.assign({}, c, { bdaySent: y }) : c; }) }; });
  }

  /* ---------- view ---------- */
  renderVals() {
    var self = this, s = this.state;
    var now = new Date();
    var today = this._iso(now);
    var tmw = new Date(); tmw.setDate(tmw.getDate() + 1);
    var tomorrow = this._iso(tmw);
    var year = now.getFullYear();
    var ym = today.slice(0, 7);
    var studio = s.studio || 'Optimus';
    var cById = {}; s.clients.forEach(function (c) { cById[c.id] = c; });
    var sById = {}; s.services.forEach(function (x) { sById[x.id] = x; });

    var on = {
      lUser: this._bind('lf', 'user'), lPass: this._bind('lf', 'pass'), lPass2: this._bind('lf', 'pass2'),
      authKey: function (e) { if (e.key === 'Enter') self.doAuth(); },
      cfName: this._bind('cf', 'name'), cfPhone: this._bind('cf', 'phone'), cfBirth: this._bind('cf', 'birth'), cfNotes: this._bind('cf', 'notes'),
      sfName: this._bind('sf', 'name'), sfPrice: this._bind('sf', 'price'), sfDuration: this._bind('sf', 'duration'),
      afClient: this._bind('af', 'clientId'), afDate: this._bind('af', 'date'), afTime: this._bind('af', 'time'),
      afPrice: this._bind('af', 'price'), afNotes: this._bind('af', 'notes'),
      afService: function (e) {
        var v = e.target.value, sv = sById[v];
        self.setState(function (st) { return { af: Object.assign({}, st.af, { serviceId: v, price: sv ? String(sv.price) : '' }) }; });
      },
      search: function (e) { self.setState({ search: e.target.value }); },
      studio: function (e) { self.setState({ studio: e.target.value }); },
      tplBday: this._bind('tpl', 'bday'), tplConfirm: this._bind('tpl', 'confirm'), tplFollow: this._bind('tpl', 'follow')
    };

    var vars = function (a) {
      var c = cById[a.clientId] || {}, sv = sById[a.serviceId] || {};
      return { nome: self._first(c.name || a.clientName), servico: sv.name || a.serviceName || 'atendimento',
        data: self._fmt(a.date), dia: self._wd(a.date, true), hora: a.time, valor: self._money(a.price), studio: studio };
    };
    var bdayMsg = function (c) { return self._fill(s.tpl.bday, { nome: self._first(c.name), studio: studio }); };

    /* notifications */
    var notifs = [];
    s.clients.forEach(function (c) {
      if (c.birth && self._daysUntil(c.birth) === 0 && c.bdaySent !== year) {
        var href = self._wa(c.phone, bdayMsg(c));
        notifs.push({ kind: 'Aniversário', chipCls: 'chip chip-wait', text: 'Hoje é aniversário de ' + c.name,
          sub: 'Faz ' + self._ageNext(c.birth, 0) + ' anos — envie sua mensagem de parabéns', href: href, hasHref: !!href, noHref: !href,
          btn: 'Enviar parabéns', act: function () { self.markBday(c.id); } });
      }
    });
    var bdayBadge = notifs.length;
    var sorted = s.appts.slice().sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
    var agBadge = 0;
    sorted.forEach(function (a) {
      var c = cById[a.clientId] || {};
      var v = vars(a);
      if (!a.done && !a.confirmed && (a.date === today || a.date === tomorrow)) {
        var href = self._wa(c.phone, self._fill(s.tpl.confirm, v));
        agBadge++;
        notifs.push({ kind: 'Confirmar', chipCls: 'chip', text: 'Confirmar ' + v.servico + ' de ' + (c.name || a.clientName),
          sub: (a.date === today ? 'Hoje' : 'Amanhã') + ' às ' + a.time, href: href, hasHref: !!href, noHref: !href,
          btn: 'Confirmar agendamento', act: function () { self.patchAppt(a.id, { confirmed: true }); } });
      }
      if (a.done && !a.followed) {
        var fh = self._wa(c.phone, self._fill(s.tpl.follow, v));
        agBadge++;
        notifs.push({ kind: 'Acompanhar', chipCls: 'chip chip-ok', text: 'Acompanhar ' + (c.name || a.clientName) + ' após ' + v.servico,
          sub: 'Realizado em ' + v.data, href: fh, hasHref: !!fh, noHref: !fh,
          btn: 'Enviar acompanhamento', act: function () { self.patchAppt(a.id, { followed: true }); } });
      }
    });

    var tabDefs = [
      { id: 'clientes', label: 'Clientes', badge: 0 },
      { id: 'agenda', label: 'Agenda', badge: agBadge },
      { id: 'servicos', label: 'Serviços', badge: 0 },
      { id: 'aniversarios', label: 'Aniversários', badge: bdayBadge },
      { id: 'mensagens', label: 'Mensagens', badge: 0 },
      { id: 'financas', label: 'Finanças', badge: 0 }
    ];
    var tabs = tabDefs.map(function (t) {
      return { label: t.label, badge: t.badge, hasBadge: t.badge > 0, cls: s.tab === t.id ? 'tab tab-on' : 'tab',
        go: function () { self.setState({ tab: t.id, confirmDel: '' }); } };
    });

    /* clients */
    var visits = {};
    s.appts.forEach(function (a) { if (a.done) visits[a.clientId] = (visits[a.clientId] || 0) + 1; });
    var q = s.search.trim().toLowerCase();
    var clientsView = s.clients
      .filter(function (c) { return !q || c.name.toLowerCase().indexOf(q) >= 0 || self._digits(c.phone).indexOf(self._digits(q) || '~') >= 0; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, 'pt-BR'); })
      .map(function (c) {
        var d = c.birth ? self._daysUntil(c.birth) : -1;
        var n = visits[c.id] || 0;
        var wa = self._wa(c.phone, 'Olá, ' + self._first(c.name) + '!');
        return { name: c.name, notes: c.notes, hasNotes: !!c.notes, initials: self._initials(c.name), phoneFmt: self._phoneFmt(c.phone),
          hasBirth: !!c.birth, birthLabel: c.birth ? (d === 0 ? 'Aniversário hoje' : self._dm(c.birth)) : '',
          birthCls: d === 0 ? 'chip chip-wait' : 'chip',
          visitsLabel: n === 1 ? '1 atendimento' : n + ' atendimentos',
          hasWa: !!wa, waHref: wa,
          edit: function () { self.setState({ cf: { id: c.id, name: c.name, phone: c.phone || '', birth: c.birth || '', notes: c.notes || '' }, cfErr: '' }); },
          askDel: function () { self.setState({ confirmDel: c.id }); },
          del: function () { self.setState(function (st) { return { clients: st.clients.filter(function (x) { return x.id !== c.id; }), confirmDel: '' }; }); },
          confirming: s.confirmDel === c.id, notConfirming: s.confirmDel !== c.id };
      });

    /* services */
    var svcCount = {};
    s.appts.forEach(function (a) { svcCount[a.serviceId] = (svcCount[a.serviceId] || 0) + 1; });
    var servicesView = s.services.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'pt-BR'); }).map(function (v) {
      var n = svcCount[v.id] || 0;
      return { name: v.name, priceLabel: self._money(v.price), durationLabel: v.duration ? v.duration + ' min' : 'Duração livre',
        countLabel: n === 1 ? '1 agendamento' : n + ' agendamentos',
        edit: function () { self.setState({ sf: { id: v.id, name: v.name, price: String(v.price), duration: v.duration ? String(v.duration) : '' }, sfErr: '' }); },
        askDel: function () { self.setState({ confirmDel: v.id }); },
        del: function () { self.setState(function (st) { return { services: st.services.filter(function (x) { return x.id !== v.id; }), confirmDel: '' }; }); },
        confirming: s.confirmDel === v.id, notConfirming: s.confirmDel !== v.id };
    });

    /* agenda */
    var list;
    if (s.agFilter === 'hoje') list = sorted.filter(function (a) { return a.date === today; });
    else if (s.agFilter === 'feitos') list = sorted.filter(function (a) { return a.done; }).reverse();
    else if (s.agFilter === 'todos') list = sorted;
    else list = sorted.filter(function (a) { return !a.done; });
    var apptsView = list.map(function (a) {
      var c = cById[a.clientId] || {};
      var v = vars(a);
      var ch = self._wa(c.phone, self._fill(s.tpl.confirm, v));
      var fh = self._wa(c.phone, self._fill(s.tpl.follow, v));
      var status, cls;
      if (a.done) { status = a.followed ? 'Feito · acompanhado' : 'Feito'; cls = 'chip chip-done'; }
      else if (a.date < today) { status = 'Não marcado como feito'; cls = 'chip chip-wait'; }
      else if (a.confirmed) { status = 'Confirmado'; cls = 'chip chip-ok'; }
      else { status = 'A confirmar'; cls = 'chip chip-wait'; }
      var showConfirm = !a.done && !a.confirmed;
      var showFollow = a.done && !a.followed;
      return { wd: self._wd(a.date), day: self._dm(a.date), time: a.time,
        client: c.name || a.clientName || 'Cliente removida', service: v.servico, price: v.valor,
        notes: a.notes, hasNotes: !!a.notes, done: !!a.done, statusLabel: status, statusCls: cls,
        rowCls: a.date === today && !a.done ? 'row row-hl' : 'row',
        confirmHref: ch, followHref: fh,
        showConfirmWa: showConfirm && !!ch, showConfirmNoWa: showConfirm && !ch,
        showFollowWa: showFollow && !!fh, showFollowNoWa: showFollow && !fh,
        toggle: function () { self.patchAppt(a.id, function (x) { return { done: !x.done }; }); },
        confirm: function () { self.patchAppt(a.id, { confirmed: true }); },
        follow: function () { self.patchAppt(a.id, { followed: true }); },
        askDel: function () { self.setState({ confirmDel: a.id }); },
        del: function () { self.setState(function (st) { return { appts: st.appts.filter(function (x) { return x.id !== a.id; }), confirmDel: '' }; }); },
        confirming: s.confirmDel === a.id, notConfirming: s.confirmDel !== a.id };
    });
    var agFilters = [['abertos', 'Em aberto'], ['hoje', 'Hoje'], ['feitos', 'Realizados'], ['todos', 'Todos']].map(function (f) {
      return { label: f[1], cls: s.agFilter === f[0] ? 'pill pill-on' : 'pill', go: function () { self.setState({ agFilter: f[0] }); } };
    });
    var todayAppts = s.appts.filter(function (a) { return a.date === today; });
    var stats = {
      todayCount: todayAppts.length,
      todayValue: this._money(todayAppts.reduce(function (t, a) { return t + (Number(a.price) || 0); }, 0)),
      monthValue: this._money(s.appts.filter(function (a) { return a.done && a.date.slice(0, 7) === ym; }).reduce(function (t, a) { return t + (Number(a.price) || 0); }, 0)),
      toConfirm: s.appts.filter(function (a) { return !a.done && !a.confirmed && a.date >= today; }).length
    };

    /* birthdays */
    var monthCount = 0;
    var bdaysView = s.clients.filter(function (c) { return c.birth; }).map(function (c) {
      var d = self._daysUntil(c.birth);
      if (c.birth.slice(5, 7) === today.slice(5, 7)) monthCount++;
      return { c: c, d: d };
    }).sort(function (x, y) { return x.d - y.d; }).map(function (o) {
      var c = o.c, d = o.d;
      var href = self._wa(c.phone, bdayMsg(c));
      var sent = d === 0 && c.bdaySent === year;
      return { name: c.name, initials: self._initials(c.name), date: self._dm(c.birth),
        age: 'faz ' + self._ageNext(c.birth, d) + ' anos',
        when: d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : 'em ' + d + ' dias',
        whenCls: d === 0 ? 'chip chip-wait' : d <= 7 ? 'chip chip-ok' : 'chip',
        rowCls: d === 0 ? 'row row-hl' : 'row',
        href: href, sent: sent, canSend: !!href && !sent, noPhone: !href,
        send: function () { if (d === 0) self.markBday(c.id); } };
    });

    /* finances */
    var finP = s.finPeriod || 'mes';
    var nowY = now.getFullYear(), nowM = now.getMonth();
    var prevYm = this._iso(new Date(nowY, nowM - 1, 1)).slice(0, 7);
    var inPeriod = function (d) {
      if (finP === 'mes') return d.slice(0, 7) === ym;
      if (finP === 'anterior') return d.slice(0, 7) === prevYm;
      if (finP === 'ano') return d.slice(0, 4) === String(nowY);
      return true;
    };
    var doneP = s.appts.filter(function (a) { return a.done && inPeriod(a.date); });
    var revenue = doneP.reduce(function (t, a) { return t + (Number(a.price) || 0); }, 0);
    var months = 1;
    if (finP === 'ano') months = nowM + 1;
    if (finP === 'tudo') {
      var first = s.appts.reduce(function (m, a) { return a.date < m ? a.date : m; }, today);
      var fd = this._parse(first);
      months = Math.max(1, (nowY - fd.getFullYear()) * 12 + nowM - fd.getMonth() + 1);
    }
    var expList = (s.expenses || []).slice().sort(function (a, b) { return (a.day || 99) - (b.day || 99); });
    var expMonthly = expList.reduce(function (t, x) { return t + (Number(x.amount) || 0); }, 0);
    var expTotal = expMonthly * months;
    var profit = revenue - expTotal;
    var bySvc = {};
    doneP.forEach(function (a) {
      var k = a.serviceId || a.serviceName;
      var sv = sById[a.serviceId];
      if (!bySvc[k]) bySvc[k] = { name: sv ? sv.name : (a.serviceName || 'Serviço removido'), count: 0, total: 0 };
      bySvc[k].count++; bySvc[k].total += Number(a.price) || 0;
    });
    var svcRows = Object.keys(bySvc).map(function (k) { return bySvc[k]; }).sort(function (a, b) { return b.total - a.total; });
    var svcMax = svcRows.length ? svcRows[0].total || 1 : 1;
    var byCli = {};
    doneP.forEach(function (a) {
      var c = cById[a.clientId];
      var k = a.clientId;
      if (!byCli[k]) byCli[k] = { name: c ? c.name : (a.clientName || 'Cliente removida'), count: 0, total: 0 };
      byCli[k].count++; byCli[k].total += Number(a.price) || 0;
    });
    var cliRows = Object.keys(byCli).map(function (k) { return byCli[k]; }).sort(function (a, b) { return b.total - a.total; }).slice(0, 5);
    var periodNames = { mes: 'Este mês', anterior: 'Mês anterior', ano: 'Este ano', tudo: 'Todo o período' };
    var fin = {
      periodLabel: periodNames[finP] + (months > 1 ? ' · ' + months + ' meses' : ''),
      revenue: this._money(revenue), count: doneP.length,
      countLabel: doneP.length === 1 ? '1 atendimento realizado' : doneP.length + ' atendimentos realizados',
      ticket: this._money(doneP.length ? revenue / doneP.length : 0),
      expTotal: this._money(expTotal), expMonthly: this._money(expMonthly),
      expNote: months > 1 ? this._money(expMonthly) + ' por mês × ' + months + ' meses' : 'gastos fixos do mês',
      profit: this._money(profit), profitCls: profit < 0 ? 'serif neg' : 'serif',
      profitNote: revenue > 0 ? 'margem de ' + Math.round(profit / revenue * 100) + '%' : 'receita menos gastos fixos',
      noSvc: svcRows.length === 0, noCli: cliRows.length === 0, noExp: expList.length === 0,
      svcRows: svcRows.map(function (r) {
        return { name: r.name, total: self._money(r.total), countLabel: r.count === 1 ? '1 atendimento' : r.count + ' atendimentos',
          share: revenue ? Math.round(r.total / revenue * 100) + '%' : '0%', barW: Math.max(2, Math.round(r.total / svcMax * 100)) + '%' };
      }),
      cliRows: cliRows.map(function (r, i) {
        return { pos: i + 1, name: r.name, initials: self._initials(r.name), total: self._money(r.total),
          countLabel: r.count === 1 ? '1 atendimento' : r.count + ' atendimentos' };
      }),
      expRows: expList.map(function (x) {
        return { name: x.name, amount: self._money(x.amount), dayLabel: x.day ? 'vence dia ' + x.day : 'sem vencimento',
          edit: function () { self.setState({ ef: { id: x.id, name: x.name, amount: String(x.amount), day: x.day ? String(x.day) : '' }, efErr: '' }); },
          askDel: function () { self.setState({ confirmDel: x.id }); },
          del: function () { self.setState(function (st) { return { expenses: (st.expenses || []).filter(function (y) { return y.id !== x.id; }), confirmDel: '' }; }); },
          confirming: s.confirmDel === x.id, notConfirming: s.confirmDel !== x.id };
      })
    };
    var finFilters = [['mes', 'Este mês'], ['anterior', 'Mês anterior'], ['ano', 'Este ano'], ['tudo', 'Tudo']].map(function (f) {
      return { label: f[1], cls: finP === f[0] ? 'pill pill-on' : 'pill', go: function () { self.setState({ finPeriod: f[0] }); } };
    });
    on.efName = this._bind('ef', 'name'); on.efAmount = this._bind('ef', 'amount'); on.efDay = this._bind('ef', 'day');

    var firstClient = s.clients[0];

    /* messages */
    var firstSvc = s.services[0];
    var sample = { nome: firstClient ? this._first(firstClient.name) : 'Mariana', studio: studio,
      servico: firstSvc ? firstSvc.name : 'Limpeza de pele', data: this._fmt(tomorrow), dia: this._wd(tomorrow, true),
      hora: '14:00', valor: this._money(firstSvc ? firstSvc.price : 150) };
    var autoMsgs = [
      { key: 'bday', title: 'Aniversário', when: 'Enviada no dia do aniversário da cliente, pelos avisos e pela aba Aniversários.' },
      { key: 'confirm', title: 'Confirmação de agendamento', when: 'Enviada no botão Confirmar da Agenda e nos avisos de hoje e amanhã.' },
      { key: 'follow', title: 'Acompanhamento', when: 'Enviada depois que o serviço é marcado como feito.' }
    ].map(function (m) {
      return { title: m.title, when: m.when, text: s.tpl[m.key], preview: self._fill(s.tpl[m.key], sample), onText: self._bind('tpl', m.key) };
    });
    var quickView = (s.quick || []).map(function (q) {
      var to = (s.quickTo || {})[q.id] || '';
      var c = to ? cById[to] : null;
      var href = c ? self._wa(c.phone, self._fill(q.text, { nome: self._first(c.name), studio: studio })) : '';
      return { title: q.title, text: q.text, to: to, href: href, hasHref: !!href, noPhone: !!c && !href,
        onTo: function (e) { var v = e.target.value; self.setState(function (st) { var m = Object.assign({}, st.quickTo); m[q.id] = v; return { quickTo: m }; }); },
        edit: function () { self.setState({ qf: { id: q.id, title: q.title, text: q.text }, qfErr: '' }); },
        askDel: function () { self.setState({ confirmDel: q.id }); },
        del: function () { self.setState(function (st) { return { quick: (st.quick || []).filter(function (x) { return x.id !== q.id; }), confirmDel: '' }; }); },
        confirming: s.confirmDel === q.id, notConfirming: s.confirmDel !== q.id };
    });
    on.qfTitle = this._bind('qf', 'title'); on.qfText = this._bind('qf', 'text');
    var isSetup = !s.auth;

    return {
      showAuth: !s.logged, showApp: s.logged, isSetup: isSetup,
      authSubtitle: isSetup ? 'Primeiro acesso: crie seu usuário e senha.' : 'Entre com seu usuário e senha.',
      authBtn: isSetup ? 'Criar acesso e entrar' : 'Entrar',
      lf: s.lf, loginErr: s.loginErr, hasLoginErr: !!s.loginErr,
      doAuth: function () { self.doAuth(); },
      logout: function () { self.setState({ logged: false, lf: { user: '', pass: '', pass2: '' }, loginErr: '' }); },
      studio: studio, on: on, tabs: tabs,
      todayLong: this._wd(today, true) + ', ' + this._fmt(today),
      notifs: notifs, notifCount: notifs.length, hasNotifs: notifs.length > 0, noNotifs: notifs.length === 0,
      notifOpen: s.notifOpen, toggleNotif: function () { self.setState({ notifOpen: !self.state.notifOpen }); },
      cancelDel: function () { self.setState({ confirmDel: '' }); },

      tabClientes: s.tab === 'clientes', tabAgenda: s.tab === 'agenda', tabServicos: s.tab === 'servicos', tabAniversarios: s.tab === 'aniversarios', tabFinancas: s.tab === 'financas', tabMensagens: s.tab === 'mensagens',
      autoMsgs: autoMsgs, quickView: quickView, noQuick: quickView.length === 0,
      quickCountLabel: quickView.length === 1 ? '1 mensagem' : quickView.length + ' mensagens',
      qf: s.qf, qfErr: s.qfErr, hasQfErr: !!s.qfErr, qfEditing: !!s.qf.id, qfTitle: s.qf.id ? 'Editar mensagem' : 'Nova mensagem rápida',
      saveQuick: function () { self.saveQuick(); },
      cancelQuick: function () { self.setState({ qf: { id: '', title: '', text: '' }, qfErr: '' }); },
      fin: fin, finFilters: finFilters, ef: s.ef, efErr: s.efErr, hasEfErr: !!s.efErr, efEditing: !!s.ef.id,
      efTitle: s.ef.id ? 'Editar gasto' : 'Novo gasto fixo',
      saveExpense: function () { self.saveExpense(); },
      cancelExpense: function () { self.setState({ ef: { id: '', name: '', amount: '', day: '' }, efErr: '' }); },

      cf: s.cf, cfErr: s.cfErr, hasCfErr: !!s.cfErr, cfEditing: !!s.cf.id, cfTitle: s.cf.id ? 'Editar cliente' : 'Nova cliente',
      saveClient: function () { self.saveClient(); },
      cancelClient: function () { self.setState({ cf: self._emptyCF(), cfErr: '' }); },
      search: s.search, clientsView: clientsView, noClients: clientsView.length === 0,
      clientCountLabel: s.clients.length === 1 ? '1 cadastrada' : s.clients.length + ' cadastradas',

      sf: s.sf, sfErr: s.sfErr, hasSfErr: !!s.sfErr, sfEditing: !!s.sf.id, sfTitle: s.sf.id ? 'Editar serviço' : 'Novo serviço',
      saveService: function () { self.saveService(); },
      cancelService: function () { self.setState({ sf: self._emptySF(), sfErr: '' }); },
      servicesView: servicesView, noServices: servicesView.length === 0,
      serviceCountLabel: s.services.length === 1 ? '1 serviço' : s.services.length + ' serviços',

      af: s.af, afErr: s.afErr, hasAfErr: !!s.afErr, saveAppt: function () { self.saveAppt(); },
      agendaBlocked: s.clients.length === 0 || s.services.length === 0,
      clientOpts: s.clients.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'pt-BR'); }).map(function (c) { return { id: c.id, name: c.name }; }),
      serviceOpts: s.services.map(function (v) { return { id: v.id, label: v.name + ' — ' + self._money(v.price) }; }),
      tpl: s.tpl, apptsView: apptsView, noAppts: apptsView.length === 0, agFilters: agFilters, stats: stats,
      apptCountLabel: apptsView.length === 1 ? '1 agendamento' : apptsView.length + ' agendamentos',

      bdaysView: bdaysView, noBdays: bdaysView.length === 0,
      bdayMonthLabel: monthCount === 1 ? '1 neste mês' : monthCount + ' neste mês',
      bdayPreview: this._fill(s.tpl.bday, { nome: firstClient ? this._first(firstClient.name) : 'Mariana', studio: studio }),
      resetTpl: function () { self.setState({ tpl: self._defaultTpl() }); }
    };
  }
}

const IconWa = (s) => html`<svg width=${s || 16} height=${s || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z"></path></svg>`;
const IconEdit = html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;
const IconTrash = html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`;
const IconCake = html`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path><path d="M4 16s1.5-1 4-1 4 2 4 2 1.5 1 4 1 4-1 4-1"></path><path d="M2 21h20"></path><path d="M12 11V7"></path><path d="M12 4h.01"></path></svg>`;
const IconBell = html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>`;
const IconOut = html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path></svg>`;

const ROW2 = 'display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start';
const FORMCARD = 'flex:1 1 320px;display:flex;flex-direction:column;gap:16px';
const EMPTY = 'font-size:15px;padding:24px 0;border-top:1px solid #F0E9E4';

function viewAuth(v) {
  return html`
  <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
    <div class="card" style="width:100%;max-width:420px;padding:40px;display:flex;flex-direction:column;gap:20px">
      <div style="display:flex;flex-direction:column;gap:6px;text-align:center">
        <span class="kicker">Área restrita</span>
        <h1 class="serif" style="font-size:44px;line-height:1.05">${v.studio}</h1>
        <p class="muted" style="font-size:15px">${v.authSubtitle}</p>
      </div>
      <label class="lbl">Usuário
        <input class="in" value=${v.lf.user} onInput=${v.on.lUser} autocomplete="username" />
      </label>
      <label class="lbl">Senha
        <input class="in" type="password" value=${v.lf.pass} onInput=${v.on.lPass} onKeyDown=${v.on.authKey} autocomplete="current-password" />
      </label>
      ${v.isSetup && html`<label class="lbl">Confirme a senha
        <input class="in" type="password" value=${v.lf.pass2} onInput=${v.on.lPass2} onKeyDown=${v.on.authKey} autocomplete="new-password" />
      </label>`}
      ${v.hasLoginErr && html`<p class="err" role="alert">${v.loginErr}</p>`}
      <button class="btn" type="button" onClick=${v.doAuth} disabled=${v.busy} style="width:100%">${v.authBtn}</button>
      <p class="muted" style="font-size:12px;line-height:1.5;text-align:center">Seus dados ficam criptografados neste aparelho. Guarde bem a senha: sem ela não há como recuperar as informações.</p>
    </div>
  </main>`;
}

function viewNotifs(v) {
  return html`
  <section class="card" aria-label="Avisos de hoje" style="padding:20px 24px">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <h2 style="font-size:16px;font-weight:500">Avisos de hoje</h2>
        <span class="muted" style="font-size:14px">${v.todayLong}</span>
      </div>
      <button type="button" class="btn btn-line btn-sm" onClick=${v.toggleNotif}>Ocultar</button>
    </div>
    ${v.noNotifs && html`<p class="muted" style="font-size:14px;padding-top:12px">Tudo em dia. Nenhum aniversário, confirmação ou acompanhamento pendente.</p>`}
    ${v.notifs.map((n) => html`
      <div class="row">
        <span class=${n.chipCls}>${n.kind}</span>
        <div style="flex:1 1 260px;min-width:0">
          <div style="font-size:15px;font-weight:500">${n.text}</div>
          <div class="muted" style="font-size:13px">${n.sub}</div>
        </div>
        ${n.hasHref
          ? html`<a class="btn btn-wa btn-sm" href=${n.href} target="_blank" rel="noopener" onClick=${n.act}>${IconWa()} ${n.btn}</a>`
          : html`<span class="chip">Sem WhatsApp cadastrado</span><button type="button" class="btn btn-line btn-sm" onClick=${n.act}>Marcar como feito</button>`}
      </div>`)}
  </section>`;
}

function viewClientes(v) {
  return html`
  <div style=${ROW2}>
    <section class="card" style=${FORMCARD}>
      <div><span class="kicker">Cadastro</span><h2 class="serif" style="font-size:30px">${v.cfTitle}</h2></div>
      <label class="lbl">Nome completo
        <input class="in" value=${v.cf.name} onInput=${v.on.cfName} placeholder="Ex.: Mariana Souza" />
      </label>
      <label class="lbl">WhatsApp (com DDD)
        <input class="in" type="tel" value=${v.cf.phone} onInput=${v.on.cfPhone} placeholder="(11) 98888-7777" />
      </label>
      <label class="lbl">Data de aniversário
        <input class="in" type="date" value=${v.cf.birth} onInput=${v.on.cfBirth} />
      </label>
      <label class="lbl">Observações
        <textarea class="in" value=${v.cf.notes} onInput=${v.on.cfNotes} placeholder="Alergias, preferências, tipo de pele…" style="min-height:90px"></textarea>
      </label>
      ${v.hasCfErr && html`<p class="err" role="alert">${v.cfErr}</p>`}
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <button type="button" class="btn" onClick=${v.saveClient} style="flex:1 1 auto">Salvar cliente</button>
        ${v.cfEditing && html`<button type="button" class="btn btn-line" onClick=${v.cancelClient}>Cancelar</button>`}
      </div>
    </section>
    <section class="card" style="flex:999 1 540px">
      <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;padding-bottom:16px">
        <div><span class="kicker">${v.clientCountLabel}</span><h2 class="serif" style="font-size:30px">Clientes</h2></div>
        <label class="lbl" style="flex:0 1 280px">Buscar
          <input class="in" type="search" value=${v.search} onInput=${v.on.search} placeholder="Nome ou telefone" />
        </label>
      </div>
      ${v.noClients && html`<p class="muted" style=${EMPTY}>Nenhuma cliente encontrada. Use o formulário ao lado para cadastrar.</p>`}
      ${v.clientsView.map((c) => html`
        <div class="row">
          <span class="av" aria-hidden="true">${c.initials}</span>
          <div style="flex:1 1 200px;min-width:0;display:flex;flex-direction:column;gap:2px">
            <span style="font-size:16px;font-weight:500">${c.name}</span>
            <span class="muted" style="font-size:14px">${c.phoneFmt}</span>
            ${c.hasNotes && html`<span class="muted" style="font-size:13px">${c.notes}</span>`}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${c.hasBirth && html`<span class=${c.birthCls}>${IconCake} ${c.birthLabel}</span>`}
            <span class="chip">${c.visitsLabel}</span>
          </div>
          ${c.notConfirming
            ? html`<div style="display:flex;gap:6px">
                ${c.hasWa && html`<a class="btn btn-line btn-sm btn-icon" href=${c.waHref} target="_blank" rel="noopener" aria-label="Abrir conversa no WhatsApp">${IconWa(18)}</a>`}
                <button type="button" class="btn btn-line btn-sm btn-icon" onClick=${c.edit} aria-label="Editar cliente">${IconEdit}</button>
                <button type="button" class="btn btn-line btn-sm btn-icon" onClick=${c.askDel} aria-label="Excluir cliente">${IconTrash}</button>
              </div>`
            : html`<div style="display:flex;gap:6px;align-items:center">
                <span style="font-size:13px">Excluir?</span>
                <button type="button" class="btn btn-danger btn-sm" onClick=${c.del}>Excluir</button>
                <button type="button" class="btn btn-line btn-sm" onClick=${v.cancelDel}>Não</button>
              </div>`}
        </div>`)}
    </section>
  </div>`;
}

function viewAgenda(v) {
  const stat = (k, n, d) => html`<div class="card" style="padding:20px"><span class="kicker">${k}</span><div class="serif" style="font-size:36px">${n}</div><span class="muted" style="font-size:13px">${d}</span></div>`;
  return html`
  <div style="display:flex;flex-direction:column;gap:24px">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">
      ${stat('Hoje', v.stats.todayCount, 'atendimentos agendados')}
      ${stat('Previsto hoje', v.stats.todayValue, 'soma dos agendamentos do dia')}
      ${stat('Realizado no mês', v.stats.monthValue, 'serviços marcados como feitos')}
      ${stat('A confirmar', v.stats.toConfirm, 'agendamentos futuros')}
    </div>
    <div style=${ROW2}>
      <div style="flex:1 1 320px;display:flex;flex-direction:column;gap:24px;min-width:0">
        <section class="card" style="display:flex;flex-direction:column;gap:16px">
          <div><span class="kicker">Novo</span><h2 class="serif" style="font-size:30px">Agendamento</h2></div>
          ${v.agendaBlocked && html`<p class="chip chip-wait" style="white-space:normal;border-radius:10px;padding:10px 12px;font-size:13px">Cadastre ao menos uma cliente e um serviço para agendar.</p>`}
          <label class="lbl">Cliente
            <select class="in" value=${v.af.clientId} onChange=${v.on.afClient}>
              <option value="">Selecione a cliente</option>
              ${v.clientOpts.map((o) => html`<option value=${o.id}>${o.name}</option>`)}
            </select>
          </label>
          <label class="lbl">Serviço
            <select class="in" value=${v.af.serviceId} onChange=${v.on.afService}>
              <option value="">Selecione o serviço</option>
              ${v.serviceOpts.map((o) => html`<option value=${o.id}>${o.label}</option>`)}
            </select>
          </label>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
            <label class="lbl">Data<input class="in" type="date" value=${v.af.date} onInput=${v.on.afDate} /></label>
            <label class="lbl">Horário<input class="in" type="time" value=${v.af.time} onInput=${v.on.afTime} /></label>
          </div>
          <label class="lbl">Valor (R$)
            <input class="in" type="number" min="0" step="0.01" value=${v.af.price} onInput=${v.on.afPrice} placeholder="Preenchido pelo serviço" />
          </label>
          <label class="lbl">Observações
            <input class="in" value=${v.af.notes} onInput=${v.on.afNotes} placeholder="Opcional" />
          </label>
          ${v.hasAfErr && html`<p class="err" role="alert">${v.afErr}</p>`}
          <button type="button" class="btn" onClick=${v.saveAppt}>Agendar</button>
        </section>
      </div>
      <section class="card" style="flex:999 1 560px">
        <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;padding-bottom:16px">
          <div><span class="kicker">${v.apptCountLabel}</span><h2 class="serif" style="font-size:30px">Agenda</h2></div>
          <div role="group" aria-label="Filtro" style="display:flex;flex-wrap:wrap;gap:6px">
            ${v.agFilters.map((f) => html`<button type="button" class=${f.cls} onClick=${f.go}>${f.label}</button>`)}
          </div>
        </div>
        ${v.noAppts && html`<p class="muted" style=${EMPTY}>Nenhum agendamento neste filtro.</p>`}
        ${v.apptsView.map((a) => html`
          <div class=${a.rowCls}>
            <div style="width:68px;flex:none;display:flex;flex-direction:column;align-items:center;padding:8px 0;border-radius:12px;background:#F6F2EE">
              <span class="kicker" style="font-size:11px">${a.wd}</span>
              <span class="serif" style="font-size:24px;line-height:1.1">${a.day}</span>
              <span style="font-size:13px">${a.time}</span>
            </div>
            <div style="flex:1 1 200px;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font-size:16px;font-weight:500">${a.client}</span>
              <span class="muted" style="font-size:14px">${a.service} · ${a.price}</span>
              ${a.hasNotes && html`<span class="muted" style="font-size:13px">${a.notes}</span>`}
            </div>
            <span class=${a.statusCls}>${a.statusLabel}</span>
            <label style="display:inline-flex;align-items:center;gap:8px;min-height:44px;cursor:pointer;font-size:14px">
              <input type="checkbox" checked=${a.done} onChange=${a.toggle} style="width:20px;height:20px;accent-color:#2B2522;margin:0" />
              Serviço feito
            </label>
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
              ${a.showConfirmWa && html`<a class="btn btn-wa btn-sm" href=${a.confirmHref} target="_blank" rel="noopener" onClick=${a.confirm}>Confirmar</a>`}
              ${a.showConfirmNoWa && html`<button type="button" class="btn btn-soft btn-sm" onClick=${a.confirm}>Marcar confirmado</button>`}
              ${a.showFollowWa && html`<a class="btn btn-wa btn-sm" href=${a.followHref} target="_blank" rel="noopener" onClick=${a.follow}>Acompanhar</a>`}
              ${a.showFollowNoWa && html`<button type="button" class="btn btn-soft btn-sm" onClick=${a.follow}>Marcar acompanhado</button>`}
              ${a.notConfirming
                ? html`<button type="button" class="btn btn-line btn-sm btn-icon" onClick=${a.askDel} aria-label="Excluir agendamento">${IconTrash}</button>`
                : html`<button type="button" class="btn btn-danger btn-sm" onClick=${a.del}>Excluir</button><button type="button" class="btn btn-line btn-sm" onClick=${v.cancelDel}>Não</button>`}
            </div>
          </div>`)}
      </section>
    </div>
  </div>`;
}

function viewServicos(v) {
  return html`
  <div style=${ROW2}>
    <section class="card" style=${FORMCARD}>
      <div><span class="kicker">Cadastro</span><h2 class="serif" style="font-size:30px">${v.sfTitle}</h2></div>
      <label class="lbl">Nome do serviço
        <input class="in" value=${v.sf.name} onInput=${v.on.sfName} placeholder="Ex.: Limpeza de pele" />
      </label>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
        <label class="lbl">Valor (R$)<input class="in" type="number" min="0" step="0.01" value=${v.sf.price} onInput=${v.on.sfPrice} placeholder="0,00" /></label>
        <label class="lbl">Duração (min)<input class="in" type="number" min="0" step="5" value=${v.sf.duration} onInput=${v.on.sfDuration} placeholder="60" /></label>
      </div>
      ${v.hasSfErr && html`<p class="err" role="alert">${v.sfErr}</p>`}
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <button type="button" class="btn" onClick=${v.saveService} style="flex:1 1 auto">Salvar serviço</button>
        ${v.sfEditing && html`<button type="button" class="btn btn-line" onClick=${v.cancelService}>Cancelar</button>`}
      </div>
    </section>
    <section class="card" style="flex:999 1 540px">
      <div style="padding-bottom:16px"><span class="kicker">${v.serviceCountLabel}</span><h2 class="serif" style="font-size:30px">Serviços</h2></div>
      ${v.noServices && html`<p class="muted" style=${EMPTY}>Nenhum serviço cadastrado ainda.</p>`}
      ${v.servicesView.map((s) => html`
        <div class="row">
          <div style="flex:1 1 220px;min-width:0;display:flex;flex-direction:column;gap:2px">
            <span style="font-size:16px;font-weight:500">${s.name}</span>
            <span class="muted" style="font-size:14px">${s.durationLabel} · ${s.countLabel}</span>
          </div>
          <span class="serif" style="font-size:24px">${s.priceLabel}</span>
          ${s.notConfirming
            ? html`<div style="display:flex;gap:6px">
                <button type="button" class="btn btn-line btn-sm btn-icon" onClick=${s.edit} aria-label="Editar serviço">${IconEdit}</button>
                <button type="button" class="btn btn-line btn-sm btn-icon" onClick=${s.askDel} aria-label="Excluir serviço">${IconTrash}</button>
              </div>`
            : html`<div style="display:flex;gap:6px;align-items:center">
                <button type="button" class="btn btn-danger btn-sm" onClick=${s.del}>Excluir</button>
                <button type="button" class="btn btn-line btn-sm" onClick=${v.cancelDel}>Não</button>
              </div>`}
        </div>`)}
    </section>
  </div>`;
}

function viewAniversarios(v) {
  return html`
  <div style=${ROW2}>
    <section class="card" style="flex:999 1 540px">
      <div style="padding-bottom:16px"><span class="kicker">${v.bdayMonthLabel}</span><h2 class="serif" style="font-size:30px">Aniversários</h2><p class="muted" style="font-size:13px;padding-top:4px">O texto de parabéns é editado na aba Mensagens.</p></div>
      ${v.noBdays && html`<p class="muted" style=${EMPTY}>Cadastre a data de aniversário das clientes na aba Clientes para receber os avisos aqui.</p>`}
      ${v.bdaysView.map((b) => html`
        <div class=${b.rowCls}>
          <span class="av" aria-hidden="true">${b.initials}</span>
          <div style="flex:1 1 200px;min-width:0;display:flex;flex-direction:column;gap:2px">
            <span style="font-size:16px;font-weight:500">${b.name}</span>
            <span class="muted" style="font-size:14px">${b.date} · ${b.age}</span>
          </div>
          <span class=${b.whenCls}>${b.when}</span>
          ${b.sent && html`<span class="chip chip-ok">Mensagem enviada</span>`}
          ${b.canSend && html`<a class="btn btn-wa btn-sm" href=${b.href} target="_blank" rel="noopener" onClick=${b.send}>${IconWa()} Enviar parabéns</a>`}
          ${b.noPhone && html`<span class="chip">Sem WhatsApp</span>`}
        </div>`)}
    </section>
  </div>`;
}

function viewFinancas(v) {
  const f = v.fin;
  const kpi = (k, n, d, cls) => html`<div class="card" style="padding:20px"><span class="kicker">${k}</span><div class=${cls || 'serif'} style="font-size:36px">${n}</div><span class="muted" style="font-size:13px">${d}</span></div>`;
  return html`
  <div style="display:flex;flex-direction:column;gap:24px">
    <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px">
      <div><span class="kicker">${f.periodLabel}</span><h2 class="serif" style="font-size:36px">Finanças</h2></div>
      <div role="group" aria-label="Período" style="display:flex;flex-wrap:wrap;gap:6px">
        ${v.finFilters.map((x) => html`<button type="button" class=${x.cls} onClick=${x.go}>${x.label}</button>`)}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">
      ${kpi('Receita total', f.revenue, f.countLabel)}
      ${kpi('Gastos fixos', f.expTotal, f.expNote)}
      ${kpi('Lucro estimado', f.profit, f.profitNote, f.profitCls)}
      ${kpi('Ticket médio', f.ticket, 'por atendimento realizado')}
    </div>
    <div style=${ROW2}>
      <section class="card" style="flex:1 1 420px">
        <div style="padding-bottom:16px"><span class="kicker">Serviços realizados</span><h3 class="serif" style="font-size:28px">Receita por serviço</h3></div>
        ${f.noSvc && html`<p class="muted" style=${EMPTY}>Nenhum serviço marcado como feito neste período.</p>`}
        ${f.svcRows.map((r) => html`
          <div style="display:flex;flex-direction:column;gap:8px;padding:14px 0;border-top:1px solid #F0E9E4">
            <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px">
              <span style="font-size:15px;font-weight:500">${r.name}</span>
              <span style="font-size:15px;font-weight:500">${r.total}</span>
            </div>
            <div class="bar"><span style=${{ width: r.barW }}></span></div>
            <span class="muted" style="font-size:13px">${r.countLabel} · ${r.share} da receita</span>
          </div>`)}
      </section>
      <section class="card" style="flex:1 1 360px">
        <div style="padding-bottom:16px"><span class="kicker">Quem mais investe</span><h3 class="serif" style="font-size:28px">Top clientes</h3></div>
        ${f.noCli && html`<p class="muted" style=${EMPTY}>Nenhum atendimento realizado neste período.</p>`}
        ${f.cliRows.map((r) => html`
          <div class="row">
            <span class="serif" style="width:20px;font-size:22px;color:#6B5F58">${r.pos}</span>
            <span class="av" aria-hidden="true">${r.initials}</span>
            <div style="flex:1 1 140px;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font-size:15px;font-weight:500">${r.name}</span>
              <span class="muted" style="font-size:13px">${r.countLabel}</span>
            </div>
            <span style="font-size:15px;font-weight:500">${r.total}</span>
          </div>`)}
      </section>
    </div>
    <div style=${ROW2}>
      <section class="card" style=${FORMCARD}>
        <div><span class="kicker">Cadastro</span><h3 class="serif" style="font-size:28px">${v.efTitle}</h3></div>
        <label class="lbl">Descrição
          <input class="in" value=${v.ef.name} onInput=${v.on.efName} placeholder="Ex.: Aluguel, energia, produtos" />
        </label>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
          <label class="lbl">Valor mensal (R$)<input class="in" type="number" min="0" step="0.01" value=${v.ef.amount} onInput=${v.on.efAmount} placeholder="0,00" /></label>
          <label class="lbl">Dia de vencimento<input class="in" type="number" min="1" max="31" value=${v.ef.day} onInput=${v.on.efDay} placeholder="Opcional" /></label>
        </div>
        ${v.hasEfErr && html`<p class="err" role="alert">${v.efErr}</p>`}
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <button type="button" class="btn" onClick=${v.saveExpense} style="flex:1 1 auto">Salvar gasto</button>
          ${v.efEditing && html`<button type="button" class="btn btn-line" onClick=${v.cancelExpense}>Cancelar</button>`}
        </div>
      </section>
      <section class="card" style="flex:999 1 540px">
        <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;padding-bottom:16px">
          <div><span class="kicker">Todo mês</span><h3 class="serif" style="font-size:28px">Gastos fixos</h3></div>
          <span style="font-size:15px">Total mensal: <strong>${f.expMonthly}</strong></span>
        </div>
        ${f.noExp && html`<p class="muted" style=${EMPTY}>Nenhum gasto fixo cadastrado. Adicione aluguel, contas, produtos e outros custos mensais.</p>`}
        ${f.expRows.map((x) => html`
          <div class="row">
            <div style="flex:1 1 200px;min-width:0;display:flex;flex-direction:column;gap:2px">
              <span style="font-size:15px;font-weight:500">${x.name}</span>
              <span class="muted" style="font-size:13px">${x.dayLabel}</span>
            </div>
            <span style="font-size:15px;font-weight:500">${x.amount}</span>
            ${x.notConfirming
              ? html`<div style="display:flex;gap:6px">
                  <button type="button" class="btn btn-line btn-sm btn-icon" onClick=${x.edit} aria-label="Editar gasto">${IconEdit}</button>
                  <button type="button" class="btn btn-line btn-sm btn-icon" onClick=${x.askDel} aria-label="Excluir gasto">${IconTrash}</button>
                </div>`
              : html`<div style="display:flex;gap:6px;align-items:center">
                  <button type="button" class="btn btn-danger btn-sm" onClick=${x.del}>Excluir</button>
                  <button type="button" class="btn btn-line btn-sm" onClick=${v.cancelDel}>Não</button>
                </div>`}
          </div>`)}
      </section>
    </div>
  </div>`;
}

function viewMensagens(v) {
  return html`
  <div style="display:flex;flex-direction:column;gap:24px">
    <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px">
      <div style="max-width:640px">
        <span class="kicker">WhatsApp</span>
        <h2 class="serif" style="font-size:36px">Mensagens</h2>
        <p class="muted" style="font-size:14px;padding-top:4px">Textos prontos que abrem no WhatsApp da cliente. Use {nome}, {studio} e, nas de agendamento, {servico}, {data}, {dia}, {hora} e {valor}.</p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
        <label class="lbl" style="width:240px">Nome do studio<input class="in" value=${v.studio} onInput=${v.on.studio} /></label>
        <button type="button" class="btn btn-line" onClick=${v.resetTpl}>Restaurar textos padrão</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px">
      ${v.autoMsgs.map((m) => html`
        <section class="card" style="display:flex;flex-direction:column;gap:12px">
          <div><span class="kicker">Automática</span><h3 class="serif" style="font-size:26px">${m.title}</h3><p class="muted" style="font-size:13px">${m.when}</p></div>
          <label class="lbl">Texto<textarea class="in" value=${m.text} onInput=${m.onText} style="min-height:150px"></textarea></label>
          <div style="background:#F6F2EE;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px">
            <span class="kicker">Prévia</span>
            <p style="font-size:14px;line-height:1.55;white-space:pre-wrap">${m.preview}</p>
          </div>
        </section>`)}
    </div>
    <div style=${ROW2}>
      <section class="card" style=${FORMCARD}>
        <div><span class="kicker">Cadastro</span><h3 class="serif" style="font-size:28px">${v.qfTitle}</h3></div>
        <label class="lbl">Título<input class="in" value=${v.qf.title} onInput=${v.on.qfTitle} placeholder="Ex.: Lembrete de retorno" /></label>
        <label class="lbl">Mensagem<textarea class="in" value=${v.qf.text} onInput=${v.on.qfText} placeholder="Olá, {nome}! ..." style="min-height:140px"></textarea></label>
        ${v.hasQfErr && html`<p class="err" role="alert">${v.qfErr}</p>`}
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <button type="button" class="btn" onClick=${v.saveQuick} style="flex:1 1 auto">Salvar mensagem</button>
          ${v.qfEditing && html`<button type="button" class="btn btn-line" onClick=${v.cancelQuick}>Cancelar</button>`}
        </div>
      </section>
      <section class="card" style="flex:999 1 540px">
        <div style="padding-bottom:16px">
          <span class="kicker">${v.quickCountLabel}</span>
          <h3 class="serif" style="font-size:28px">Mensagens rápidas</h3>
          <p class="muted" style="font-size:13px;padding-top:4px">Escolha a cliente e envie com um toque.</p>
        </div>
        ${v.noQuick && html`<p class="muted" style=${EMPTY}>Nenhuma mensagem rápida cadastrada.</p>`}
        ${v.quickView.map((q) => html`
          <div style="display:flex;flex-direction:column;gap:12px;padding:18px 0;border-top:1px solid #F0E9E4">
            <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:12px">
              <div style="flex:1 1 260px;min-width:0;display:flex;flex-direction:column;gap:4px">
                <span style="font-size:16px;font-weight:500">${q.title}</span>
                <span class="muted" style="font-size:14px;line-height:1.5;white-space:pre-wrap">${q.text}</span>
              </div>
              ${q.notConfirming
                ? html`<div style="display:flex;gap:6px">
                    <button type="button" class="btn btn-line btn-sm btn-icon" onClick=${q.edit} aria-label="Editar mensagem">${IconEdit}</button>
                    <button type="button" class="btn btn-line btn-sm btn-icon" onClick=${q.askDel} aria-label="Excluir mensagem">${IconTrash}</button>
                  </div>`
                : html`<div style="display:flex;gap:6px;align-items:center">
                    <button type="button" class="btn btn-danger btn-sm" onClick=${q.del}>Excluir</button>
                    <button type="button" class="btn btn-line btn-sm" onClick=${v.cancelDel}>Não</button>
                  </div>`}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end">
              <label class="lbl" style="flex:1 1 220px">Enviar para
                <select class="in" value=${q.to} onChange=${q.onTo}>
                  <option value="">Selecione a cliente</option>
                  ${v.clientOpts.map((o) => html`<option value=${o.id}>${o.name}</option>`)}
                </select>
              </label>
              ${q.hasHref && html`<a class="btn btn-wa" href=${q.href} target="_blank" rel="noopener">${IconWa()} Enviar no WhatsApp</a>`}
              ${q.noPhone && html`<span class="chip" style="margin-bottom:12px">Cliente sem WhatsApp</span>`}
            </div>
          </div>`)}
      </section>
    </div>
  </div>`;
}

function view(v) {
  if (v.showAuth) return viewAuth(v);
  return html`
  <div style="min-height:100vh">
    <header style="background:#fff;border-bottom:1px solid #ECE4DE">
      <div style="max-width:1180px;margin:0 auto;padding:14px 24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px">
        <span class="serif" style="font-size:30px;line-height:1">${v.studio}</span>
        <nav aria-label="Seções" style="display:flex;flex-wrap:wrap;gap:4px">
          ${v.tabs.map((t) => html`<button type="button" class=${t.cls} onClick=${t.go}>${t.label}${t.hasBadge && html`<span class="badge">${t.badge}</span>`}</button>`)}
        </nav>
        <div style="display:flex;gap:8px;align-items:center">
          <button type="button" class="btn btn-line btn-icon" aria-label="Avisos" onClick=${v.toggleNotif} style="position:relative">
            ${IconBell}
            ${v.hasNotifs && html`<span class="badge" style="position:absolute;top:-6px;right:-6px">${v.notifCount}</span>`}
          </button>
          <button type="button" class="btn btn-line btn-sm" onClick=${v.logout} style="min-height:44px">${IconOut} Sair</button>
        </div>
      </div>
    </header>
    <main style="max-width:1180px;margin:0 auto;padding:28px 24px 64px;display:flex;flex-direction:column;gap:24px">
      ${v.notifOpen && viewNotifs(v)}
      ${v.tabClientes && viewClientes(v)}
      ${v.tabAgenda && viewAgenda(v)}
      ${v.tabServicos && viewServicos(v)}
      ${v.tabAniversarios && viewAniversarios(v)}
      ${v.tabMensagens && viewMensagens(v)}
      ${v.tabFinancas && viewFinancas(v)}
    </main>
  </div>`;
}

/* ================= Segurança =================
 * - Senha nunca é guardada: deriva-se uma chave AES-256 com PBKDF2-SHA256 (310 mil iterações, sal aleatório).
 * - Todos os dados (clientes, agenda, serviços, mensagens) ficam criptografados com AES-GCM no aparelho.
 * - Senha errada = a descriptografia falha. 5 tentativas erradas bloqueiam o login por 5 minutos.
 * - Sessão trava sozinha após 15 minutos sem uso; ao sair, os dados saem da memória.
 */
const STORE_KEY = 'optimus-v2';
const LEGACY_KEY = 'studio-estetica-v1';
const ITER = 310000;
const IDLE_MS = 15 * 60 * 1000;
const MAX_TRIES = 5;
const LOCK_MS = 5 * 60 * 1000;
const te = new TextEncoder();
const td = new TextDecoder();
const b64 = (u8) => { let s = ''; u8.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(pass, salt, iter) {
  const base = await crypto.subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function seal(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(obj))));
  return { iv: b64(iv), ct: b64(ct) };
}
async function unseal(key, box) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.ct));
  return JSON.parse(td.decode(pt));
}
function readStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; } }
function writeStore(v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); return true; } catch (e) { return false; } }

class App extends Component {
  constructor(props) {
    super(props);
    const store = readStore();
    let legacy = null;
    try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'); } catch (e) { legacy = null; }
    this.legacy = !store && legacy && legacy.auth ? legacy : null;
    this.key = null;
    this.lastActive = Date.now();
    const auth = store && store.auth ? store.auth : (this.legacy ? { user: this.legacy.auth.user, legacy: true } : null);
    Object.assign(this.state, {
      auth, logged: false, busy: false, loginErr: '',
      clients: [], services: [], appts: [], expenses: [], studio: 'Optimus', tpl: this._defaultTpl()
    });
  }

  componentDidMount() {
    this._touch = () => { this.lastActive = Date.now(); };
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) => window.addEventListener(ev, this._touch, { passive: true }));
    this._idle = setInterval(() => {
      if (this.state.logged && Date.now() - this.lastActive > IDLE_MS) this.lock('Sessão bloqueada por inatividade. Entre novamente.');
    }, 20000);
  }
  componentWillUnmount() {
    clearInterval(this._idle);
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) => window.removeEventListener(ev, this._touch));
  }

  _pickData(s) { return { studio: s.studio, clients: s.clients, services: s.services, appts: s.appts, tpl: s.tpl, expenses: s.expenses, quick: s.quick }; }

  componentDidUpdate() {
    if (!this.key || !this.state.logged) return;
    clearTimeout(this._saveT);
    this._saveT = setTimeout(() => this.save(), 250);
  }

  save() {
    const key = this.key;
    if (!key) return Promise.resolve();
    const data = this._pickData(this.state);
    return seal(key, data).then((box) => {
      const st = readStore();
      if (!st) return;
      st.data = box;
      writeStore(st);
    });
  }

  lock(msg) {
    clearTimeout(this._saveT);
    if (this.key && this.state.logged) this.save();
    this.key = null;
    this.setState({
      logged: false, busy: false, loginErr: msg || '', lf: { user: '', pass: '', pass2: '' },
      clients: [], services: [], appts: [], expenses: [], cf: this._emptyCF(), sf: this._emptySF(), af: this._emptyAF(),
      search: '', confirmDel: '', tab: 'clientes'
    });
  }

  async doAuth() {
    const s = this.state;
    if (s.busy) return;
    const u = s.lf.user.trim();
    const p = s.lf.pass;
    const st = readStore();

    if (st && st.lock && Date.now() < st.lock.until) {
      const min = Math.ceil((st.lock.until - Date.now()) / 60000);
      return this.setState({ loginErr: 'Muitas tentativas erradas. Tente novamente em ' + min + ' min.' });
    }

    // Primeiro acesso ou migração da versão antiga: cria senha forte e criptografa tudo.
    if (!s.auth || s.auth.legacy) {
      if (s.auth && s.auth.legacy) {
        const old = this.legacy.auth;
        if (u.toLowerCase() !== String(old.user).toLowerCase() || this._hash(p) !== old.hash) {
          return this.setState({ loginErr: 'Usuário ou senha incorretos.' });
        }
        if (p.length < 8) {
          return this.setState({ loginErr: 'Por segurança, a senha agora precisa de pelo menos 8 caracteres. Crie uma nova abaixo.', auth: null });
        }
      } else {
        if (!u) return this.setState({ loginErr: 'Escolha um nome de usuário.' });
        if (p.length < 8) return this.setState({ loginErr: 'A senha precisa ter pelo menos 8 caracteres.' });
        if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return this.setState({ loginErr: 'Use letras e números na senha.' });
        if (p !== s.lf.pass2) return this.setState({ loginErr: 'As senhas não coincidem.' });
      }
      this.setState({ busy: true, loginErr: '' });
      try {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await deriveKey(p, salt, ITER);
        const src = this.legacy || {};
        const data = {
          studio: src.studio && src.studio !== 'Studio Estética' ? src.studio : 'Optimus',
          clients: src.clients || [], services: src.services || [], appts: src.appts || [], expenses: src.expenses || [], quick: src.quick || this._defaultQuick(),
          tpl: Object.assign({}, this._defaultTpl(), src.tpl || {})
        };
        const box = await seal(key, data);
        if (!writeStore({ v: 2, auth: { user: u, salt: b64(salt), iter: ITER }, data: box, lock: { n: 0, until: 0 } })) {
          return this.setState({ busy: false, loginErr: 'Não foi possível salvar neste navegador (modo privado?).' });
        }
        try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* ignore */ }
        this.legacy = null;
        this.key = key;
        this.lastActive = Date.now();
        this.setState(Object.assign({ auth: { user: u }, logged: true, busy: false, loginErr: '', lf: { user: '', pass: '', pass2: '' } }, data));
      } catch (e) {
        this.setState({ busy: false, loginErr: 'Este navegador não suporta a criptografia necessária. Atualize o navegador.' });
      }
      return;
    }

    // Login normal: a senha só é aceita se conseguir descriptografar os dados.
    this.setState({ busy: true, loginErr: '' });
    let data = null, key = null;
    try {
      if (u.toLowerCase() === String(st.auth.user).toLowerCase()) {
        key = await deriveKey(p, unb64(st.auth.salt), st.auth.iter || ITER);
        data = await unseal(key, st.data);
      }
    } catch (e) { data = null; }

    const fresh = readStore() || st;
    if (!data) {
      const lock = fresh.lock || { n: 0, until: 0 };
      lock.n = (lock.n || 0) + 1;
      let msg = 'Usuário ou senha incorretos.';
      if (lock.n >= MAX_TRIES) { lock.until = Date.now() + LOCK_MS; lock.n = 0; msg = 'Muitas tentativas erradas. Login bloqueado por 5 minutos.'; }
      else msg += ' Restam ' + (MAX_TRIES - lock.n) + ' tentativa(s).';
      fresh.lock = lock;
      writeStore(fresh);
      return this.setState({ busy: false, loginErr: msg });
    }
    fresh.lock = { n: 0, until: 0 };
    writeStore(fresh);
    this.key = key;
    this.lastActive = Date.now();
    this.setState(Object.assign({ logged: true, busy: false, loginErr: '', lf: { user: '', pass: '', pass2: '' } }, {
      studio: data.studio || 'Optimus', clients: data.clients || [], services: data.services || [], appts: data.appts || [], expenses: data.expenses || [], quick: data.quick || this._defaultQuick(),
      tpl: Object.assign({}, this._defaultTpl(), data.tpl || {})
    }));
  }

  render() {
    const v = this.renderVals();
    v.logout = () => this.lock('');
    if (v.isSetup) v.authSubtitle = 'Primeiro acesso: crie seu usuário e uma senha com no mínimo 8 caracteres, letras e números.';
    if (this.state.auth && this.state.auth.legacy) v.authSubtitle = 'Entre com sua senha atual para ativar a criptografia dos dados.';
    if (this.state.busy) v.authBtn = 'Verificando…';
    v.busy = this.state.busy;
    return view(v);
  }
}

render(html`<${App} />`, document.getElementById('app'));
