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
  _emptyAF() { return { clientId: '', serviceIds: [], date: this._iso(new Date()), time: '', price: '', notes: '' }; }
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
  _joinNames(list) {
    if (list.length <= 1) return list[0] || '';
    return list.slice(0, -1).join(', ') + ' e ' + list[list.length - 1];
  }
  _items(a, sById) {
    var list = Array.isArray(a.items) && a.items.length ? a.items : [{ serviceId: a.serviceId, name: a.serviceName, price: Number(a.price) || 0 }];
    return list.map(function (it) { var sv = sById[it.serviceId]; return { serviceId: it.serviceId, name: sv ? sv.name : (it.name || 'Serviço removido'), price: Number(it.price) || 0 }; });
  }
  saveAppt() {
    var s = this.state, f = s.af;
    var ids = (f.serviceIds || []).filter(function (id) { return s.services.some(function (x) { return x.id === id; }); });
    if (!f.clientId) return this.setState({ afErr: 'Selecione a cliente.' });
    if (!ids.length) return this.setState({ afErr: 'Selecione ao menos um serviço.' });
    if (!f.date || !f.time) return this.setState({ afErr: 'Informe a data e o horário.' });
    var c = s.clients.find(function (x) { return x.id === f.clientId; }) || {};
    var items = ids.map(function (id) { var sv = s.services.find(function (x) { return x.id === id; }); return { serviceId: id, name: sv.name, price: Number(sv.price) || 0 }; });
    var sum = items.reduce(function (t, it) { return t + it.price; }, 0);
    var price = f.price === '' ? sum : Number(f.price) || 0;
    var a = { id: this._uid(), clientId: f.clientId, serviceId: ids[0], serviceIds: ids, items: items, clientName: c.name,
      serviceName: items.map(function (it) { return it.name; }).join(' + '),
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
      afToggleService: function (id) {
        self.setState(function (st) {
          var cur = st.af.serviceIds || [];
          var ids = cur.indexOf(id) >= 0 ? cur.filter(function (x) { return x !== id; }) : cur.concat([id]);
          var sum = ids.reduce(function (t, x) { return t + (sById[x] ? Number(sById[x].price) || 0 : 0); }, 0);
          return { af: Object.assign({}, st.af, { serviceIds: ids, price: ids.length ? String(Math.round(sum * 100) / 100) : '' }) };
        });
      },
      search: function (e) { self.setState({ search: e.target.value }); },
      studio: function (e) { self.setState({ studio: e.target.value }); },
      tplBday: this._bind('tpl', 'bday'), tplConfirm: this._bind('tpl', 'confirm'), tplFollow: this._bind('tpl', 'follow')
    };

    var vars = function (a) {
      var c = cById[a.clientId] || {};
      var names = self._items(a, sById).map(function (it) { return it.name; });
      return { nome: self._first(c.name || a.clientName), servico: self._joinNames(names) || 'atendimento',
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
    s.appts.forEach(function (a) { self._items(a, sById).forEach(function (it) { svcCount[it.serviceId] = (svcCount[it.serviceId] || 0) + 1; }); });
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
        href: href, sent: sent, canSend: !!href && !sent, canResend: !!href && sent, noPhone: !href,
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
      var its = self._items(a, sById), total = Number(a.price) || 0;
      var base = its.reduce(function (t, it) { return t + it.price; }, 0);
      its.forEach(function (it) {
        var k = it.serviceId || it.name;
        if (!bySvc[k]) bySvc[k] = { name: it.name, count: 0, total: 0 };
        bySvc[k].count++; bySvc[k].total += base > 0 ? total * it.price / base : total / its.length;
      });
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
      doneCount: doneP.length === 1 ? '1 atendimento' : doneP.length + ' atendimentos', noDone: doneP.length === 0,
      doneRows: doneP.slice().sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time); }).map(function (a) {
        var c = cById[a.clientId], key = 'fin-' + a.id;
        return { wd: self._wd(a.date), day: self._dm(a.date), time: a.time,
          client: c ? c.name : (a.clientName || 'Cliente removida'), service: self._items(a, sById).map(function (it) { return it.name; }).join(' + '),
          price: self._money(a.price),
          undo: function () { self.patchAppt(a.id, { done: false, followed: false }); },
          askDel: function () { self.setState({ confirmDel: key }); },
          del: function () { self.setState(function (st) { return { appts: st.appts.filter(function (x) { return x.id !== a.id; }), confirmDel: '' }; }); },
          confirming: s.confirmDel === key, notConfirming: s.confirmDel !== key };
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
      serviceOpts: s.services.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'pt-BR'); }).map(function (v) {
        var sel = (s.af.serviceIds || []).indexOf(v.id) >= 0;
        return { id: v.id, label: v.name + ' · ' + self._money(v.price), selected: sel, pressed: sel ? 'true' : 'false',
          cls: sel ? 'pill pill-on' : 'pill', toggle: function () { on.afToggleService(v.id); } };
      }),
      afSelLabel: (function () {
        var ids = (s.af.serviceIds || []).filter(function (id) { return sById[id]; });
        if (!ids.length) return 'Toque para escolher um ou mais serviços';
        var sum = ids.reduce(function (t, id) { return t + (Number(sById[id].price) || 0); }, 0);
        return (ids.length === 1 ? '1 serviço' : ids.length + ' serviços') + ' · ' + self._money(sum);
      })(),
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
          <div class="lbl" role="group" aria-label="Serviços">Serviços
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${v.serviceOpts.map((o) => html`<button type="button" class=${o.cls} aria-pressed=${o.pressed} onClick=${o.toggle}>${o.label}</button>`)}
            </div>
            <span class="muted" style="font-size:13px">${v.afSelLabel}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
            <label class="lbl">Data<input class="in" type="date" value=${v.af.date} onInput=${v.on.afDate} /></label>
            <label class="lbl">Horário<input class="in" type="time" value=${v.af.time} onInput=${v.on.afTime} /></label>
          </div>
          <label class="lbl">Valor (R$)
            <input class="in" type="number" min="0" step="0.01" value=${v.af.price} onInput=${v.on.afPrice} placeholder="Soma dos serviços" />
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
                ? html`<button type="button" class="btn btn-line btn-sm btn-icon" onClick=${a.askDel} aria-label="Excluir agendamento" title="Excluir agendamento">${IconTrash}</button>`
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
          ${b.canResend && html`<a class="btn btn-line btn-sm" href=${b.href} target="_blank" rel="noopener">${IconWa()} Reenviar</a>`}
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
    <section class="card">
      <div style="padding-bottom:16px">
        <span class="kicker">${f.doneCount} no período</span>
        <h3 class="serif" style="font-size:28px">Atendimentos realizados</h3>
        <p class="muted" style="font-size:13px;padding-top:4px">Estes atendimentos entram no faturamento. Lançou algum por engano ou como teste? Desmarque como feito ou exclua.</p>
      </div>
      ${f.noDone && html`<p class="muted" style=${EMPTY}>Nenhum atendimento realizado neste período.</p>`}
      ${f.doneRows.map((d) => html`
        <div class="row">
          <div style="width:68px;flex:none;display:flex;flex-direction:column;align-items:center;padding:8px 0;border-radius:12px;background:#F6F2EE">
            <span class="kicker" style="font-size:11px">${d.wd}</span>
            <span class="serif" style="font-size:22px;line-height:1.1">${d.day}</span>
            <span style="font-size:13px">${d.time}</span>
          </div>
          <div style="flex:1 1 200px;min-width:0;display:flex;flex-direction:column;gap:2px">
            <span style="font-size:15px;font-weight:500">${d.client}</span>
            <span class="muted" style="font-size:13px">${d.service}</span>
          </div>
          <span style="font-size:15px;font-weight:500">${d.price}</span>
          ${d.notConfirming
            ? html`<div style="display:flex;gap:6px">
                <button type="button" class="btn btn-line btn-sm" onClick=${d.undo}>Desmarcar feito</button>
                <button type="button" class="btn btn-line btn-sm btn-icon" onClick=${d.askDel} aria-label="Excluir atendimento">${IconTrash}</button>
              </div>`
            : html`<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                <span style="font-size:13px">Excluir este atendimento?</span>
                <button type="button" class="btn btn-danger btn-sm" onClick=${d.del}>Excluir</button>
                <button type="button" class="btn btn-line btn-sm" onClick=${v.cancelDel}>Não</button>
              </div>`}
        </div>`)}
    </section>
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

/* ================= Nuvem (Supabase): login, contas e dados ================= */
const SB_URL = 'https://zyflcdxpysbbnaxjwgol.supabase.co';
const SB_KEY = 'sb_publishable_b-FadwYCRsau11TDXEOZcQ_mstZJsRG';
const SITE_URL = location.origin + location.pathname;
const sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

const pwOk = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /[0-9]/.test(p);
const PW_RULE = 'A senha precisa ter pelo menos 8 caracteres, com letras e números.';
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const USER_DOMAIN = 'optimus.invalid';
const userOk = (u) => /^[a-z0-9][a-z0-9._-]{2,29}$/.test(u);
const normUser = (u) => u.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.');
// Clientes entram com usuário; o administrador também pode entrar com o e-mail dele.
const loginId = (u) => { const v = u.trim().toLowerCase(); return v.includes('@') ? v : normUser(v) + '@' + USER_DOMAIN; };
const fmtBR = (iso) => { if (!iso) return '—'; const p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };
const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const addMonth = (iso) => { const p = iso.split('-').map(Number); const d = new Date(p[0], p[1], p[2]); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const moneyBR = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const authErr = (e) => {
  const m = (e && e.message) || '';
  if (/invalid login|invalid credentials/i.test(m)) return 'Usuário ou senha incorretos.';
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (/same.*password|different from the old/i.test(m)) return 'A nova senha precisa ser diferente da atual.';
  if (/weak|pwned|leaked/i.test(m)) return 'Essa senha é fraca ou já vazou em outros sites. Escolha outra.';
  return m || 'Não foi possível concluir. Tente novamente.';
};
async function fnError(error) {
  try { const j = await error.context.json(); return j.error || error.message; } catch (e) { return (error && error.message) || 'Erro inesperado.'; }
}

/* --- leitura dos dados antigos salvos neste aparelho (nunca são apagados) --- */
const te = new TextEncoder(), td = new TextDecoder();
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function openLocalV2(pass) {
  const st = JSON.parse(localStorage.getItem('optimus-v2') || 'null');
  if (!st || !st.auth || !st.data) return null;
  const base = await crypto.subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: unb64(st.auth.salt), iterations: st.auth.iter || 310000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(st.data.iv) }, key, unb64(st.data.ct));
  return JSON.parse(td.decode(pt));
}
function localDataKind() {
  try {
    if (localStorage.getItem('optimus-v2')) return 'v2';
    const v1 = JSON.parse(localStorage.getItem('studio-estetica-v1') || 'null');
    if (v1 && ((v1.clients || []).length || (v1.appts || []).length || (v1.services || []).length)) return 'v1';
  } catch (e) { /* ignore */ }
  return '';
}

