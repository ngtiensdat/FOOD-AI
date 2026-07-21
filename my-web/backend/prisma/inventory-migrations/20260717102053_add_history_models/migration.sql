-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" REAL NOT NULL DEFAULT 0.0,
    "unit" TEXT NOT NULL,
    "min_stock" REAL NOT NULL DEFAULT 0.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "recipe_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "food_id" INTEGER NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "used_quantity" REAL NOT NULL,
    CONSTRAINT "recipe_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ingredient_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_logs_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_histories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" INTEGER NOT NULL,
    "restaurant_id" INTEGER NOT NULL,
    "table_id" INTEGER,
    "table_name" TEXT,
    "staff_id" INTEGER,
    "staff_name" TEXT,
    "subtotal" REAL NOT NULL,
    "discount" REAL NOT NULL,
    "total" REAL NOT NULL,
    "voucher_code" TEXT,
    "payment_method" TEXT NOT NULL DEFAULT 'CASH',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "order_history_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "history_id" TEXT NOT NULL,
    "food_id" INTEGER NOT NULL,
    "food_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    CONSTRAINT "order_history_items_history_id_fkey" FOREIGN KEY ("history_id") REFERENCES "order_histories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "staff_shifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staff_id" INTEGER NOT NULL,
    "staff_name" TEXT NOT NULL,
    "restaurant_id" INTEGER NOT NULL,
    "terminal_id" INTEGER,
    "terminal_name" TEXT,
    "clock_in" DATETIME NOT NULL,
    "clock_out" DATETIME,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" REAL NOT NULL DEFAULT 0.0
);

-- CreateTable
CREATE TABLE "daily_sales_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurant_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "total_revenue" REAL NOT NULL DEFAULT 0.0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "cancelled_orders" INTEGER NOT NULL DEFAULT 0,
    "cash_revenue" REAL NOT NULL DEFAULT 0.0,
    "transfer_revenue" REAL NOT NULL DEFAULT 0.0,
    "total_discount" REAL NOT NULL DEFAULT 0.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ingredients_restaurant_id_idx" ON "ingredients"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_items_food_id_ingredient_id_key" ON "recipe_items"("food_id", "ingredient_id");

-- CreateIndex
CREATE INDEX "inventory_logs_ingredient_id_created_at_idx" ON "inventory_logs"("ingredient_id", "created_at");

-- CreateIndex
CREATE INDEX "order_histories_restaurant_id_created_at_idx" ON "order_histories"("restaurant_id", "created_at");

-- CreateIndex
CREATE INDEX "staff_shifts_staff_id_clock_in_idx" ON "staff_shifts"("staff_id", "clock_in");

-- CreateIndex
CREATE INDEX "staff_shifts_restaurant_id_clock_in_idx" ON "staff_shifts"("restaurant_id", "clock_in");

-- CreateIndex
CREATE INDEX "daily_sales_summaries_restaurant_id_idx" ON "daily_sales_summaries"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_sales_summaries_restaurant_id_date_key" ON "daily_sales_summaries"("restaurant_id", "date");
