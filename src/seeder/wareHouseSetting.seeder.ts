// seeds/warehouse.seed.ts

import { Distributor } from "../models/mmsql/distributor.model";
import EpickSetting from "../models/postgres/epickSetting.model";
import HomeSettings from "../models/postgres/homeSetting.model";
import Policies from "../models/postgres/policies.model";
import { Retailer } from "../models/postgres/retailer.model";
import Setting from "../models/postgres/setting.model";
import { WarehouseSetting } from "../models/postgres/wareHouseSetting.model";
import { generateRandomSixDigitNumber } from "../utils/helper";

export async function seedWarehouseSetting() {
  const existing = await Setting.findOne();
  const findWareHouseData = await Distributor.findOne({});
  if (!existing) {
    await Setting.create({
      salesRep: {
        showStock: true,
        allowOrderInventoryUnAvaible: true,
        viewAccountReceivable: true,
        showWithOutPrice: false,

      },
      itemGlobal: {
        InventoryThreshold: 10,
        maxOrderLimit: 100,
        MiniMumOrderAmount: 1,
      },
      retailer: {
        showStock: true,
        allowOrderInventoryUnAvaible: true,
        showWithOutPrice: false,

      },
      warehouseProfile: {
        cutOffTime: '17:00:00',
        storePickup: false,
        allowShipping:true,
        warehouseImage:"",
        email: findWareHouseData?.D_Email || '',
      },
    })
    await Retailer.update({
      maxOrderLimit: 3,
      minOrderAmount: 1,
    },{
      where:{
        isActive:true
      }
    })
    console.log('✅ Seeded WarehouseSetting');
  } else {
    console.log('ℹ️ WarehouseSetting already exists, skipping seed');
  }
}

export async function seedHomeSetting() {
  const existing = await HomeSettings.findOne({});
  if (!existing) {
    await HomeSettings.create({
      showMostSale: true,
      promotedItems: [],
      showAsPerCustomer: false,
      showCustomerHistory: false,
      showPromotedItems: false,
      maxPromotedItems: 0,
    });
  }
}


export async function seedPolicies() {
  const existing = await Policies.findOne({});
  if (!existing) {
    await Policies.create({
      PrivacyPolicies:
        'Woopsa (“Company,” “we,” “our,” or “us”) respects your privacy and is committed to protecting your information. This Privacy Policy describes how we collect, use, and disclose personal information in accordance with applicable U.S. privacy laws, including the California Consumer Privacy Act (CCPA) and other state-specific regulations. 1. Information We Collect ● Personal Information: Name, email, phone, business details, payment information. ● Usage Data: App interactions, order history, route progress, log data, device details. ● Location Data: GPS data for deliveries and route optimization. ● Media: Photos, videos, and signatures submitted for proof of delivery, returns, or product scans. 2. How We Use Information ● To process orders, deliveries, and payments. ● To verify product scans and proof of delivery. ● To optimize routes and track performance. ● To provide customer service and support. ● For analytics and service improvements. 3. Sharing of Information ● With distributors, dispatchers, or admins for operational purposes. ● With third-party providers (e.g., cloud storage, payment processors). ● When required by law, subpoena, or government request. 4. Your Rights (U.S. Residents) Under laws such as the CCPA (California) and other U.S. state laws, you may: ● Request access to the personal data we hold about you. ● Request correction or deletion of your data. ● Opt out of the sale or sharing of your personal information. ● Exercise these rights by contacting us at [Insert Contact Email]. 5. Data Security We use encryption, firewalls, secure hosting, and role-based access to protect your data. However, no system is completely secure. 6. Children’s Privacy Our Services are not directed to children under 13, and we do not knowingly collect data from them. 7. Contact Information For questions or requests: Email: [Insert Email]',
      TermsAndConditions:
        'These Terms & Conditions (“Terms”) apply to your use of Woopsa’s web and mobile applications (“Services”). By using our Services, you agree to these Terms, which are governed by U.S. law. 1. Eligibility Users must be authorized distributors, drivers, pickers, or sales representatives with valid accounts. 2. Accounts & Security You are responsible for safeguarding login credentials. Woopsa is not liable for unauthorized account use. 3. Acceptable Use You may use the Services only for legitimate business purposes such as: ● Order entry and fulfillment. ● Delivery management and proof of delivery. ● Returns and payment processing. 4. Prohibited Activities ● Reverse-engineering, copying, or tampering with the Services. ● Misusing data, hacking, or unauthorized data access. ● Using Services for unlawful purposes under U.S. federal or state law. 5. Intellectual Property All rights, titles, and content (software, trademarks, branding) remain the property of Woopsa. 6. Limitation of Liability The Services are provided “as is.” Woopsa shall not be liable for indirect, incidental, or consequential damages including lost profits, data breaches caused by user negligence, or downtime. 7. Governing Law & Jurisdiction These Terms shall be governed by the laws of the State of Delaware, USA (or your chosen incorporation state). Disputes will be resolved in the courts of that state',
      SoftwareLicense:
        'Effective Date: [Insert Date] This Agreement is between Woopsa (“Licensor”) and you (“Licensee”). 1. Grant of License Woopsa grants a limited, non-exclusive, non-transferable license to use the Services solely for business purposes in the U.S. 2. Restrictions ● No reverse engineering, copying, or resale. ● No sublicensing or unauthorized distribution. ● No use of Services for unlawful activities under U.S. federal or state law. 3. Ownership All intellectual property rights remain with Woopsa. 4. Updates & Support Woopsa may release updates at its discretion. Basic support will be provided as per your service plan. 5. Termination License terminates automatically upon violation of these terms',
      RefundPolicies:
        'Woopsa provides SaaS services to U.S. distributors and related users. This policy explains how refunds are handled. 1. Eligibility ● Refunds apply only to subscription/service fees. ● Requests must be made within 7 days of the initial payment. 2. Non-Refundable Items ● Setup, onboarding, or training fees. ● Completed deliveries/orders. ● Fees charged by third-party integrations. 3. Refund Process ● Submit request to [Insert Email] within the eligibility window. ● Refunds are processed within 7–14 business days to the original U.S. payment method. 4. Company Discretion Refund approval is subject to Woopsa’s discretion based on account usage and compliance.',
      Disclaimer:
        'The Services are provided by Woopsa “as is” without any warranties, express or implied, under U.S. law. 1. No Guarantee We do not guarantee uninterrupted availability, GPS accuracy, or error-free operation. 2. User Responsibility ● Delivery routes, product scans, and payment data are system-generated. ● Final responsibility for accuracy lies with distributors, drivers, or sales reps. 3. Third-Party Services Woopsa is not responsible for failures or downtime caused by third-party providers (maps, scanners, payment processors). 4. Limitation of Liability To the fullest extent permitted by U.S. law, Woopsa shall not be liable for indirect, incidental, or consequential damages including lost profits, data loss, or downtime.'
    });
  }
}

export async function seedEpickSetting() {
  const existing = await EpickSetting.findOne({});
  if (!existing) {
    let number = generateRandomSixDigitNumber();
    await EpickSetting.create({
      allowSingleScan: true,
      pin: number.toString(),
    });
  }
}
