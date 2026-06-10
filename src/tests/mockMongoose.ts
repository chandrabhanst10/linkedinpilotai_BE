import mongoose from 'mongoose';
import { User } from '../modules/auth/index.js';
import { Workspace, Subscription } from '../modules/settings/index.js';
import { LinkedInAccount } from '../modules/accounts/index.js';
import { ScheduledPost } from '../modules/posts/index.js';
import { Notification } from '../modules/notifications/index.js';
import bcrypt from 'bcryptjs';

// Stub mongoose connection
mongoose.connect = async () => {
  console.log('[Mock Mongoose] Stubbed DB Connection Successful.');
  return { connection: { host: 'localhost-mock' } } as unknown as typeof mongoose;
};

// In-memory collections
export const db: Record<string, Record<string, unknown>[]> = {
  users: [],
  workspaces: [],
  subscriptions: [],
  accounts: [],
  posts: [],
  notifications: []
};

// Reset database helper
export const resetDb = () => {
  db.users = [];
  db.workspaces = [];
  db.subscriptions = [];
  db.accounts = [];
  db.posts = [];
  db.notifications = [];
};

// Mock Query helper for chainable methods
class MockQuery {
  data: unknown;
  constructor(data: unknown) {
    this.data = data;
  }
  populate() { return this; }
  sort() { return this; }
  skip() { return this; }
  limit(n: number) {
    if (Array.isArray(this.data)) {
      this.data = this.data.slice(0, n);
    }
    return this;
  }
  select() { return this; }
  async then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => void) {
    try {
      const res = typeof resolve === 'function' ? resolve(this.data) : this.data;
      return res;
    } catch (e) {
      if (typeof reject === 'function') return reject(e);
      throw e;
    }
  }
}

// Helper to match filter criteria (simple subset match)
const matches = (item: Record<string, unknown>, filter: Record<string, unknown> | null | undefined) => {
  if (!filter) return true;
  for (const key in filter) {
    const filterVal = filter[key];
    const itemVal = item[key];
    
    // Support MongoDB specific operators if any
    if (filterVal && typeof filterVal === 'object') {
      const objVal = filterVal as Record<string, unknown>;
      if ('$in' in objVal) {
        const inArray = objVal.$in;
        if (!Array.isArray(inArray) || !inArray.includes(itemVal)) return false;
        continue;
      }
      if ('$regex' in objVal) {
        const regex = new RegExp(String(objVal.$regex), String(objVal.$options || ''));
        if (!regex.test(String(itemVal))) return false;
        continue;
      }
    }
    
    // Normal match
    if (itemVal !== filterVal) {
      // If object ID matching
      if (itemVal && filterVal && itemVal.toString() === filterVal.toString()) {
        continue;
      }
      return false;
    }
  }
  return true;
};

// Patch a model
const patchModel = <T extends mongoose.Document>(ModelClass: mongoose.Model<T>, collectionName: string) => {
  const mockModel = ModelClass as unknown as Record<string, unknown>;

  mockModel.find = function(filter: Record<string, unknown>) {
    const results = (db[collectionName] as unknown as Record<string, unknown>[]).filter(item => matches(item, filter));
    // Simulate populate for accounts
    if (collectionName === 'posts') {
      results.forEach(post => {
        if (post.linkedinAccounts && Array.isArray(post.linkedinAccounts)) {
          post.linkedinAccounts = post.linkedinAccounts.map(id => {
            const acc = db.accounts.find(a => String(a._id) === String(id));
            return acc || id;
          });
        }
      });
    }
    return new MockQuery(results);
  };

  mockModel.findOne = function(filter: Record<string, unknown>) {
    const result = (db[collectionName] as unknown as Record<string, unknown>[]).find(item => matches(item, filter));
    return new MockQuery(result || null);
  };

  mockModel.findById = function(id: string | mongoose.Types.ObjectId) {
    const result = (db[collectionName] as unknown as Record<string, unknown>[]).find(item => String(item._id) === String(id));
    return new MockQuery(result || null);
  };

  mockModel.findOneAndDelete = async function(filter: Record<string, unknown>) {
    const idx = (db[collectionName] as unknown as Record<string, unknown>[]).findIndex(item => matches(item, filter));
    if (idx !== -1) {
      const doc = db[collectionName][idx];
      db[collectionName].splice(idx, 1);
      return doc;
    }
    return null;
  };

  mockModel.countDocuments = async function(filter: Record<string, unknown>) {
    const count = (db[collectionName] as unknown as Record<string, unknown>[]).filter(item => matches(item, filter)).length;
    return count;
  };

  mockModel.create = async function(payload: Record<string, unknown>) {
    const doc = new ModelClass(payload);
    const docRecord = doc as unknown as Record<string, unknown>;
    // Call pre-save hook if user
    if (collectionName === 'users' && typeof docRecord.password === 'string') {
      const salt = await bcrypt.genSalt(10);
      docRecord.password = await bcrypt.hash(docRecord.password, salt);
    }
    db[collectionName].push(docRecord);
    return doc;
  };

  // Override Model prototype save
  ModelClass.prototype.save = async function(this: mongoose.Document) {
    const docRecord = this as unknown as Record<string, unknown>;
    const idx = db[collectionName].findIndex(item => String(item._id) === String(docRecord._id));
    if (idx !== -1) {
      db[collectionName][idx] = docRecord;
    } else {
      db[collectionName].push(docRecord);
    }
    return this;
  };
};

patchModel(User, 'users');
patchModel(Workspace, 'workspaces');
patchModel(Subscription, 'subscriptions');
patchModel(LinkedInAccount, 'accounts');
patchModel(ScheduledPost, 'posts');
patchModel(Notification, 'notifications');