/* ================= App do studio (dados na nuvem) ================= */
class StudioApp extends Component {
  constructor(props) {
    super(props);
    const d = props.initial || {};
    this.version = props.version || 0;
    Object.assign(this.state, {
      auth: { user: props.email }, logged: true,
      studio: d.studio || props.studioName || 'Optimus',
      clients: d.clients || [], services: d.services || [], appts: d.appts || [],
      expenses: d.expenses || [], quick: d.quick || this._defaultQuick(),
      tpl: Object.assign({}, this._defaultTpl(), d.tpl || {}),
      syncMsg: '', importKind: (d.clients || []).length || (d.appts || []).length ? '' : localDataKind(),
      importOpen: false, importPass: '', importErr: '', importBusy: false
    });
    this.dirty = false;
  }
  _pickData(s) { return { studio: s.studio, clients: s.clients, services: s.services, appts: s.appts, tpl: s.tpl, expenses: s.expenses, quick: s.quick }; }
  componentDidMount() {
    this._flush = () => { if (this.dirty) this.save(); };
    window.addEventListener('pagehide', this._flush);
    document.addEventListener('visibilitychange', this._flush);
  }
  componentWillUnmount() {
    window.removeEventListener('pagehide', this._flush);
    document.removeEventListener('visibilitychange', this._flush);
    clearTimeout(this._t);
  }
  componentDidUpdate(prevProps, prevState) {
    const keys = ['studio', 'clients', 'services', 'appts', 'tpl', 'expenses', 'quick'];
    if (!keys.some((k) => prevState[k] !== this.state[k])) return;
    if (this._applyingRemote) { this._applyingRemote = false; return; }
    this.dirty = true;
    clearTimeout(this._t);
    this._t = setTimeout(() => this.save(), 700);
  }
  async save() {
    if (this._saving) { this._again = true; return; }
    this._saving = true; this.dirty = false;
    const { data, error } = await sb.rpc('save_studio_data', { p_data: this._pickData(this.state), p_version: this.version });
    this._saving = false;
    if (error) {
      if (/conflito_versao/.test(error.message)) {
        const r = await sb.from('studio_data').select('data, version').single();
        if (r.data) {
          this.version = r.data.version;
          this._applyingRemote = true;
          const d = r.data.data || {};
          this.setState({ syncMsg: 'Os dados foram alterados em outro aparelho e foram atualizados aqui. Confira sua última alteração.',
            clients: d.clients || [], services: d.services || [], appts: d.appts || [], expenses: d.expenses || [],
            quick: d.quick || this._defaultQuick(), tpl: Object.assign({}, this._defaultTpl(), d.tpl || {}), studio: d.studio || this.state.studio });
        }
      } else if (/conta_inativa/.test(error.message)) {
        this.props.onRefresh();
      } else {
        this.dirty = true;
        this.setState({ syncMsg: 'Sem conexão: não foi possível salvar agora. Tentaremos de novo automaticamente.' });
        clearTimeout(this._t); this._t = setTimeout(() => this.save(), 5000);
      }
    } else {
      this.version = data;
      if (this.state.syncMsg && /conexão/.test(this.state.syncMsg)) this.setState({ syncMsg: '' });
    }
    if (this._again) { this._again = false; this.save(); }
  }
  async doImport() {
    this.setState({ importBusy: true, importErr: '' });
    let d = null;
    try {
      if (this.state.importKind === 'v2') d = await openLocalV2(this.state.importPass);
      else d = JSON.parse(localStorage.getItem('studio-estetica-v1') || 'null');
    } catch (e) { d = null; }
    if (!d) return this.setState({ importBusy: false, importErr: 'Senha antiga incorreta. Use a senha que você usava neste aparelho antes.' });
    this.setState({
      importBusy: false, importOpen: false, importKind: '', importPass: '',
      syncMsg: 'Dados importados para a nuvem. Eles também continuam guardados neste aparelho como cópia de segurança.',
      clients: d.clients || [], services: d.services || [], appts: d.appts || [], expenses: d.expenses || [],
      quick: d.quick || this.state.quick, tpl: Object.assign({}, this._defaultTpl(), d.tpl || {}),
      studio: d.studio && d.studio !== 'Studio Estética' ? d.studio : this.state.studio
    });
  }
  render() {
    const v = this.renderVals();
    v.logout = async () => { clearTimeout(this._t); if (this.dirty) await this.save(); this.props.onLogout(); };
    const s = this.state;
    const banner = html`
      ${s.syncMsg && html`<div style="max-width:1180px;margin:16px auto 0;padding:0 24px"><div class="card" role="status" style="padding:14px 18px;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap"><span style="font-size:14px">${s.syncMsg}</span><button type="button" class="btn btn-line btn-sm" onClick=${() => this.setState({ syncMsg: '' })}>Ok</button></div></div>`}
      ${s.importKind && html`<div style="max-width:1180px;margin:16px auto 0;padding:0 24px"><div class="card" style="padding:18px 20px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap">
          <div><strong style="font-weight:500">Encontramos dados salvos neste aparelho.</strong><div class="muted" style="font-size:14px">Importe para a nuvem e acesse de qualquer aparelho. Nada é apagado daqui.</div></div>
          ${!s.importOpen && html`<div style="display:flex;gap:8px"><button type="button" class="btn" onClick=${() => (s.importKind === 'v1' ? this.doImport() : this.setState({ importOpen: true }))}>Importar dados</button><button type="button" class="btn btn-line" onClick=${() => this.setState({ importKind: '' })}>Agora não</button></div>`}
        </div>
        ${s.importOpen && html`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">
          <label class="lbl" style="flex:1 1 240px">Senha antiga deste aparelho<input class="in" type="password" value=${s.importPass} onInput=${(e) => this.setState({ importPass: e.target.value })} /></label>
          <button type="button" class="btn" disabled=${s.importBusy} onClick=${() => this.doImport()}>${s.importBusy ? 'Importando…' : 'Importar'}</button>
        </div>`}
        ${s.importErr && html`<p class="err" role="alert">${s.importErr}</p>`}
      </div></div>`}`;
    const page = view(v);
    return html`<div>${banner}${page}</div>`;
  }
}

