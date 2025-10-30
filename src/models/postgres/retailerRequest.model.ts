// src/models/postgress/CustomerRequest.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

// ----- Typed JSON shapes -----
export interface OwnerOfficer {
  fullName: string;
  title?: string | null;
  ownership?: string | null;        // changed from number to string
  dateOfBirth?: string | null;      // ISO yyyy-mm-dd
  email?: string | null;
  homeAddress?: string | null;      // changed from homeAddress to match schema
  phone?: string | null;
}

export interface TradeReference {
  company: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
}

// ----- Table attributes -----
export interface CustomerRequestAttributes {
  id: number;

  // Business Information
  business_name: string;
  dba_name: string | null;
  business_type: 'SOLE_PROP' | 'PARTNERSHIP' | 'LLC' | 'CORP' | 'OTHER';
  federal_ein: string | null;
  ownership_type: string | null;

  // Contact Detail
  primary_contact: string;
  phone: string;                    // changed from nullable to required
  email: string;                    // changed from nullable to required
  website: string | null;

  // Physical Address
  physical_street: string;
  physical_city: string;
  physical_state: string; // 2-char
  physical_zip: string;
  physical_county: string | null;

  // Mailing Address
  mailing_same_as_physical: boolean;
  mailing_street: string | null;
  mailing_city: string | null;
  mailing_state: string | null; // 2-char
  mailing_zip: string | null;

  special_delivery_instructions?: string | null;
  // Licensing & Compliance
  sales_tax_id: string;            // changed from nullable to required
  state_tobacco_license: string | null;
  federal_tobacco_permit: string | null;
  resale_certificate_url: string | null;
  state_tobacco_license_url: string | null;
  business_license_url: string | null;
  owner_government_id_url: string | null;

  // Owners / Officers
  owners: OwnerOfficer[]; // JSONB

  // Credit Limit + Bank
  credit_limit_requested: boolean;
  bank_name: string | null;
  bank_account_last4: string | null;
  bank_account_enc: Buffer | null; // ciphertext only (optional)
  createdBy:string;
  // References
  references: TradeReference[]; // JSONB

  // New fields from Zod schema
  preferred_delivery_days: string | null;
  compliance_certification: boolean;
  authorized_signature: string;
  signature_date: string;

