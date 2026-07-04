-- A tenant may hold at most one PENDING booking per property. Enforced as a
-- PostgreSQL partial unique index (Prisma's schema can't express a filtered
-- unique constraint), this makes the duplicate check in createBooking()
-- race-safe: concurrent inserts collide at the DB instead of both succeeding.
CREATE UNIQUE INDEX "Booking_property_tenant_pending_key"
  ON "Booking" ("propertyId", "tenantId")
  WHERE "status" = 'PENDING';
