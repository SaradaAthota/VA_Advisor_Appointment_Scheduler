# PostgreSQL Migration Plan

## ✅ Feasibility Assessment

**YES, migration is feasible and recommended!**

### Why PostgreSQL is Better for Railway:
1. ✅ **Persistent**: Railway's PostgreSQL is a managed service with automatic backups
2. ✅ **Production-ready**: Designed for production workloads
3. ✅ **Concurrent access**: Handles multiple connections better than SQLite
4. ✅ **No file system issues**: No "table doesn't exist" errors
5. ✅ **Railway-native**: Built-in support, easy setup

### Current State:
- ✅ Entities are database-agnostic (use standard TypeORM decorators)
- ✅ TypeORM already supports PostgreSQL
- ✅ No migrations needed initially (can use `synchronize: true` for setup)
- ⚠️ Need to add `pg` package
- ⚠️ Need environment-based config (SQLite for local, PostgreSQL for production)

## 📋 Migration Steps

### Step 1: Add PostgreSQL Driver
```bash
npm install pg
npm install --save-dev @types/pg
```

### Step 2: Update TypeORM Configuration
Update `src/app.module.ts` to support both SQLite (local) and PostgreSQL (production):

```typescript
TypeOrmModule.forRoot({
  // Use PostgreSQL if DATABASE_URL is provided (Railway), otherwise SQLite (local)
  ...(process.env.DATABASE_URL
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        synchronize: true, // Enable for initial setup (can disable later)
      }
    : {
        type: 'sqlite',
        database: process.env.DATABASE_PATH || 'bookings.db',
        entities: [BookingEntity, ConversationLogEntity],
        synchronize: true,
      }),
  logging: process.env.NODE_ENV === 'development',
}),
```

### Step 3: Add PostgreSQL to Railway
1. Go to Railway Dashboard
2. Click on your project
3. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
4. Railway will automatically:
   - Create a PostgreSQL database
   - Set `DATABASE_URL` environment variable
   - Provide connection string

### Step 4: Update package.json
Add `pg` and `@types/pg` to dependencies.

### Step 5: Test Locally
- Local development: Still uses SQLite (no DATABASE_URL)
- Production (Railway): Uses PostgreSQL (DATABASE_URL set by Railway)

## 🎯 Benefits

1. **No more "table doesn't exist" errors**
2. **Data persistence** across deployments
3. **Better performance** for concurrent requests
4. **Automatic backups** (Railway feature)
5. **Production-ready** database

## ⚠️ Important Notes

1. **Synchronize**: We'll use `synchronize: true` initially to auto-create tables. For production, you can:
   - Keep it enabled (Railway environments are isolated)
   - Or disable and use migrations later

2. **Local Development**: Will still use SQLite (easier for local dev)

3. **Data Migration**: If you have existing data in SQLite:
   - Export from SQLite
   - Import to PostgreSQL (or start fresh)

4. **UUID Extension**: PostgreSQL might need UUID extension, but TypeORM handles this automatically with `@PrimaryGeneratedColumn('uuid')`

## 🚀 Quick Start

After migration:
1. Railway will automatically set `DATABASE_URL`
2. App will detect `DATABASE_URL` and use PostgreSQL
3. Tables will be auto-created on first start
4. No code changes needed in entities or services!

