const memcached = require('./memcached');
const { sequelize } = require('../utils/database');

class CacheSync {
  constructor() {
    this.dbOnline = false;
    this.syncInterval = null;
    this.checkDbStatus();
  }

  async checkDbStatus() {
    try {
      await sequelize.authenticate();
      if (!this.dbOnline) {
        this.dbOnline = true;
        console.log('Database came online - starting sync');
        try {
          await this.syncCacheToDb();
        } catch (syncError) {
          console.error('Sync failed after DB reconnection:', syncError.message);
        }
      }
    } catch (error) {
      if (this.dbOnline) {
        console.error('Database connection lost:', error.message);
      }
      this.dbOnline = false;
    }
    
    setTimeout(() => this.checkDbStatus(), 30000); // Check every 30 seconds
  }

  async cacheData(key, data, model) {
    try {
      if (!key || !data || !model) {
        throw new Error('Invalid cache parameters');
      }
      
      const cacheKey = `cache:${model}:${key}`;
      await memcached.setEx(cacheKey, 3600, JSON.stringify({
        data,
        model,
        timestamp: Date.now(),
        synced: false
      }));
    } catch (error) {
      console.error('Cache data error:', error.message);
      throw error;
    }
  }

  async syncCacheToDb() {
    if (!this.dbOnline) return;

    try {
      const keys = await memcached.keys('cache:*');
      if (keys.length === 0) return;
      
      let syncedCount = 0;
      const batchSize = 10;
      
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        
        for (const key of batch) {
          try {
            const cached = await memcached.get(key);
            if (!cached) continue;

            const parsedData = JSON.parse(cached);
            const { data, model, synced } = parsedData;
            if (synced) continue;

            const Model = require(`../models/${model}`);
            await Model.create(data);
            
            // Mark as synced
            await memcached.setEx(key, 3600, JSON.stringify({
              ...parsedData,
              synced: true
            }));
            
            syncedCount++;
          } catch (itemError) {
            console.error(`Failed to sync item ${key}:`, itemError.message);
          }
        }
      }
      
      if (syncedCount > 0) {
        console.log(`Synced ${syncedCount} cached items to database`);
      }
    } catch (error) {
      console.error('Cache sync error:', error.message);
      this.dbOnline = false;
    }
  }

  async saveData(model, data) {
    try {
      if (!model || !data) {
        throw new Error('Model and data are required');
      }
      
      const validModels = ['User', 'Question', 'GameSession'];
      if (!validModels.includes(model)) {
        throw new Error('Invalid model name');
      }
      
      if (this.dbOnline) {
        try {
          const Model = require(`../models/${model}`);
          return await Model.create(data);
        } catch (error) {
          console.error(`Database save failed for ${model}:`, error.message);
          this.dbOnline = false;
        }
      }
      
      // Cache if DB offline
      const id = Date.now().toString();
      await this.cacheData(id, data, model);
      return { id, ...data, cached: true };
    } catch (error) {
      console.error('Save data error:', error.message);
      throw error;
    }
  }
}

module.exports = new CacheSync();