  // Meta
  status: 'PENDING' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  notes: string | null;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ----- Creation attrs (make many fields optional at create-time) -----
type CustomerRequestCreationAttributes = Optional<
  CustomerRequestAttributes,
  | 'id'
  | 'dba_name'
  | 'business_type'
  | 'federal_ein'
  | 'ownership_type'
  | 'website'
  | 'physical_county'
  | 'mailing_same_as_physical'
  | 'mailing_street'
  | 'mailing_city'
  | 'mailing_state'
  | 'mailing_zip'
  | 'state_tobacco_license'
  | 'federal_tobacco_permit'
  | 'resale_certificate_url'
  | 'state_tobacco_license_url'
  | 'business_license_url'
  | 'owner_government_id_url'
  | 'owners'
  | 'credit_limit_requested'
  | 'bank_name'
  | 'bank_account_last4'
  | 'bank_account_enc'
  | 'references'
  | 'preferred_delivery_days'
  | 'compliance_certification'
  | 'authorized_signature'
  | 'signature_date'
  | 'status'
  | 'notes'
>;

// ----- Model -----
export class CustomerRequest
  extends Model<CustomerRequestAttributes, CustomerRequestCreationAttributes>
  implements CustomerRequestAttributes
{
  public id!: number;

  public business_name!: string;
  public dba_name!: string | null;
  public business_type!: 'SOLE_PROP' | 'PARTNERSHIP' | 'LLC' | 'CORP' | 'OTHER';
  public federal_ein!: string | null;
  public ownership_type!: string | null;
  public createdBy!:string;
  public primary_contact!: string;
  public phone!: string;                    // changed from nullable to required
  public email!: string;                    // changed from nullable to required
  public website!: string | null;

  public physical_street!: string;
  public physical_city!: string;
  public physical_state!: string;
  public physical_zip!: string;
  public physical_county!: string | null;

  public mailing_same_as_physical!: boolean;
  public mailing_street!: string | null;
  public mailing_city!: string | null;
  public mailing_state!: string | null;
  public mailing_zip!: string | null;

  public special_delivery_instructions?: string | null;
  public sales_tax_id!: string;            // changed from nullable to required
  public state_tobacco_license!: string | null;
  public federal_tobacco_permit!: string | null;
  public resale_certificate_url!: string | null;
  public state_tobacco_license_url!: string | null;
  public business_license_url!: string | null;
  public owner_government_id_url!: string | null;

  public owners!: OwnerOfficer[];
  public credit_limit_requested!: boolean;
  public bank_name!: string | null;
  public bank_account_last4!: string | null;
  public bank_account_enc!: Buffer | null;

  public references!: TradeReference[];

  // New fields from Zod schema
  public preferred_delivery_days!: string | null;
  public compliance_certification!: boolean;
  public authorized_signature!: string;
  public signature_date!: string;

  public status!: 'PENDING' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  public notes!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustomerRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // Business
    business_name: { type: DataTypes.TEXT, allowNull: false },
    dba_name: { type: DataTypes.TEXT, allowNull: true },
    business_type: {
      type: DataTypes.ENUM('SOLE_PROP', 'PARTNERSHIP', 'LLC', 'CORP', 'OTHER'),
      allowNull: false,
      defaultValue: 'OTHER',
    },
    federal_ein: { type: DataTypes.STRING(15), allowNull: true },
    ownership_type: { type: DataTypes.TEXT, allowNull: true },
    special_delivery_instructions: { type: DataTypes.TEXT, allowNull: true },
    // Contact
    primary_contact: { type: DataTypes.TEXT, allowNull: false },
    phone: { type: DataTypes.TEXT, allowNull: false },        // changed from true to false
    email: { type: DataTypes.STRING, allowNull: false },      // changed from true to false
    website: { type: DataTypes.TEXT, allowNull: true },

    // Physical address
    physical_street: { type: DataTypes.TEXT, allowNull: false },
    physical_city: { type: DataTypes.TEXT, allowNull: false },
    physical_state: { type: DataTypes.STRING(2), allowNull: false },
    physical_zip: { type: DataTypes.TEXT, allowNull: false },
    physical_county: { type: DataTypes.TEXT, allowNull: true },

    // Mailing address
    mailing_same_as_physical: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    mailing_street: { type: DataTypes.TEXT, allowNull: true },
    mailing_city: { type: DataTypes.TEXT, allowNull: true },
    mailing_state: { type: DataTypes.STRING(2), allowNull: true },
    mailing_zip: { type: DataTypes.TEXT, allowNull: true },

    // Licensing
    sales_tax_id: { type: DataTypes.TEXT, allowNull: false }, // changed from true to false
    state_tobacco_license: { type: DataTypes.TEXT, allowNull: true },
    federal_tobacco_permit: { type: DataTypes.TEXT, allowNull: true },
    resale_certificate_url: { type: DataTypes.TEXT, allowNull: true },
    state_tobacco_license_url: { type: DataTypes.TEXT, allowNull: true },
    business_license_url: { type: DataTypes.TEXT, allowNull: true },
    owner_government_id_url: { type: DataTypes.TEXT, allowNull: true },

    createdBy:{type:DataTypes.TEXT,allowNull:false,defaultValue:'system'},

    // Owners / Officers
    owners: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },

    // Credit + bank
    credit_limit_requested: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    bank_name: { type: DataTypes.TEXT, allowNull: true },
    bank_account_last4: { type: DataTypes.STRING(4), allowNull: true },
    bank_account_enc: { type: DataTypes.BLOB, allowNull: true }, // ciphertext

    // References
    references: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },

    // New fields from Zod schema
    preferred_delivery_days: { type: DataTypes.TEXT, allowNull: true },
    compliance_certification: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    authorized_signature: { type: DataTypes.TEXT, allowNull: false },
    signature_date: { type: DataTypes.TEXT, allowNull: false },

    // Meta
    status: {
      type: DataTypes.ENUM('PENDING', 'REVIEW', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    
    // Timestamps
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: postgresSequelize,
    modelName: 'CustomerRequest',
    tableName: 'customer_requests',
    timestamps: true,
    
  
  }
);
