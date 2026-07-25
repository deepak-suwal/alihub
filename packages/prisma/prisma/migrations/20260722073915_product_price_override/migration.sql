-- AlterTable
ALTER TABLE "products" ADD COLUMN     "override_price_expires_at" TIMESTAMP(3),
ADD COLUMN     "override_price_npr" DECIMAL(14,2);
