'use strict';
// DOM overlay: HUD, hint text, modals, toasts.
const UI = {
  open: null,
  refreshT: 0,
  els: {},

  init() {
    const $ = (id) => document.getElementById(id);
    this.els = {
      cash: $('hud-cash'), city: $('hud-city'), hint: $('hint'), toasts: $('toasts'),
      upgrades: $('modal-upgrades'), staff: $('modal-staff'), help: $('modal-help'), msg: $('modal-msg'),
      upgradeRows: $('upgrade-rows'), staffRows: $('staff-rows'),
      btnUpg: $('btn-upgrades'), btnStaff: $('btn-staff'), btnSound: $('btn-sound'),
      msgTitle: $('msg-title'), msgBody: $('msg-body'),
    };
    this.els.btnUpg.addEventListener('click', () => this.toggle('upgrades'));
    this.els.btnStaff.addEventListener('click', () => this.toggle('staff'));
    $('btn-help').addEventListener('click', () => this.toggle('help'));
    this.els.btnSound.addEventListener('click', () => this.toggleSound());
    $('btn-reset').addEventListener('click', () => {
      if (confirm('Reset all progress and start over?')) { Game.reset(); this.close(); this.toast('Progress reset'); }
    });
    $('msg-ok').addEventListener('click', () => this.close());
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => this.close()));
    document.querySelectorAll('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) this.close(); }));
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') this.close();
      else if (e.code === 'KeyU') this.toggle('upgrades');
      else if (e.code === 'KeyH') this.toggle('staff');
      else if (e.code === 'KeyM') this.toggleSound();
      else if (e.key === '?') this.toggle('help');
    });
    Game.onToast = (m) => this.toast(m);
    Game.onDesk = (k) => { if (!this.open) this.show(k); };
    Game.onUnlock = () => { if (this.open === 'staff') this.renderStaff(); };
    Game.onFranchise = (city) => this.message('New city unlocked!', `<div>Your pizza empire grows.</div><div class="big">${city}</div><div>Pizzas sell for more here, but everything costs more too.</div>`);
    this.updateSoundBtn();
  },

  show(key) {
    this.close();
    this.open = key;
    this.els[key].classList.remove('hidden');
    Input.enabled = false; Input.keys = Object.create(null); Input.joy.active = false;
    if (key === 'upgrades') this.renderUpgrades();
    if (key === 'staff') this.renderStaff();
    if (key === 'help') { Game.s.seenHelp = true; }
  },
  toggle(key) { if (this.open === key) this.close(); else this.show(key); },
  close() {
    if (!this.open) return;
    this.els[this.open].classList.add('hidden');
    this.open = null;
    Input.enabled = true;
  },
  message(title, html) {
    this.close();
    this.els.msgTitle.textContent = title;
    this.els.msgBody.innerHTML = html;
    this.open = 'msg';
    this.els.msg.classList.remove('hidden');
    Input.enabled = false;
  },
  toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    this.els.toasts.appendChild(el);
    while (this.els.toasts.children.length > 3) this.els.toasts.firstChild.remove();
    setTimeout(() => el.remove(), 2700);
  },
  toggleSound() {
    Sfx.init(); Sfx.resume();
    Sfx.muted = !Sfx.muted; Game.s.muted = Sfx.muted; Game.save();
    this.updateSoundBtn();
  },
  updateSoundBtn() { this.els.btnSound.textContent = Sfx.muted ? '🔇' : '🔊'; },

  row({ ico, name, desc, lvl, btnText, enabled, maxed, onClick }) {
    const row = document.createElement('div'); row.className = 'row';
    row.innerHTML = `<div class="ico">${ico}</div><div class="info"><div class="name">${name}</div><div class="desc">${desc}</div><div class="lvl">${lvl}</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'btn' + (maxed ? ' max' : '');
    btn.textContent = btnText; btn.disabled = !enabled;
    btn.addEventListener('click', () => { if (onClick()) this.refreshOpen(); });
    row.appendChild(btn);
    return row;
  },

  renderUpgrades() {
    const g = Game, s = g.s, c = this.els.upgradeRows;
    c.innerHTML = '';
    const effect = {
      speed: () => `${Math.round(g.playerSpeed())} px/s`,
      capacity: () => `${g.playerCap()} pizzas`,
      profit: () => `${U.money(g.price())} per pizza`,
      ovenSpeed: () => `${g.bakeTime().toFixed(2)}s per pizza`,
      ovenCap: () => `${g.ovenPileCap()} pizzas`,
      marketing: () => `every ${g.spawnInterval().toFixed(1)}s`,
    };
    for (const key of Object.keys(CFG.UPGRADES)) {
      const u = CFG.UPGRADES[key];
      const maxed = g.upgradeMaxed(key);
      const cost = g.upgradeCost(key);
      c.appendChild(this.row({
        ico: u.ico, name: u.name, desc: u.desc,
        lvl: `Lv ${s.upg[key]}/${u.max} · ${effect[key]()}`,
        btnText: maxed ? 'MAX' : U.money(cost), enabled: !maxed && s.cash >= cost, maxed,
        onClick: () => g.buyUpgrade(key),
      }));
    }
  },

  renderStaff() {
    const g = Game, s = g.s, c = this.els.staffRows;
    c.innerHTML = '';
    for (const role of Object.keys(CFG.STAFF)) {
      const st = CFG.STAFF[role];
      const info = s.staff[role];
      const avail = g.staffAvailable(role);
      const hireCost = g.staffHireCost(role);
      const upCost = g.staffUpgradeCost(role);
      const label = `${st.name}${st.hire.length > 1 ? ` (${info.count}/${st.hire.length})` : ''}`;
      if (!avail) {
        c.appendChild(this.row({ ico: st.ico, name: label, desc: st.desc, lvl: 'Unlock the Dining Area first', btnText: 'Locked', enabled: false, maxed: true, onClick: () => false }));
        continue;
      }
      c.appendChild(this.row({
        ico: st.ico, name: label, desc: st.desc,
        lvl: info.count ? `Hired · ${info.count} on staff` : 'Not hired yet',
        btnText: hireCost === null ? (st.hire.length > 1 ? 'Full' : 'Hired') : 'Hire ' + U.money(hireCost), enabled: hireCost !== null && s.cash >= hireCost, maxed: hireCost === null,
        onClick: () => g.hireStaff(role),
      }));
      if (info.count > 0) {
        const eff = role === 'cashier' ? `${(CFG.CHECKOUT_TIME / (1 + 0.3 * info.level)).toFixed(2)}s checkout` : role === 'helper' ? `carries ${g.helperCap()}, ${Math.round(g.staffSpeed(role))} px/s` : `${g.cleanTime('cleaner').toFixed(2)}s per table`;
        c.appendChild(this.row({
          ico: '⭐', name: `${st.name} training`, desc: role === 'cashier' ? 'Faster checkout' : role === 'helper' ? 'Faster and carries more' : 'Cleans faster',
          lvl: `Lv ${info.level}/${st.upMax} · ${eff}`,
          btnText: upCost === null ? 'MAX' : U.money(upCost), enabled: upCost !== null && s.cash >= upCost, maxed: upCost === null,
          onClick: () => g.upgradeStaff(role),
        }));
      }
    }
  },

  refreshOpen() {
    if (this.open === 'upgrades') this.renderUpgrades();
    else if (this.open === 'staff') this.renderStaff();
  },

  update(dt) {
    const g = Game, s = g.s;
    this.els.cash.textContent = U.money(s.cash);
    this.els.city.textContent = `${g.cityName()} · ${s.stats.served} served`;
    this.els.hint.textContent = g.hint ? g.hint.text : '';
    // button attention: something affordable?
    const canUpg = Object.keys(CFG.UPGRADES).some((k) => !g.upgradeMaxed(k) && s.cash >= g.upgradeCost(k));
    const canHire = Object.keys(CFG.STAFF).some((k) => g.staffAvailable(k) && ((g.staffHireCost(k) !== null && s.cash >= g.staffHireCost(k)) || (s.staff[k].count > 0 && g.staffUpgradeCost(k) !== null && s.cash >= g.staffUpgradeCost(k))));
    this.els.btnUpg.classList.toggle('attention', canUpg);
    this.els.btnStaff.classList.toggle('attention', canHire);
    this.refreshT += dt;
    if (this.refreshT > 0.5) { this.refreshT = 0; this.refreshOpen(); }
  },
};
