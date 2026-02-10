// seeder/emailModule.seeder.ts

import { EmailModule } from "../models/postgres/emailModules.model";

export async function seedEmailModules() {
  const emailModules = [
    { name: 'invoice_edi_rma', isEmailSetup: false },
    { name: 'ar_reminder_statement', isEmailSetup: false },
    { name: 'purchase_order_vendor', isEmailSetup: false },
    { name: 'email_marketing', isEmailSetup: false },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const moduleData of emailModules) {
    const existing = await EmailModule.findOne({
      where: { name: moduleData.name },
    });

    if (!existing) {
      await EmailModule.create(moduleData);
      createdCount++;
      console.log(`✅ Created email module: ${moduleData.name}`);
    } else {
      skippedCount++;
      console.log(`ℹ️ Email module already exists: ${moduleData.name}`);
    }
  }

  if (createdCount > 0) {
    console.log(`✅ Seeded ${createdCount} email module(s)`);
  }
  if (skippedCount > 0) {
    console.log(`ℹ️ Skipped ${skippedCount} existing email module(s)`);
  }
}
