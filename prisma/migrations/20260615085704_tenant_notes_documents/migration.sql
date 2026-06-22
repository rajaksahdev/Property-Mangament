-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('AGREEMENT', 'ID_PROOF', 'OTHER');

-- CreateTable
CREATE TABLE "TenantNote" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantDocument" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leaseId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantNote_ownerId_tenantId_idx" ON "TenantNote"("ownerId", "tenantId");

-- CreateIndex
CREATE INDEX "TenantDocument_ownerId_tenantId_idx" ON "TenantDocument"("ownerId", "tenantId");

-- CreateIndex
CREATE INDEX "TenantDocument_leaseId_idx" ON "TenantDocument"("leaseId");

-- AddForeignKey
ALTER TABLE "TenantNote" ADD CONSTRAINT "TenantNote_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantNote" ADD CONSTRAINT "TenantNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantDocument" ADD CONSTRAINT "TenantDocument_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantDocument" ADD CONSTRAINT "TenantDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantDocument" ADD CONSTRAINT "TenantDocument_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