/* ================= Painel do administrador ================= */
const emptyAdminForm = () => ({ id: '', username: '', origUsername: '', studio_name: '', owner_name: '', email: '', phone: '', plan: 'Mensal', monthly_fee: '', paid_until: addMonth(todayISO()), notes: '' });

class AdminPanel extends PreactComponent {
  constructor(props) {
    super(props);
    this.state = { accounts: [], loading: true, form: emptyAdminForm(), err: '', busy: false, cred: null, q: '', filter: 'todos', confirm: '', copied: false };
  }
  componentDidMount() { this.load(); }
  async load() {
    const { data, error } = await sb.from('accounts').select('*').order('created_at', { ascending: false });
    this.setState({ accounts: data || [], loading: false, err: error ? 'Não foi possível carregar as contas.' : '' });
  }
  set(k) { return (e) => { const v = e.target.value; this.setState((st) => ({ form: Object.assign({}, st.form, { [k]: v }) })); }; }
  async submit() {
    const f = this.state.form;
    const username = normUser(f.username);
    if (!f.studio_name.trim()) return this.setState({ err: 'Informe o nome do negócio.' });
    if (!userOk(username)) return this.setState({ err: 'Usuário inválido: use de 3 a 30 letras minúsculas, números, ponto, hífen ou _ (sem espaços e sem acentos).' });
    if (f.email.trim() && !emailOk(f.email.trim())) return this.setState({ err: 'E-mail de contato inválido.' });
    this.setState({ busy: true, err: '' });
    if (f.id) {
      if (username !== f.origUsername) {
        const r = await sb.functions.invoke('admin-users', { body: { action: 'set_username', account_id: f.id, username } });
        if (r.error) return this.setState({ busy: false, err: await fnError(r.error) });
      }
      const { error } = await sb.from('accounts').update({
        email: f.email.trim().toLowerCase() || null,
        studio_name: f.studio_name.trim(), owner_name: f.owner_name.trim() || null, phone: f.phone.trim() || null,
        plan: f.plan.trim() || 'Mensal', monthly_fee: Number(f.monthly_fee) || 0, paid_until: f.paid_until || null,
        notes: f.notes.trim() || null, updated_at: new Date().toISOString()
      }).eq('id', f.id);
      this.setState({ busy: false, err: error ? 'Não foi possível salvar.' : '', form: error ? f : emptyAdminForm() });
      return this.load();
    }
    const { data, error } = await sb.functions.invoke('admin-users', { body: Object.assign({ action: 'create' }, f, { username, monthly_fee: Number(f.monthly_fee) || 0 }) });
    if (error) return this.setState({ busy: false, err: await fnError(error) });
    this.setState({ busy: false, form: emptyAdminForm(), copied: false,
      cred: { studio: data.account.studio_name, owner: data.account.owner_name, phone: data.account.phone, user: data.account.username, pass: data.temp_password, isNew: true } });
    this.load();
  }
  async patch(id, values) {
    const { error } = await sb.from('accounts').update(Object.assign({ updated_at: new Date().toISOString() }, values)).eq('id', id);
    if (error) this.setState({ err: 'Não foi possível atualizar a conta.' });
    this.setState({ confirm: '' });
    this.load();
  }
  async reset(a) {
    this.setState({ busy: true, err: '', confirm: '' });
    const { data, error } = await sb.functions.invoke('admin-users', { body: { action: 'reset', account_id: a.id } });
    if (error) return this.setState({ busy: false, err: await fnError(error) });
    this.setState({ busy: false, copied: false, cred: { studio: a.studio_name, owner: a.owner_name, phone: a.phone, user: data.username || a.username, pass: data.temp_password, isNew: false } });
    this.load();
  }
  async copy(key, text, inputId) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; }
    if (!ok) {
      // Alternativa para navegadores que bloqueiam a área de transferência: seleciona o texto para copiar manualmente.
      const el = document.getElementById(inputId);
      if (el) { el.focus(); el.select(); try { ok = document.execCommand('copy'); } catch (e) { ok = false; } }
    }
    this.setState({ copied: ok ? key : 'manual-' + key });
    clearTimeout(this._copyT); this._copyT = setTimeout(() => this.setState({ copied: false }), 2500);
  }
  credText(c) {
    return 'Olá' + (c.owner ? ', ' + c.owner.split(' ')[0] : '') + '! ' + (c.isNew ? 'Seu acesso ao Optimus está pronto.' : 'Geramos uma nova senha para seu acesso ao Optimus.') +
      '\n\nSite: ' + SITE_URL + '\nUsuário: ' + c.user + '\nSenha provisória: ' + c.pass + '\n\nNo primeiro acesso você vai criar sua própria senha.';
  }
  render() {
    const s = this.state, f = s.form, today = todayISO();
    const in7 = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })();
    const rows = s.accounts.map((a) => {
      const expired = a.paid_until && a.paid_until < today;
      const active = a.status === 'ativo' && !expired;
      const soon = active && a.paid_until && a.paid_until <= in7;
      return Object.assign({}, a, { expired, active, soon,
        statusLabel: a.status === 'bloqueado' ? 'Bloqueado' : expired ? 'Vencido' : soon ? 'Vence em breve' : 'Ativo',
        statusCls: a.status === 'bloqueado' ? 'chip chip-done' : expired ? 'chip chip-wait' : soon ? 'chip chip-wait' : 'chip chip-ok' });
    });
    const q = s.q.trim().toLowerCase();
    const shown = rows.filter((a) => (!q || (a.studio_name + ' ' + (a.owner_name || '') + ' ' + (a.username || '') + ' ' + (a.email || '')).toLowerCase().includes(q)) &&
      (s.filter === 'todos' || (s.filter === 'ativos' && a.active) || (s.filter === 'vencidos' && a.expired && a.status === 'ativo') || (s.filter === 'bloqueados' && a.status === 'bloqueado')));
    const activeRows = rows.filter((a) => a.active);
    const stat = (k, n, d) => html`<div class="card" style="padding:20px"><span class="kicker">${k}</span><div class="serif" style="font-size:36px">${n}</div><span class="muted" style="font-size:13px">${d}</span></div>`;
    const filters = [['todos', 'Todos'], ['ativos', 'Ativos'], ['vencidos', 'Vencidos'], ['bloqueados', 'Bloqueados']];
    const c = s.cred;
    const waHref = c && c.phone ? (() => { let d = c.phone.replace(/\D/g, ''); if (d.length <= 11) d = '55' + d; return 'https://wa.me/' + d + '?text=' + encodeURIComponent(this.credText(c)); })() : '';
    return html`
    <div style="min-height:100vh">
      <header style="background:#fff;border-bottom:1px solid #ECE4DE">
        <div style="max-width:1180px;margin:0 auto;padding:14px 24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px">
          <div style="display:flex;align-items:baseline;gap:12px"><span class="serif" style="font-size:30px;line-height:1">Optimus</span><span class="kicker">Administração</span></div>
          <button type="button" class="btn btn-line btn-sm" onClick=${this.props.onLogout} style="min-height:44px">${IconOut} Sair</button>
        </div>
      </header>
      <main style="max-width:1180px;margin:0 auto;padding:28px 24px 64px;display:flex;flex-direction:column;gap:24px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">
          ${stat('Clientes ativos', activeRows.length, 'studios com acesso liberado')}
          ${stat('Receita mensal', moneyBR(activeRows.reduce((t, a) => t + Number(a.monthly_fee || 0), 0)), 'soma das mensalidades ativas')}
          ${stat('Vencem em 7 dias', rows.filter((a) => a.soon).length, 'renove para não bloquear')}
          ${stat('Vencidos ou bloqueados', rows.filter((a) => !a.active).length, 'sem acesso no momento')}
        </div>

        ${c && html`<section class="card" style="border-color:#7F4F43;display:flex;flex-direction:column;gap:14px">
          <div><span class="kicker">${c.isNew ? 'Acesso criado' : 'Nova senha gerada'}</span><h2 class="serif" style="font-size:28px">${c.studio}</h2>
            <p class="muted" style="font-size:13px">Envie estes dados para o cliente. A senha provisória só aparece agora; no primeiro acesso ele cria a própria senha.</p></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
            ${[['user', 'Usuário', c.user, 'cred-user'], ['pass', 'Senha provisória', c.pass, 'cred-pass']].map(([k, label, val, id]) => html`
              <div style="background:#F6F2EE;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:8px">
                <label class="kicker" for=${id}>${label}</label>
                <div style="display:flex;gap:8px;align-items:center">
                  <input id=${id} class="in" readonly value=${val} onFocus=${(e) => e.target.select()} style="flex:1;min-width:0;font-size:20px;font-weight:500;letter-spacing:.04em;background:#fff" />
                  <button type="button" class="btn btn-sm" style="min-height:44px" onClick=${() => this.copy(k, val, id)}>${s.copied === k ? 'Copiado!' : 'Copiar'}</button>
                </div>
                ${s.copied === 'manual-' + k && html`<span class="muted" style="font-size:12px">Texto selecionado: use Ctrl+C (ou Copiar no celular).</span>`}
              </div>`)}
          </div>
          <div style="background:#F6F2EE;border-radius:12px;padding:16px;font-size:15px;line-height:1.7;white-space:pre-wrap;word-break:break-word">${this.credText(c)}</div>
          <textarea id="cred-msg" readonly aria-hidden="true" tabindex="-1" style="position:absolute;left:-9999px;width:1px;height:1px">${this.credText(c)}</textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn" onClick=${() => this.copy('msg', this.credText(c), 'cred-msg')}>${s.copied === 'msg' ? 'Copiado!' : 'Copiar mensagem completa'}</button>
            ${waHref && html`<a class="btn btn-wa" href=${waHref} target="_blank" rel="noopener">${IconWa()} Enviar no WhatsApp</a>`}
            <button type="button" class="btn btn-line" onClick=${() => this.setState({ cred: null })}>Fechar</button>
          </div>
        </section>`}

        <div style=${ROW2}>
          <section class="card" style=${FORMCARD}>
            <div><span class="kicker">${f.id ? 'Editar' : 'Novo cliente'}</span><h2 class="serif" style="font-size:30px">${f.id ? 'Editar acesso' : 'Criar acesso'}</h2></div>
            <label class="lbl">Nome do negócio<input class="in" value=${f.studio_name} onInput=${this.set('studio_name')} placeholder="Ex.: Studio Bella" /></label>
            <label class="lbl">Responsável<input class="in" value=${f.owner_name} onInput=${this.set('owner_name')} placeholder="Nome do responsável" /></label>
            <label class="lbl">Usuário de acesso<input class="in" value=${f.username} onInput=${this.set('username')} autocapitalize="none" autocomplete="off" spellcheck="false" placeholder="Ex.: studiobella" /></label>
            <p class="muted" style="font-size:12px;margin-top:-8px">Letras minúsculas, números, ponto, hífen ou _. Sem espaços e sem acentos.</p>
            <label class="lbl">E-mail de contato (opcional)<input class="in" type="email" value=${f.email} onInput=${this.set('email')} placeholder="cliente@email.com" /></label>
            <label class="lbl">WhatsApp<input class="in" type="tel" value=${f.phone} onInput=${this.set('phone')} placeholder="(11) 98888-7777" /></label>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
              <label class="lbl">Plano<input class="in" value=${f.plan} onInput=${this.set('plan')} placeholder="Mensal" /></label>
              <label class="lbl">Mensalidade (R$)<input class="in" type="number" min="0" step="0.01" value=${f.monthly_fee} onInput=${this.set('monthly_fee')} placeholder="0,00" /></label>
            </div>
            <label class="lbl">Pago até<input class="in" type="date" value=${f.paid_until} onInput=${this.set('paid_until')} /></label>
            <label class="lbl">Observações<textarea class="in" value=${f.notes} onInput=${this.set('notes')} style="min-height:80px"></textarea></label>
            ${s.err && html`<p class="err" role="alert">${s.err}</p>`}
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn" disabled=${s.busy} onClick=${() => this.submit()} style="flex:1 1 auto">${s.busy ? 'Salvando…' : f.id ? 'Salvar alterações' : 'Criar acesso'}</button>
              ${f.id && html`<button type="button" class="btn btn-line" onClick=${() => this.setState({ form: emptyAdminForm(), err: '' })}>Cancelar</button>`}
            </div>
          </section>

          <section class="card" style="flex:999 1 560px">
            <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;padding-bottom:16px">
              <div><span class="kicker">${rows.length === 1 ? '1 cliente' : rows.length + ' clientes'}</span><h2 class="serif" style="font-size:30px">Acessos</h2></div>
              <label class="lbl" style="flex:0 1 260px">Buscar<input class="in" type="search" value=${s.q} onInput=${(e) => this.setState({ q: e.target.value })} placeholder="Studio, nome ou e-mail" /></label>
            </div>
            <div role="group" aria-label="Filtro" style="display:flex;flex-wrap:wrap;gap:6px;padding-bottom:12px">
              ${filters.map((x) => html`<button type="button" class=${s.filter === x[0] ? 'pill pill-on' : 'pill'} onClick=${() => this.setState({ filter: x[0] })}>${x[1]}</button>`)}
            </div>
            ${s.loading && html`<p class="muted" style=${EMPTY}>Carregando…</p>`}
            ${!s.loading && !shown.length && html`<p class="muted" style=${EMPTY}>Nenhum acesso por aqui ainda. Crie o primeiro no formulário ao lado.</p>`}
            ${shown.map((a) => html`
              <div class="row">
                <span class="av" aria-hidden="true">${(a.studio_name || '?').slice(0, 2)}</span>
                <div style="flex:1 1 220px;min-width:0;display:flex;flex-direction:column;gap:2px">
                  <span style="font-size:16px;font-weight:500">${a.studio_name}</span>
                  <span class="muted" style="font-size:13px;word-break:break-all">${a.username ? 'Usuário: ' + a.username : 'Sem usuário: clique em editar para definir'}${a.owner_name ? ' · ' + a.owner_name : ''}</span>
                  <span class="muted" style="font-size:13px">${a.plan} · ${moneyBR(a.monthly_fee)} · pago até ${fmtBR(a.paid_until)}</span>
                </div>
                <span class=${a.statusCls}>${a.statusLabel}</span>
                ${s.confirm === a.id
                  ? html`<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                      <span style="font-size:13px">${a.status === 'bloqueado' ? 'Liberar acesso?' : 'Bloquear acesso?'}</span>
                      <button type="button" class="btn btn-sm ${a.status === 'bloqueado' ? '' : 'btn-danger'}" onClick=${() => this.patch(a.id, { status: a.status === 'bloqueado' ? 'ativo' : 'bloqueado' })}>Confirmar</button>
                      <button type="button" class="btn btn-line btn-sm" onClick=${() => this.setState({ confirm: '' })}>Não</button>
                    </div>`
                  : html`<div style="display:flex;gap:6px;flex-wrap:wrap">
                      <button type="button" class="btn btn-soft btn-sm" onClick=${() => this.patch(a.id, { status: 'ativo', paid_until: addMonth(a.paid_until && a.paid_until > today ? a.paid_until : today) })}>Renovar +1 mês</button>
                      <button type="button" class="btn btn-line btn-sm" onClick=${() => this.setState({ confirm: a.id })}>${a.status === 'bloqueado' ? 'Liberar' : 'Bloquear'}</button>
                      <button type="button" class="btn btn-line btn-sm" disabled=${s.busy} onClick=${() => this.reset(a)}>Nova senha</button>
                      <button type="button" class="btn btn-line btn-sm btn-icon" aria-label="Editar acesso" onClick=${() => this.setState({ err: '', form: { id: a.id, username: a.username || '', origUsername: a.username || '', studio_name: a.studio_name || '', owner_name: a.owner_name || '', email: a.email || '', phone: a.phone || '', plan: a.plan || 'Mensal', monthly_fee: String(a.monthly_fee ?? ''), paid_until: a.paid_until || '', notes: a.notes || '' } })}>${IconEdit}</button>
                    </div>`}
              </div>`)}
          </section>
        </div>
      </main>
    </div>`;
  }
}

