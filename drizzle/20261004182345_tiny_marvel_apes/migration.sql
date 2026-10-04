CREATE TABLE "ai_processing_logs" (
	"id" bigserial PRIMARY KEY,
	"receipt_id" bigint,
	"user_id" bigint,
	"model" varchar(64),
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"duration_ms" integer,
	"success" boolean NOT NULL,
	"error" text,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" bigserial PRIMARY KEY,
	"name" varchar(128) NOT NULL UNIQUE,
	"parent_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_aliases" (
	"id" bigserial PRIMARY KEY,
	"product_id" bigint NOT NULL,
	"alias" varchar(255) NOT NULL,
	"alias_norm" varchar(255) NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" bigserial PRIMARY KEY,
	"canonical_name" varchar(255) NOT NULL,
	"category_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt_items" (
	"id" bigserial PRIMARY KEY,
	"receipt_id" bigint NOT NULL,
	"product_id" bigint,
	"raw_name" varchar(512) NOT NULL,
	"quantity" numeric(10,3) DEFAULT '1',
	"unit" varchar(16),
	"unit_price" numeric(12,2),
	"total_price" numeric(12,2) NOT NULL,
	"discount" numeric(12,2) DEFAULT '0',
	"position_index" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" bigserial PRIMARY KEY,
	"user_id" bigint NOT NULL,
	"store_id" bigint,
	"image_path" text,
	"image_hash" char(64),
	"purchased_at" timestamp with time zone,
	"total_amount" numeric(12,2),
	"currency" char(3) DEFAULT 'RUB',
	"fiscal_number" varchar(64),
	"fiscal_sign" varchar(64),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"ai_model" varchar(64),
	"ai_raw_response" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" bigserial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"address" text,
	"inn" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stores_normalized_name_address_unique" UNIQUE("normalized_name","address")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY,
	"telegram_id" bigint NOT NULL UNIQUE,
	"username" varchar(64),
	"first_name" varchar(128),
	"last_name" varchar(128),
	"language_code" varchar(10) DEFAULT 'ru',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_ai_logs_receipt_id" ON "ai_processing_logs" ("receipt_id");--> statement-breakpoint
CREATE INDEX "idx_ai_logs_created_at" ON "ai_processing_logs" ("created_at");--> statement-breakpoint
CREATE INDEX "idx_product_aliases_product_id" ON "product_aliases" ("product_id");--> statement-breakpoint
CREATE INDEX "idx_products_category_id" ON "products" ("category_id");--> statement-breakpoint
CREATE INDEX "idx_receipt_items_receipt_id" ON "receipt_items" ("receipt_id");--> statement-breakpoint
CREATE INDEX "idx_receipt_items_product_id" ON "receipt_items" ("product_id");--> statement-breakpoint
CREATE INDEX "idx_receipt_items_raw_name" ON "receipt_items" ("raw_name");--> statement-breakpoint
CREATE INDEX "idx_receipts_user_id" ON "receipts" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_receipts_store_id" ON "receipts" ("store_id");--> statement-breakpoint
CREATE INDEX "idx_receipts_purchased_at" ON "receipts" ("purchased_at");--> statement-breakpoint
CREATE INDEX "idx_receipts_status" ON "receipts" ("status");--> statement-breakpoint
CREATE INDEX "idx_receipts_image_hash" ON "receipts" ("image_hash");--> statement-breakpoint
CREATE INDEX "idx_receipts_ai_raw" ON "receipts" USING gin ("ai_raw_response");--> statement-breakpoint
CREATE INDEX "idx_stores_normalized_name" ON "stores" ("normalized_name");--> statement-breakpoint
CREATE INDEX "idx_users_telegram_id" ON "users" ("telegram_id");--> statement-breakpoint
ALTER TABLE "ai_processing_logs" ADD CONSTRAINT "ai_processing_logs_receipt_id_receipts_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ai_processing_logs" ADD CONSTRAINT "ai_processing_logs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "product_aliases" ADD CONSTRAINT "product_aliases_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_receipt_id_receipts_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_store_id_stores_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL;