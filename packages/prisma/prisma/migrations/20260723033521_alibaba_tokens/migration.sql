-- CreateTable
CREATE TABLE "alibaba_tokens" (
    "id" TEXT NOT NULL,
    "account_id" TEXT,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "refresh_expires_at" TIMESTAMP(3),
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alibaba_tokens_pkey" PRIMARY KEY ("id")
);
