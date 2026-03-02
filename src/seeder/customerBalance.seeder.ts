import { CustomerBalanceSetting } from "../models/postgres/customerBalance.model";

/**
 * Seed default customer balance settings.
 * Ensures at least one row exists to control the customer balance cron.
 */
export async function seedCustomerBalanceSetting() {
  const existing = await CustomerBalanceSetting.findOne();

  if (existing) {
    console.log("ℹ️ CustomerBalanceSetting already exists, skipping seed");
    return;
  }

  await CustomerBalanceSetting.create({
    emailTime: "01:00",           // 1:00 AM
    days: ["saturday",'friday'],           // default day
    sendMail: true,               // enabled by default
  });

  console.log("✅ Seeded default CustomerBalanceSetting");
}

