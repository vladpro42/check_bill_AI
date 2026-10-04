import {
    pgTable,
    bigserial,
    bigint,
    varchar,
    text,
    timestamp,
    numeric,
    smallint,
    boolean,
    jsonb,
    index,
    unique,
    char,
    integer,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    telegramId: bigint('telegram_id', { mode: 'number' }).notNull().unique(),
    username: varchar('username', { length: 64 }),
    firstName: varchar('first_name', { length: 128 }),
    lastName: varchar('last_name', { length: 128 }),
    languageCode: varchar('language_code', { length: 10 }).default('ru'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()), 
}, (table) => [
    index('idx_users_telegram_id').on(table.telegramId),
]);

// ============ STORES ============
export const stores = pgTable('stores', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    normalizedName: varchar('normalized_name', { length: 255 }).notNull(),
    address: text('address'),
    inn: varchar('inn', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    unique('stores_normalized_name_address_unique').on(table.normalizedName, table.address),
    index('idx_stores_normalized_name').on(table.normalizedName),
]);

// ============ CATEGORIES ============
export const categories = pgTable('categories', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name', { length: 128 }).notNull().unique(),
    parentId: bigint('parent_id', { mode: 'number' })
        .references(() => categories.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============ PRODUCTS ============
export const products = pgTable('products', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    canonicalName: varchar('canonical_name', { length: 255 }).notNull(),
    categoryId: bigint('category_id', { mode: 'number' })
        .references(() => categories.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('idx_products_category_id').on(table.categoryId),
]);

// ============ PRODUCT ALIASES ============
export const productAliases = pgTable('product_aliases', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    productId: bigint('product_id', { mode: 'number' })
        .notNull()
        .references(() => products.id, { onDelete: 'cascade' }),
    alias: varchar('alias', { length: 255 }).notNull(),
    aliasNorm: varchar('alias_norm', { length: 255 }).notNull().unique(),
}, (table) => [
    index('idx_product_aliases_product_id').on(table.productId),
]);

// ============ RECEIPTS ============
export const receipts = pgTable('receipts', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    storeId: bigint('store_id', { mode: 'number' })
        .references(() => stores.id, { onDelete: 'set null' }),

    imagePath: text('image_path'),
    imageHash: char('image_hash', { length: 64 }), // sha256

    purchasedAt: timestamp('purchased_at', { withTimezone: true }),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }),
    currency: char('currency', { length: 3 }).default('RUB'),
    fiscalNumber: varchar('fiscal_number', { length: 64 }),
    fiscalSign: varchar('fiscal_sign', { length: 64 }),

    status: varchar('status', { length: 20 }).notNull().default('pending'),
    // pending | processing | parsed | failed | needs_review

    aiModel: varchar('ai_model', { length: 64 }),
    aiRawResponse: jsonb('ai_raw_response'),
    errorMessage: text('error_message'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
}, (table) => [
    index('idx_receipts_user_id').on(table.userId),
    index('idx_receipts_store_id').on(table.storeId),
    index('idx_receipts_purchased_at').on(table.purchasedAt),
    index('idx_receipts_status').on(table.status),
    index('idx_receipts_image_hash').on(table.imageHash),
    // GIN-индекс для JSONB поиска
    index('idx_receipts_ai_raw').using('gin', table.aiRawResponse),
]);

// ============ RECEIPT ITEMS ============
export const receiptItems = pgTable('receipt_items', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    receiptId: bigint('receipt_id', { mode: 'number' })
        .notNull()
        .references(() => receipts.id, { onDelete: 'cascade' }),
    productId: bigint('product_id', { mode: 'number' })
        .references(() => products.id, { onDelete: 'set null' }),

    rawName: varchar('raw_name', { length: 512 }).notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 3 }).default('1'),
    unit: varchar('unit', { length: 16 }),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }),
    totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull(),
    discount: numeric('discount', { precision: 12, scale: 2 }).default('0'),

    positionIndex: smallint('position_index'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('idx_receipt_items_receipt_id').on(table.receiptId),
    index('idx_receipt_items_product_id').on(table.productId),
    index('idx_receipt_items_raw_name').on(table.rawName),
]);

// ============ AI PROCESSING LOGS ============
export const aiProcessingLogs = pgTable('ai_processing_logs', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    receiptId: bigint('receipt_id', { mode: 'number' })
        .references(() => receipts.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number' })
        .references(() => users.id, { onDelete: 'set null' }),

    model: varchar('model', { length: 64 }),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),
    durationMs: integer('duration_ms'),
    success: boolean('success').notNull(),
    error: text('error'),
    payload: jsonb('payload'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('idx_ai_logs_receipt_id').on(table.receiptId),
    index('idx_ai_logs_created_at').on(table.createdAt),
]);