import { WebUsers } from "../models/postgres/users.model";
import { RolePermission } from "../models/postgres/rolesPermission.model";
import { hashPassword } from "../utils/helper";

export async function seedWoopsaSalesUser() {
  // Check if user already exists
  const existingUser = await WebUsers.findOne({
    where: {
      firstName: "woopsaSales",
      lastName: "woopsaSales",
    },
  });

  if (existingUser) {
    console.log("ℹ️ woopsaSales user already exists, skipping seeder");
    return;
  }

  // Hash password
  const hashedPassword = await hashPassword("woopsaSales123");

  // Create user
  const user = await WebUsers.create({
    email: process.env.WOOPSA_SALES_EMAIL as string || "woopsasalesglobal@yopmail.com",
    status: true,
    allowDeliveryCharge: false,
    firstName: "woopsaSales",
    lastName: "woopsaSales",
    role: "sales",
    userNumber: "0",
    salesRepNumber: ["1"],
    password: hashedPassword,
    isActive: true,
    setUserDiscountLimit: 0,
    allowDiscount: false,
  });

  console.log(`✅ Created woopsaSales user with id: ${user.id}`);

  // Define permissions
  const permissions = [
    {
      module: "Account Receivable",
      add: false,
      view: true,
      edit: false,
      path: "/sales/accountreceivable",
    },
    {
      module: "Return Orders",
      add: false,
      view: true,
      edit: false,
      path: "/sales/returnorders",
    },
    {
      module: "Orders",
      add: false,
      view: true,
      edit: false,
      path: "/sales/orders",
    },
    {
      module: "Ordered Items",
      add: false,
      view: true,
      edit: false,
      path: "/sales/ordereditems",
    },
    {
      module: "Order History",
      add: false,
      view: true,
      edit: false,
      path: "/sales/orderhistory",
    },
    {
      module: "Order Confirmation",
      add: false,
      view: true,
      edit: false,
      path: "/sales/orderconfirmation",
    },
    {
      module: "Order Checker",
      add: false,
      view: true,
      edit: false,
      path: "/sales/orderchecker",
    },
    {
      module: "Calendar",
      add: false,
      view: true,
      edit: false,
      path: "/sales/calendar",
    },
    {
      module: "Retailers",
      add: false,
      view: true,
      edit: false,
      path: "/sales/retailers",
    },
    {
      module: "Dashboard",
      add: false,
      view: true,
      edit: false,
      path: "/sales/dashboard",
    },
    {
      module: "Product",
      add: false,
      view: true,
      edit: false,
      path: "/sales/product",
    },
    {
      module: "Vendor",
      add: false,
      view: true,
      edit: false,
      path: "/sales/vendor",
    },
    {
      module: "Epick",
      add: false,
      view: true,
      edit: false,
      path: "/sales/epick",
    },
    {
      module: "Track Login Device",
      add: false,
      view: true,
      edit: false,
      path: "/sales/tracklogindevice",
    },
  ];

  // Create permissions for the user
  for (const perm of permissions) {
    await RolePermission.create({
      userId: user.id,
      module: perm.module,
      add: perm.add,
      view: perm.view,
      edit: perm.edit,
      path: perm.path,
      status: true,
      isActive: true,
    });
  }

  console.log(`✅ Created ${permissions.length} permissions for woopsaSales user`);
}
