const Memcached = require('memcached');

let client = null;
let useMemoryFallback = false;
const memoryCache = new Map();

// Only create Memcached client if URL is provided
if (process.env.MEMCACHED_URL) {
  try {
    client = new Memcached(process.env.MEMCACHED_URL, {
      timeout: 3000,
      retries: 1,
      retry: 10000,
      remove: true,
      failOverServers: undefined
    });

    client.on('failure', (details) => {
      console.error('Memcached Server Failure, switching to memory fallback:', details);
      useMemoryFallback = true;
    });

    client.on('reconnecting', (details) => {
      console.log('Reconnecting to Memcached', details);
    });

    // Test connection
    client.get('test', (err) => {
      if (err) {
        console.log('Memcached server not available, using memory fallback');
        useMemoryFallback = true;
      } else {
        console.log('Connected to Memcached server');
      }
    });
  } catch (error) {
    console.log('Memcached disabled, using memory fallback:', error.message);
    useMemoryFallback = true;
  }
} else {
  console.log('Memcached URL not provided, using memory fallback');
  useMemoryFallback = true;
}

// Wrapper functions to match Redis API
const memcachedWrapper = {
  async setEx(key, ttl, value) {
    if (useMemoryFallback) {
      memoryCache.set(key, { value, expires: Date.now() + (ttl * 1000) });
      return 'OK';
    }
    
    if (!client) return null;
    return new Promise((resolve, reject) => {
      client.set(key, value, ttl, (err) => {
        if (err) {
          useMemoryFallback = true;
          memoryCache.set(key, { value, expires: Date.now() + (ttl * 1000) });
          resolve('OK');
        } else {
          resolve('OK');
        }
      });
    });
  },

  async get(key) {
    if (useMemoryFallback) {
      const cached = memoryCache.get(key);
      if (!cached) return null;
      if (Date.now() > cached.expires) {
        memoryCache.delete(key);
        return null;
      }
      return cached.value;
    }
    
    if (!client) return null;
    return new Promise((resolve, reject) => {
      client.get(key, (err, data) => {
        if (err) {
          useMemoryFallback = true;
          resolve(null);
        } else {
          resolve(data);
        }
      });
    });
  },

  async keys(pattern) {
    if (useMemoryFallback) {
      return Array.from(memoryCache.keys()).filter(key => {
        const cached = memoryCache.get(key);
        if (Date.now() > cached.expires) {
          memoryCache.delete(key);
          return false;
        }
        return true;
      });
    }
    
    // Memcached doesn't support key patterns
    return [];
  },

  async zAdd(key, scoreValuePairs) {
    try {
      const existing = await this.get(key);
      let leaderboard = existing ? JSON.parse(existing) : [];
      
      scoreValuePairs.forEach(pair => {
        const existingIndex = leaderboard.findIndex(item => item.value === pair.value);
        if (existingIndex >= 0) {
          leaderboard[existingIndex].score = pair.score;
        } else {
          leaderboard.push(pair);
        }
      });
      
      leaderboard.sort((a, b) => b.score - a.score);
      await this.setEx(key, 3600, JSON.stringify(leaderboard));
      return leaderboard.length;
    } catch (error) {
      console.error('Cache zAdd error:', error);
      return null;
    }
  },

  async zscore(key, member) {
    try {
      const data = await this.get(key);
      if (!data) return null;
      
      const leaderboard = JSON.parse(data);
      const item = leaderboard.find(item => item.value === member);
      return item ? item.score : null;
    } catch (error) {
      console.error('Cache zscore error:', error);
      return null;
    }
  }
};

module.exports = memcachedWrapper;