-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SupplierCode" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('OK', 'EMPTY', 'TIMEOUT', 'ERROR', 'RATE_LIMITED');

-- CreateEnum
CREATE TYPE "SearchStatus" AS ENUM ('COMPLETE', 'PARTIAL', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CONFIRMED');

-- CreateTable
CREATE TABLE "Search" (
    "id" TEXT NOT NULL,
    "origin" VARCHAR(3) NOT NULL,
    "destination" VARCHAR(3) NOT NULL,
    "departureDate" VARCHAR(10) NOT NULL,
    "status" "SearchStatus" NOT NULL,
    "elapsedMs" INTEGER NOT NULL,
    "cacheExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierRun" (
    "id" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "supplier" "SupplierCode" NOT NULL,
    "status" "SupplierStatus" NOT NULL,
    "httpStatus" INTEGER,
    "elapsedMs" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "itemsRaw" INTEGER NOT NULL DEFAULT 0,
    "itemsKept" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,

    CONSTRAINT "SupplierRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "supplier" "SupplierCode" NOT NULL,
    "carrier" VARCHAR(40) NOT NULL,
    "carrierCode" VARCHAR(3),
    "miles" INTEGER NOT NULL,
    "taxesBrl" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "bookable" BOOLEAN NOT NULL DEFAULT true,
    "supplierIndex" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" VARCHAR(40) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" VARCHAR(64) NOT NULL,
    "clientId" VARCHAR(40) NOT NULL,
    "quoteId" TEXT NOT NULL,
    "passengerName" VARCHAR(120) NOT NULL,
    "passengerDocument" VARCHAR(40),
    "passengerDocumentType" VARCHAR(20),
    "passengerEmail" VARCHAR(160),
    "miles" INTEGER NOT NULL,
    "taxesBrl" DECIMAL(10,2) NOT NULL,
    "serviceFeeBrl" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Search_origin_destination_departureDate_cacheExpiresAt_idx" ON "Search"("origin", "destination", "departureDate", "cacheExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierRun_searchId_supplier_key" ON "SupplierRun"("searchId", "supplier");

-- CreateIndex
CREATE INDEX "Quote_searchId_miles_idx" ON "Quote"("searchId", "miles");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_clientId_createdAt_idx" ON "Order"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_quoteId_idx" ON "Order"("quoteId");

-- AddForeignKey
ALTER TABLE "SupplierRun" ADD CONSTRAINT "SupplierRun_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "Search"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "Search"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Seed: agências clientes
INSERT INTO "Client" ("id", "name") VALUES
  ('alfa-turismo', 'Alfa Turismo'),
  ('beta-viagens', 'Beta Viagens');
