// models/Picklist.ts
import {
    DataTypes,
    Model,
    Optional,
  } from "sequelize";
import { postgresSequelize } from "../../db";
  
  export interface PicklistAttributes {
    id: number;
    name: string;
  
    // JSON object exactly like your example
    selectedFields: {
      lineNumber: boolean;
      orderedQty: boolean;
      scannedQty: boolean;
      description: boolean;
      itemNumber: boolean;
      pack: boolean;
      size: boolean;
      upc: boolean;
      onhand: boolean;
      salesCategory: boolean;
      priceClass: boolean;
      unitCost: boolean;
      extendedCost: boolean;
      retail: boolean;
      section: boolean;
      location: boolean;
      vendorItem: boolean;
      sequence: boolean;
    };
  
    groupBy: string | null;
    newCategoryOnNewPage: boolean;
  
    headerPosition: string | null;    // e.g. "topRight"
    footerPosition: string | null;    // e.g. "left"
    pickedByPosition: string | null;  // e.g. "top"
    checkedByPosition: string | null; // e.g. "top"
  
    showTotalCartons: boolean;
    showTotalPieces: boolean;
    showTotalLines: boolean;
    showPickedBy: boolean;
    showCheckedBy: boolean;
    showBundles: boolean;
  
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export type PicklistCreationAttributes = Optional<
    PicklistAttributes,
    "id" | "groupBy" | "headerPosition" | "footerPosition" | "pickedByPosition" | "checkedByPosition"
  >;
  
  export class Picklist
    extends Model<PicklistAttributes, PicklistCreationAttributes>
    implements PicklistAttributes
  {
    public id!: number;
    public name!: string;

    public selectedFields!: PicklistAttributes["selectedFields"];

    public groupBy!: string | null;
    public newCategoryOnNewPage!: boolean;

    public headerPosition!: string | null;
    public footerPosition!: string | null;
    public pickedByPosition!: string | null;
    public checkedByPosition!: string | null;

    public showTotalCartons!: boolean;
    public showTotalPieces!: boolean;
    public showTotalLines!: boolean;
    public showPickedBy!: boolean;
    public showCheckedBy!: boolean;
    public showBundles!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Picklist.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      selectedFields: {
        // PostgreSQL JSONB (use DataTypes.JSON if you are not on Postgres)
        type: DataTypes.JSONB,
        allowNull: false,
      },
      groupBy: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      newCategoryOnNewPage: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      headerPosition: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      footerPosition: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      pickedByPosition: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      checkedByPosition: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      showTotalCartons: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      showTotalPieces: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      showTotalLines: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      showPickedBy: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      showCheckedBy: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      showBundles: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize: postgresSequelize,
      modelName: "Picklist",
      tableName: "picklist", // change if you need a different table name
      timestamps: true,
    }
  );
  