/* ================= Raiz: rotas de autenticação ================= */
class Root extends PreactComponent {
  constructor(props) {
    super(props);
    this.state = { screen: 'loading', email: '', pass: '', pass2: '', err: '', info: '', busy: false, acct: null, data: null, version: 0, userEmail: '' };
  }
  componentDidMount() {
    sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') this.setState({ screen: 'recovery', err: '', info: '', pass: '', pass2: '' });
      if (event === 'SIGNED_OUT') this.setState({ screen: 'login', acct: null, data: null });
    });
    this.route();
  }
  async route(info) {
    if (this.state.screen === 'recovery') return;
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      const { data: hasAdmin } = await sb.rpc('admin_exists');
      return this.setState({ screen: hasAdmin === false ? 'setup' : 'login', busy: false, info: info || '' });
    }
    const { data: rows, error } = await sb.rpc('my_account');
    const acct = rows && rows[0];
    if (error || !acct) return this.setState({ screen: 'noaccount', busy: false, userEmail: session.user.email });
    if (acct.must_change_password && !acct.is_admin) return this.setState({ screen: 'change', acct, busy: false, pass: '', pass2: '', err: '' });
    if (acct.is_admin && !acct.id) return this.setState({ screen: 'admin', acct, busy: false });
    if (!acct.active) return this.setState({ screen: 'blocked', acct, busy: false });
    const { data: sd } = await sb.from('studio_data').select('data, version').maybeSingle();
    this.setState({ screen: 'studio', acct, data: (sd && sd.data) || {}, version: (sd && sd.version) || 0, busy: false, userEmail: session.user.email });
  }
  async login() {
    const user = this.state.email.trim();
    if (!user || !this.state.pass) return this.setState({ err: 'Informe seu usuário e sua senha.' });
    this.setState({ busy: true, err: '', info: '' });
    const { error } = await sb.auth.signInWithPassword({ email: loginId(user), password: this.state.pass });
    if (error) return this.setState({ busy: false, err: authErr(error) });
    this.setState({ pass: '' });
    this.route();
  }
  async forgot() {
    const email = this.state.email.trim().toLowerCase();
    if (!emailOk(email)) return this.setState({ err: 'Informe o e-mail da sua conta.' });
    this.setState({ busy: true, err: '' });
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL });
    this.setState({ busy: false, err: error ? authErr(error) : '', info: error ? '' : 'Se este e-mail tiver uma conta, você vai receber um link para criar uma nova senha. Confira também a caixa de spam.' });
  }
  async newPassword(fromRecovery) {
    const { pass, pass2 } = this.state;
    if (!pwOk(pass)) return this.setState({ err: PW_RULE });
    if (pass !== pass2) return this.setState({ err: 'As senhas não coincidem.' });
    this.setState({ busy: true, err: '' });
    const { error } = await sb.auth.updateUser({ password: pass });
    if (error) return this.setState({ busy: false, err: authErr(error) });
    await sb.rpc('password_changed');
    if (fromRecovery) history.replaceState(null, '', SITE_URL);
    this.setState({ screen: 'loading', pass: '', pass2: '' });
    this.route();
  }
  async setup() {
    const email = this.state.email.trim().toLowerCase();
    const { pass, pass2 } = this.state;
    if (!emailOk(email)) return this.setState({ err: 'Informe um e-mail válido.' });
    if (!pwOk(pass)) return this.setState({ err: PW_RULE });
    if (pass !== pass2) return this.setState({ err: 'As senhas não coincidem.' });
    this.setState({ busy: true, err: '' });
    const { error } = await sb.functions.invoke('admin-users', { body: { action: 'bootstrap', email, password: pass } });
    if (error) return this.setState({ busy: false, err: await fnError(error) });
    const r = await sb.auth.signInWithPassword({ email, password: pass });
    if (r.error) return this.setState({ busy: false, err: authErr(r.error) });
    this.setState({ pass: '', pass2: '' });
    this.route();
  }
  async logout() {
    await sb.auth.signOut();
    this.setState({ screen: 'login', acct: null, data: null, email: '', pass: '', err: '', info: '' });
  }
  card(kicker, title, sub, body) {
    return html`<main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
      <div class="card" style="width:100%;max-width:420px;padding:40px;display:flex;flex-direction:column;gap:18px">
        <div style="display:flex;flex-direction:column;gap:6px;text-align:center">
          <span class="kicker">${kicker}</span>
          <h1 class="serif" style="font-size:40px;line-height:1.05">${title}</h1>
          ${sub && html`<p class="muted" style="font-size:15px">${sub}</p>`}
        </div>
        ${body}
        ${this.state.err && html`<p class="err" role="alert">${this.state.err}</p>`}
        ${this.state.info && html`<p role="status" style="font-size:14px;color:#2F5A3E;background:#E3EDE6;border-radius:10px;padding:10px 12px">${this.state.info}</p>`}
      </div></main>`;
  }
  render() {
    const s = this.state;
    const set = (k) => (e) => this.setState({ [k]: e.target.value });
    const enter = (fn) => (e) => { if (e.key === 'Enter') fn(); };
    const link = (label, fn) => html`<button type="button" onClick=${fn} style="background:none;border:0;padding:8px;font:inherit;font-size:14px;color:#7F4F43;text-decoration:underline;cursor:pointer;align-self:center">${label}</button>`;
    const pwFields = (onEnter) => html`
      <label class="lbl">Nova senha<input class="in" type="password" autocomplete="new-password" value=${s.pass} onInput=${set('pass')} /></label>
      <label class="lbl">Confirme a nova senha<input class="in" type="password" autocomplete="new-password" value=${s.pass2} onInput=${set('pass2')} onKeyDown=${enter(onEnter)} /></label>
      <p class="muted" style="font-size:12px">Mínimo de 8 caracteres, com letras e números.</p>`;

    if (s.screen === 'loading') return html`<main style="min-height:100vh;display:flex;align-items:center;justify-content:center"><span class="serif" style="font-size:36px">Optimus</span></main>`;
    if (s.screen === 'studio') return html`<${StudioApp} key=${s.acct.id} initial=${s.data} version=${s.version} studioName=${s.acct.studio_name} email=${s.userEmail} onLogout=${() => this.logout()} onRefresh=${() => this.route()} />`;
    if (s.screen === 'admin') return html`<${AdminPanel} onLogout=${() => this.logout()} />`;

    if (s.screen === 'login') return this.card('Área restrita', 'Optimus', 'Entre com seu usuário e senha.', html`
      <label class="lbl">Usuário<input class="in" autocomplete="username" autocapitalize="none" spellcheck="false" value=${s.email} onInput=${set('email')} /></label>
      <label class="lbl">Senha<input class="in" type="password" autocomplete="current-password" value=${s.pass} onInput=${set('pass')} onKeyDown=${enter(() => this.login())} /></label>
      <button type="button" class="btn" disabled=${s.busy} onClick=${() => this.login()}>${s.busy ? 'Entrando…' : 'Entrar'}</button>
      ${link('Esqueci minha senha', () => this.setState({ screen: 'forgot', err: '', info: '' }))}`);

    if (s.screen === 'forgot') return this.card('Recuperar acesso', 'Esqueci a senha', '', html`
      <p style="font-size:15px;line-height:1.6;text-align:center">Fale com o suporte do Optimus. Vamos gerar uma nova senha provisória para o seu usuário, e no próximo acesso você cria a sua.</p>
      ${link('Voltar para o login', () => this.setState({ screen: 'login', err: '', info: '' }))}`);

    if (s.screen === 'recovery') return this.card('Recuperar acesso', 'Nova senha', 'Crie uma nova senha para sua conta.', html`
      ${pwFields(() => this.newPassword(true))}
      <button type="button" class="btn" disabled=${s.busy} onClick=${() => this.newPassword(true)}>${s.busy ? 'Salvando…' : 'Salvar nova senha'}</button>`);

    if (s.screen === 'change') return this.card('Primeiro acesso', s.acct.studio_name || 'Optimus', 'Boas-vindas! Crie sua senha pessoal para continuar. A senha provisória deixa de valer.', html`
      ${pwFields(() => this.newPassword(false))}
      <button type="button" class="btn" disabled=${s.busy} onClick=${() => this.newPassword(false)}>${s.busy ? 'Salvando…' : 'Criar senha e entrar'}</button>
      ${link('Sair', () => this.logout())}`);

    if (s.screen === 'blocked') return this.card('Acesso suspenso', s.acct.studio_name || 'Optimus',
      s.acct.status === 'bloqueado' ? 'Seu acesso está bloqueado no momento.' : 'Sua assinatura venceu em ' + fmtBR(s.acct.paid_until) + '.', html`
      <p style="font-size:15px;line-height:1.6;text-align:center">Seus dados estão guardados com segurança. Fale com o suporte do Optimus para renovar e liberar o acesso.</p>
      <button type="button" class="btn btn-line" onClick=${() => this.route()}>Já renovei, verificar de novo</button>
      ${link('Sair', () => this.logout())}`);

    if (s.screen === 'noaccount') return this.card('Acesso', 'Optimus', 'Este login não tem um studio vinculado. Fale com o suporte do Optimus.', html`
      ${link('Sair', () => this.logout())}`);

    if (s.screen === 'setup') return this.card('Configuração inicial', 'Administrador', 'Crie a conta do administrador do Optimus. Ela gerencia os acessos dos studios. Esta tela só aparece uma vez.', html`
      <label class="lbl">E-mail do administrador<input class="in" type="email" autocomplete="username" value=${s.email} onInput=${set('email')} /></label>
      ${pwFields(() => this.setup())}
      <button type="button" class="btn" disabled=${s.busy} onClick=${() => this.setup()}>${s.busy ? 'Criando…' : 'Criar administrador'}</button>`);
    return null;
  }
}

render(html`<${Root} />`, document.getElementById('app'));
