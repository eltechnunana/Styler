(() => {
  const KEY_CLIENTS = 'st:clients';
  const KEY_ORDERS = 'st:orders';
  const KEY_SETTINGS = 'st:settings';
  const MEASURE_PREFIX = 'measurements:';

  function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }

  const clients = {
    all() {
      try {
        const raw = JSON.parse(localStorage.getItem(KEY_CLIENTS) || '[]');
        if (!Array.isArray(raw)) return [];
        let changed = false;
        const normalized = raw.map(c => {
          if (c && typeof c.name === 'object' && c.name !== null) {
            const nested = c.name;
            const name =
              typeof nested.name === 'string'
                ? nested.name
                : typeof nested === 'string'
                ? nested
                : String(nested.name || '');
            changed = true;
            return { ...c, name };
          }
          return c;
        });
        if (changed) {
          localStorage.setItem(KEY_CLIENTS, JSON.stringify(normalized));
        }
        return normalized;
      } catch {
        return [];
      }
    },
    save(list) { localStorage.setItem(KEY_CLIENTS, JSON.stringify(list)); },
    add(input) {
      if (!input) return null;
      const list = this.all();
      let c;
      if (typeof input === 'string') {
        c = { id: uid(), name: input };
      } else {
        const id = input.id || uid();
        const name =
          typeof input.name === 'string'
            ? input.name
            : String((input.name && input.name.name) || '');
        const phone = input.phone || '';
        const email = input.email || '';
        c = { id, name, phone, email };
      }
      list.push(c); this.save(list);
      return c;
    },
    update(id, data) {
      const list = this.all();
      const i = list.findIndex(c => c.id === id);
      if (i >= 0) { list[i] = { ...list[i], ...data }; this.save(list); return list[i]; }
      return null;
    },
    remove(id) {
      const client = this.all().find(c => c.id === id);
      const list = this.all().filter(c => c.id !== id);
      this.save(list);
      
      // Also clean up associated measurement data (both ID and name-based keys)
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(MEASURE_PREFIX)) {
          const keyClientId = key.replace(MEASURE_PREFIX, '').split('|')[0];
          // Check if this measurement belongs to the deleted client (by ID or name)
          if (keyClientId === id || (client && keyClientId === client.name)) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  };

  const measurements = {
    key(clientIdOrName, gender) {
      return `${MEASURE_PREFIX}${clientIdOrName}${gender ? '|' + gender : ''}`;
    },
    get(clientIdOrName, gender) {
      const raw = localStorage.getItem(this.key(clientIdOrName, gender));
      if (raw) return JSON.parse(raw);
      // Backward compatibility: legacy key without gender
      const legacy = localStorage.getItem(`${MEASURE_PREFIX}${clientIdOrName}`);
      return legacy ? JSON.parse(legacy) : null;
    },
    save(clientIdOrName, data, gender) {
      localStorage.setItem(this.key(clientIdOrName, gender), JSON.stringify(data));
    },
    genders(clientIdOrName) {
      return ['male','female','custom'].filter(g => localStorage.getItem(this.key(clientIdOrName, g)));
    },
    getLatest(clientIdOrName) {
      const sets = ['male','female','custom']
        .map(g => { const d = this.get(clientIdOrName, g); return d ? { gender: g, data: d } : null; })
        .filter(Boolean);
      if (!sets.length) {
        const legacy = this.get(clientIdOrName);
        return legacy ? { gender: legacy.gender || 'male', data: legacy } : null;
      }
      sets.sort((a,b) => new Date(b.data.savedAt || 0) - new Date(a.data.savedAt || 0));
      return sets[0];
    },
    migrateLegacy() {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(MEASURE_PREFIX) && !k.includes('|')) {
          try {
            const data = JSON.parse(localStorage.getItem(k) || 'null');
            if (!data) return;
            const clientKey = k.replace(MEASURE_PREFIX,'');
            const gender = data.gender || 'male';
            const newKey = this.key(clientKey, gender);
            if (!localStorage.getItem(newKey)) {
              localStorage.setItem(newKey, JSON.stringify(data));
            }
            localStorage.removeItem(k);
          } catch {}
        }
      });
    }
  };

  const orders = {
    all() { try { return JSON.parse(localStorage.getItem(KEY_ORDERS) || '[]'); } catch { return []; } },
    save(list) { localStorage.setItem(KEY_ORDERS, JSON.stringify(list)); },
    add(order) {
      const list = this.all();
      const o = { id: uid(), createdAt: new Date().toISOString(), status: 'pending', ...order };
      list.push(o); this.save(list); return o;
    },
    update(id, data) {
      const list = this.all();
      const i = list.findIndex(o => o.id === id);
      if (i >= 0) { list[i] = { ...list[i], ...data }; this.save(list); return list[i]; }
      return null;
    },
    remove(id) { const list = this.all().filter(o => o.id !== id); this.save(list); }
  };

  const settings = {
    get() { try { return JSON.parse(localStorage.getItem(KEY_SETTINGS) || '{}'); } catch { return {}; } },
    save(s) { localStorage.setItem(KEY_SETTINGS, JSON.stringify(s)); },
    clearAll() {
      localStorage.removeItem(KEY_CLIENTS);
      localStorage.removeItem(KEY_ORDERS);
      localStorage.removeItem(KEY_SETTINGS);
      // measurements entries use prefix; clear by scanning keys
      Object.keys(localStorage).forEach(k => { if (k.startsWith(MEASURE_PREFIX)) localStorage.removeItem(k); });
    },
    exportAll() {
      const data = {
        clients: clients.all(),
        orders: orders.all(),
        settings: settings.get(),
        measurements: Object.keys(localStorage)
          .filter(k => k.startsWith(MEASURE_PREFIX))
          .reduce((acc, k) => { acc[k.replace(MEASURE_PREFIX,'')] = JSON.parse(localStorage.getItem(k)||'null'); return acc; }, {})
      };
      return JSON.stringify(data, null, 2);
    }
  };

  window.ST = { clients, measurements, orders, settings, uid };
  // Apply saved theme to all pages on load
  try {
    const s = settings.get();
    const theme = s.theme || 'light';
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  } catch {}
  // Run one-time migration of legacy measurement keys into gender-specific keys
  try { measurements.migrateLegacy(); } catch {}
})();
