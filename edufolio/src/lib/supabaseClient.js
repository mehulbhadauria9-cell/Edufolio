/**
 * Edufolio Unified API & Realtime Client
 * Connects directly to the custom Express + MongoDB backend with full support
 * for Auth, OTP, Models, Edge Functions, RPCs, Storage, and Realtime WebSockets.
 */

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL !== undefined && import.meta.env.VITE_BACKEND_URL !== '')
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '')
  : '';

const WS_URL = BACKEND_URL
  ? BACKEND_URL.replace(/^http/i, 'ws') + '/ws'
  : (typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws` : 'ws://localhost:5000/ws');


const authListeners = new Set();

function getStoredToken() {
  return localStorage.getItem('edufolio_token') || null;
}

function getStoredSession() {
  const token = getStoredToken();
  const rawUser = localStorage.getItem('edufolio_user');
  if (!token || !rawUser) return null;
  try {
    const user = JSON.parse(rawUser);
    return {
      access_token: token,
      user
    };
  } catch (err) {
    return null;
  }
}

function notifyAuthChange(event, session) {
  authListeners.forEach((listener) => {
    try {
      listener(event, session);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
}

async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const sep = endpoint.includes('?') ? '&' : '?';
  const fetchUrl = `${BACKEND_URL}${endpoint}${isGet ? `${sep}_t=${Date.now()}` : ''}`;

  const response = await fetch(fetchUrl, {
    ...options,
    cache: 'no-store',
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorMsg = data?.error;
    if (!errorMsg) {
      if (response.status === 405 || (response.status === 404 && !BACKEND_URL)) {
        errorMsg = 'Backend server unreachable. The backend must be hosted and VITE_BACKEND_URL configured in Vercel Environment Variables.';
      } else {
        errorMsg = `Request failed with status ${response.status}`;
      }
    }
    return { data: null, error: new Error(errorMsg) };
  }

  return { data, error: null };
}

// Global WebSocket for Realtime Updates
let wsClient = null;
const realtimeSubscribers = new Map(); // channelName -> Set of handlers

function getWebSocket() {
  if (wsClient && (wsClient.readyState === WebSocket.OPEN || wsClient.readyState === WebSocket.CONNECTING)) {
    return wsClient;
  }

  try {
    wsClient = new WebSocket(WS_URL);

    wsClient.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'REALTIME_CHANGE') {
          realtimeSubscribers.forEach((handlers) => {
            handlers.forEach((handler) => handler(payload));
          });
        }
      } catch (err) {
        // non-json ping/pong
      }
    };

    wsClient.onclose = () => {
      wsClient = null;
      setTimeout(getWebSocket, 3000); // Reconnect
    };

    wsClient.onerror = () => {
      // silence ws errors
    };
  } catch (err) {
    // ignore
  }

  return wsClient;
}

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.selectedColumns = '*';
    this.filters = [];
    this.sortField = null;
    this.sortAscending = true;
    this.limitCount = null;
    this.isSingle = false;
    this.isCountHead = false;
    this.action = 'SELECT'; // SELECT | INSERT | UPDATE | DELETE
    this.payload = null;
  }

  select(columns = '*', options = {}) {
    this.selectedColumns = columns;
    if (options?.head && options?.count === 'exact') {
      this.isCountHead = true;
    }
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value });
    return this;
  }

  or(filterString) {
    this.orFilter = filterString;
    const match = filterString.match(/%([^%]+)%/);
    if (match) {
      this.searchQuery = match[1];
    }
    return this;
  }

  ilike(column, pattern) {
    const clean = String(pattern).replace(/^%|%$/g, '');
    this.searchQuery = clean;
    this.filters.push({ column, value: clean, op: 'ilike' });
    return this;
  }

  like(column, pattern) {
    return this.ilike(column, pattern);
  }

  order(column, { ascending = true } = {}) {
    this.sortField = column;
    this.sortAscending = ascending;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(data) {
    this.action = 'INSERT';
    this.payload = data;
    return this;
  }

  update(data) {
    this.action = 'UPDATE';
    this.payload = data;
    return this;
  }

  delete() {
    this.action = 'DELETE';
    return this;
  }

  async execute() {
    try {
      if (this.action === 'INSERT') {
        if (this.table === 'achievements') {
          const res = await apiRequest('/api/achievements', {
            method: 'POST',
            body: JSON.stringify(this.payload)
          });
          if (res.data && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('edufolio-achievement-added', { detail: res.data }));
          }
          return { data: res.data, error: res.error };
        }
        if (this.table === 'students') {
          const res = await apiRequest('/api/students', {
            method: 'POST',
            body: JSON.stringify(this.payload)
          });
          return { data: res.data, error: res.error };
        }
      }

      if (this.action === 'UPDATE') {
        const idFilter = this.filters.find((f) => f.column === 'id');
        const id = idFilter?.value;
        if (this.table === 'students' && id) {
          const res = await apiRequest(`/api/students/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(this.payload)
          });
          return { data: res.data, error: res.error };
        }
      }

      if (this.action === 'DELETE') {
        const idFilter = this.filters.find((f) => f.column === 'id');
        const id = idFilter?.value;
        if (this.table === 'students' && id) {
          const res = await apiRequest(`/api/students/${id}`, {
            method: 'DELETE'
          });
          return { data: res.data, error: res.error };
        }
      }

      if (this.action === 'SELECT') {
        // Count queries for Metrics
        if (this.isCountHead) {
          const res = await apiRequest('/api/metrics');
          if (res.error) return { count: 0, error: res.error };
          if (this.table === 'students') return { count: res.data.totalStudents, error: null };
          if (this.table === 'achievements') return { count: res.data.totalAchievements, error: null };
          return { count: 0, error: null };
        }

        // Profiles / Users
        if (this.table === 'profiles') {
          const idFilter = this.filters.find((f) => f.column === 'id');
          if (idFilter) {
            const meRes = await apiRequest('/api/auth/me');
            if (meRes.data && (meRes.data.id === idFilter.value || idFilter.value === 'me')) {
              return { data: meRes.data, error: null };
            }
          }
          const res = await apiRequest('/api/users/profiles');
          if (res.error) return { data: null, error: res.error };
          let list = res.data || [];
          if (idFilter) {
            const item = list.find((u) => u.id === idFilter.value);
            return { data: item || null, error: item ? null : new Error('Not found') };
          }
          return { data: list, error: null };
        }

        // Students
        if (this.table === 'students') {
          const idFilter = this.filters.find((f) => f.column === 'id');
          if (idFilter) {
            const res = await apiRequest(`/api/students/${idFilter.value}`);
            return { data: res.data, error: res.error };
          }

          let queryParams = [];
          if (this.limitCount) queryParams.push(`limit=${this.limitCount}`);
          if (this.searchQuery) queryParams.push(`search=${encodeURIComponent(this.searchQuery)}`);
          const url = `/api/students${queryParams.length ? '?' + queryParams.join('&') : ''}`;
          const res = await apiRequest(url);
          if (res.error) return { data: null, error: res.error };

          let list = res.data || [];
          if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            list = list.filter(
              (s) =>
                (s.name && s.name.toLowerCase().includes(q)) ||
                (s.roll_no && s.roll_no.toLowerCase().includes(q)) ||
                (s.branch && s.branch.toLowerCase().includes(q))
            );
          }
          if (this.sortField) {
            const field = this.sortField;
            const asc = this.sortAscending;
            list.sort((a, b) => {
              const av = a[field] ?? 0;
              const bv = b[field] ?? 0;
              if (typeof av === 'number' || typeof bv === 'number') {
                return asc ? (Number(av) || 0) - (Number(bv) || 0) : (Number(bv) || 0) - (Number(av) || 0);
              }
              const sa = String(av).toLowerCase();
              const sb = String(bv).toLowerCase();
              return asc ? sa.localeCompare(sb) : sb.localeCompare(sa);
            });
          }
          if (this.limitCount) list = list.slice(0, this.limitCount);
          if (this.isSingle) return { data: list[0] || null, error: null };
          return { data: list, error: null };
        }

        // Achievements
        if (this.table === 'achievements') {
          const studentFilter = this.filters.find((f) => f.column === 'student_id');
          const domainFilter = this.filters.find((f) => f.column === 'domain');
          const queryParams = [];
          if (studentFilter) queryParams.push(`student_id=${encodeURIComponent(studentFilter.value)}`);
          if (domainFilter) queryParams.push(`domain=${encodeURIComponent(domainFilter.value)}`);

          const url = `/api/achievements${queryParams.length ? '?' + queryParams.join('&') : ''}`;
          const res = await apiRequest(url);
          if (res.error) return { data: null, error: res.error };

          let list = res.data || [];
          if (this.sortField) {
            const field = this.sortField;
            const asc = this.sortAscending;
            list.sort((a, b) => {
              const av = a[field];
              const bv = b[field];
              if (field === 'points') {
                return asc ? (Number(av) || 0) - (Number(bv) || 0) : (Number(bv) || 0) - (Number(av) || 0);
              }
              const da = new Date(av).getTime();
              const db = new Date(bv).getTime();
              if (!isNaN(da) && !isNaN(db)) {
                return asc ? da - db : db - da;
              }
              const sa = String(av ?? '').toLowerCase();
              const sb = String(bv ?? '').toLowerCase();
              return asc ? sa.localeCompare(sb) : sb.localeCompare(sa);
            });
          }
          if (this.isSingle) return { data: list[0] || null, error: null };
          return { data: list, error: null };
        }
      }

      return { data: [], error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Promise-like then method for seamless await chaining
  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }) {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.error) return { data: null, error: res.error };

      localStorage.setItem('edufolio_token', res.data.session.access_token);
      localStorage.setItem('edufolio_user', JSON.stringify(res.data.user));

      notifyAuthChange('SIGNED_IN', res.data.session);
      return { data: res.data, error: null };
    },

    async signOut() {
      localStorage.removeItem('edufolio_token');
      localStorage.removeItem('edufolio_user');
      notifyAuthChange('SIGNED_OUT', null);
      return { error: null };
    },

    async getSession() {
      const session = getStoredSession();
      return { data: { session }, error: null };
    },

    async getUser() {
      const session = getStoredSession();
      return { data: { user: session?.user || null }, error: null };
    },

    onAuthStateChange(callback) {
      authListeners.add(callback);
      const session = getStoredSession();
      if (session) {
        callback('INITIAL_SESSION', session);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => authListeners.delete(callback)
          }
        }
      };
    },

    async resetPasswordForEmail(email) {
      const res = await apiRequest('/api/auth/send-reset-link', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return { data: res.data, error: res.error };
    },

    async sendResetLink(email) {
      return this.resetPasswordForEmail(email);
    },

    async verifyResetToken(token) {
      const res = await apiRequest('/api/auth/verify-reset-token', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
      return { data: res.data, error: res.error };
    },

    async resetPasswordWithToken(token, newPassword) {
      const res = await apiRequest('/api/auth/reset-password-with-token', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      });

      if (res.data?.session) {
        localStorage.setItem('edufolio_token', res.data.session.access_token);
        localStorage.setItem('edufolio_user', JSON.stringify(res.data.session.user));
        notifyAuthChange('SIGNED_IN', res.data.session);
      }

      return { data: res.data, error: res.error };
    },

    async verifyOtp({ email, token, newPassword }) {
      const res = await apiRequest('/api/auth/reset-password-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp: token, newPassword })
      });

      if (res.data?.session) {
        localStorage.setItem('edufolio_token', res.data.session.access_token);
        localStorage.setItem('edufolio_user', JSON.stringify(res.data.session.user));
        notifyAuthChange('PASSWORD_RECOVERY', res.data.session);
      }

      return { data: res.data, error: res.error };
    },

    async updateUser({ password }) {
      const res = await apiRequest('/api/auth/update-password', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      return { data: res.data, error: res.error };
    }
  },

  from(table) {
    return new QueryBuilder(table);
  },

  async rpc(name, params) {
    if (name === 'admin_set_role') {
      const res = await apiRequest('/api/users/set-role', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      return { data: res.data, error: res.error };
    }
    return { data: null, error: new Error(`Unknown RPC method: ${name}`) };
  },

  functions: {
    async invoke(name, { body } = {}) {
      if (name === 'create-user') {
        const res = await apiRequest('/api/users/create-user', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        return { data: res.data, error: res.error };
      }
      return { data: null, error: new Error(`Unknown function: ${name}`) };
    }
  },

  storage: {
    from(bucket) {
      return {
        async upload(_path, file) {
          const formData = new FormData();
          formData.append('avatar', file);

          const token = getStoredToken();
          const response = await fetch(`${BACKEND_URL}/api/upload/avatar`, {
            method: 'POST',
            headers: {
              ...(token && { Authorization: `Bearer ${token}` })
            },
            body: formData
          });

          const data = await response.json();
          if (!response.ok) {
            return { data: null, error: new Error(data?.error || 'Upload failed') };
          }

          return { data: { path: data.filename }, error: null };
        },

        getPublicUrl(path) {
          return {
            data: {
              publicUrl: `${BACKEND_URL}/uploads/avatars/${path}`
            }
          };
        }
      };
    }
  },

  channel(channelName) {
    getWebSocket();
    if (!realtimeSubscribers.has(channelName)) {
      realtimeSubscribers.set(channelName, new Set());
    }

    const channelHandlers = new Set();
    const channelObj = {
      name: channelName,
      on(_type, filter, callback) {
        const handler = (payload) => {
          if (!filter || !filter.table || payload.table === filter.table) {
            callback({
              eventType: payload.action,
              new: payload.record,
              table: payload.table
            });
          }
        };
        realtimeSubscribers.get(channelName).add(handler);
        channelHandlers.add(handler);
        return channelObj;
      },
      subscribe() {
        return channelObj;
      }
    };
    channelObj._handlers = channelHandlers;
    return channelObj;
  },

  removeChannel(channelObj) {
    if (channelObj && channelObj._handlers) {
      const channelSet = realtimeSubscribers.get(channelObj.name);
      channelObj._handlers.forEach((h) => {
        if (channelSet) channelSet.delete(h);
      });
      if (channelSet && channelSet.size === 0) {
        realtimeSubscribers.delete(channelObj.name);
      }
    }
  }
};
