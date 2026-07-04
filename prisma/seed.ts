import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  PropertyStatus,
  PropertyType,
  PaymentStatus,
  PaymentMethod,
  BookingStatus,
  NotificationType,
  Role,
} from "../src/generated/prisma/enums";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** First day of the month, `offset` months back from now (UTC). */
function monthsAgo(offset: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clean slate — delete in FK-safe order (cascades cover most of it).
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  // Hash with argon2 to match the Credentials provider's verifier (auth.ts).
  const passwordHash = await hash("Password123!");

  // --- Users: 1 owner + 2 tenants ------------------------------------------
  const owner = await prisma.user.create({
    data: {
      name: "Olivia Owner",
      email: "owner@example.com",
      passwordHash,
      role: Role.OWNER,
      phone: "+91 98765 43210",
      // No avatar by default — the UI falls back to initials. Users can upload
      // one from the Profile page. (Avoids depending on a remote avatar host.)
      avatarUrl: null,
    },
  });

  const tenantA = await prisma.user.create({
    data: {
      name: "Tariq Tenant",
      email: "tenant1@example.com",
      passwordHash,
      role: Role.TENANT,
      phone: "+91 91234 56780",
      avatarUrl: null,
    },
  });

  const tenantB = await prisma.user.create({
    data: {
      name: "Tina Tenant",
      email: "tenant2@example.com",
      passwordHash,
      role: Role.TENANT,
      phone: "+91 99887 76655",
      avatarUrl: null,
    },
  });

  // --- Properties: 5 --------------------------------------------------------
  const flat = await prisma.property.create({
    data: {
      ownerId: owner.id,
      title: "2BHK Riverside Flat",
      type: PropertyType.FLAT,
      address: "12 Marine Drive, Mumbai, MH 400020",
      lat: 18.9438,
      lng: 72.8231,
      rent: 45000,
      deposit: 135000,
      areaSqft: 950,
      amenities: ["Parking", "Lift", "Power Backup", "Gym"],
      description: "Sunlit 2BHK with a sea-facing balcony and modular kitchen.",
      status: PropertyStatus.OCCUPIED,
      images: {
        create: [
          { url: "/placeholders/flat.svg", isPrimary: true, sortOrder: 0 },
          { url: "/placeholders/interior.svg", sortOrder: 1 },
        ],
      },
    },
  });

  const office = await prisma.property.create({
    data: {
      ownerId: owner.id,
      title: "Open-Plan Office Suite",
      type: PropertyType.OFFICE,
      address: "Cyber Hub, Tower B, Gurugram, HR 122002",
      lat: 28.4949,
      lng: 77.0889,
      rent: 120000,
      deposit: 360000,
      areaSqft: 2400,
      amenities: ["Conference Room", "Pantry", "24x7 Access", "Parking"],
      description: "Plug-and-play office for up to 30 seats with meeting rooms.",
      status: PropertyStatus.OCCUPIED,
      images: {
        create: [
          { url: "/placeholders/office.svg", isPrimary: true },
        ],
      },
    },
  });

  const land = await prisma.property.create({
    data: {
      ownerId: owner.id,
      title: "Agricultural Plot — 1 Acre",
      type: PropertyType.LAND,
      address: "Survey 44, Devanahalli, Bengaluru Rural, KA 562110",
      lat: 13.2437,
      lng: 77.7126,
      rent: 25000,
      deposit: 50000,
      areaSqft: 43560,
      amenities: ["Borewell", "Road Access", "Fenced"],
      description: "Fertile red-soil plot with borewell, ideal for horticulture.",
      status: PropertyStatus.VACANT,
      images: {
        create: [
          { url: "/placeholders/land.svg", isPrimary: true },
        ],
      },
    },
  });

  const resort = await prisma.property.create({
    data: {
      ownerId: owner.id,
      title: "Hillside Resort Villa",
      type: PropertyType.RESORT,
      address: "Sunset Ridge, Mussoorie, UK 248179",
      lat: 30.4599,
      lng: 78.0664,
      rent: 90000,
      deposit: 180000,
      areaSqft: 3200,
      amenities: ["Pool", "Housekeeping", "Wi-Fi", "Mountain View", "Parking"],
      description: "Fully serviced 4-bedroom villa with infinity pool and valley views.",
      status: PropertyStatus.MAINTENANCE,
      images: {
        create: [
          { url: "/placeholders/resort.svg", isPrimary: true },
          { url: "/placeholders/interior.svg", sortOrder: 1 },
        ],
      },
    },
  });

  const society = await prisma.property.create({
    data: {
      ownerId: owner.id,
      title: "Greenwood Society — Unit 7C",
      type: PropertyType.SOCIETY,
      address: "Greenwood Residency, Wakad, Pune, MH 411057",
      lat: 18.5984,
      lng: 73.7626,
      rent: 32000,
      deposit: 96000,
      areaSqft: 1100,
      amenities: ["Clubhouse", "Kids Play Area", "Security", "Parking"],
      description: "Gated-community 3BHK with clubhouse and landscaped gardens.",
      status: PropertyStatus.VACANT,
      images: {
        create: [
          { url: "/placeholders/society.svg", isPrimary: true },
        ],
      },
    },
  });

  // --- Leases: occupied properties get an active lease ----------------------
  const flatLease = await prisma.lease.create({
    data: {
      propertyId: flat.id,
      tenantId: tenantA.id,
      startDate: monthsAgo(5),
      endDate: monthsAgo(-7), // 12-month term ending in the future
      monthlyRent: 45000,
      dueDay: 5,
      deposit: 135000,
      agreementUrl: "https://example.com/agreements/flat-lease.pdf",
      active: true,
    },
  });

  const officeLease = await prisma.lease.create({
    data: {
      propertyId: office.id,
      tenantId: tenantB.id,
      startDate: monthsAgo(3),
      endDate: monthsAgo(-21),
      monthlyRent: 120000,
      dueDay: 1,
      deposit: 360000,
      agreementUrl: "https://example.com/agreements/office-lease.pdf",
      active: true,
    },
  });

  // --- Payments + Receipts (12 months of history per active lease) ----------
  // Older months PAID (with receipts); current month PENDING, plus one recent
  // OVERDUE and one PARTIAL so the dues table / aging buckets have data.
  async function seedPayments(
    leaseId: string,
    monthly: number,
    label: string,
    method: PaymentMethod,
  ) {
    for (let i = 11; i >= 0; i--) {
      const period = monthsAgo(i);
      let status: PaymentStatus = PaymentStatus.PAID;
      let amount = monthly;
      if (i === 0) status = PaymentStatus.PENDING;
      else if (i === 1) status = PaymentStatus.OVERDUE;
      else if (i === 2) {
        status = PaymentStatus.PARTIAL;
        amount = Math.round(monthly / 2);
      }
      const paid = status === PaymentStatus.PAID;
      await prisma.payment.create({
        data: {
          leaseId,
          amount,
          periodMonth: period,
          status,
          method,
          razorpayPaymentId:
            paid && method === PaymentMethod.ONLINE
              ? `pay_${label}${i}${Date.now() % 100000}`
              : null,
          paidAt: paid ? new Date(period.getTime() + 4 * 86400000) : null,
          ...(paid && {
            receipt: {
              create: {
                receiptNumber: `RCPT-${label}-${period.getUTCFullYear()}${String(
                  period.getUTCMonth() + 1,
                ).padStart(2, "0")}`,
              },
            },
          }),
        },
      });
    }
    console.log(`  • 12 months of payments seeded for ${label} lease`);
  }

  await seedPayments(flatLease.id, 45000, "FLAT", PaymentMethod.ONLINE);
  await seedPayments(officeLease.id, 120000, "OFFICE", PaymentMethod.BANK);

  // --- Bookings: tenants enquiring about vacant properties ------------------
  await prisma.booking.create({
    data: {
      propertyId: society.id,
      tenantId: tenantA.id,
      status: BookingStatus.PENDING,
      message: "Interested in moving in next month. Is parking for two cars possible?",
    },
  });
  await prisma.booking.create({
    data: {
      propertyId: land.id,
      tenantId: tenantB.id,
      status: BookingStatus.APPROVED,
      message: "Would like to lease the plot for a 1-year horticulture project.",
    },
  });
  await prisma.booking.create({
    data: {
      propertyId: society.id,
      tenantId: tenantB.id,
      status: BookingStatus.REJECTED,
      message: "Looking for a short-term 3-month stay.",
    },
  });

  // --- Notifications --------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      {
        userId: owner.id,
        title: "New booking request",
        body: "Tariq Tenant requested to book Greenwood Society — Unit 7C.",
        type: NotificationType.BOOKING,
      },
      {
        userId: owner.id,
        title: "Rent overdue",
        body: "Office Suite rent for last month is overdue.",
        type: NotificationType.PAYMENT,
      },
      {
        userId: tenantA.id,
        title: "Rent due soon",
        body: "Your rent for 2BHK Riverside Flat is due on the 5th.",
        read: true,
        type: NotificationType.PAYMENT,
      },
      {
        userId: tenantB.id,
        title: "Booking approved",
        body: "Your booking for the Agricultural Plot was approved.",
        type: NotificationType.BOOKING,
      },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    properties: await prisma.property.count(),
    leases: await prisma.lease.count(),
    payments: await prisma.payment.count(),
    receipts: await prisma.receipt.count(),
    bookings: await prisma.booking.count(),
    notifications: await prisma.notification.count(),
  };
  console.log("✅ Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
