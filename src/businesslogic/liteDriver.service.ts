import { Op } from 'sequelize';
import { Customer } from '../models/mmsql/customer.model';
import { RetailerLocation } from '../models/postgres/retailerLocation.model';
import { AppError } from '../utils/AppError';

export class LiteDriverService {
  async getCustomerForLatLong(search: string) {
    const term = search?.trim();
    if (!term) return [];

    const orCond: object[] = [
      { C_Name: { [Op.like]: `%${term}%` } },
      { C_Number: { [Op.like]: `%${term}%` } },
    ];

    const customers = await Customer.findAll({
      where: { [Op.or]: orCond as any, C_Inactive: false },
      attributes: ['C_Number', 'C_Name'],
      order: [['C_Name', 'ASC']],
    });

    if (customers.length === 0) return [];

    const numbers = customers.map((c) => c.C_Number);

    const allLocations = await RetailerLocation.findAll({
      where: { C_Number: { [Op.in]: numbers } },
      attributes: ['C_Number', 'addedBy', 'lat', 'long', 'City', 'Country', 'Address', 'State', 'Zip'],
    });

    const adminLocMap = new Map<number, RetailerLocation>();
    const driverOnlySet = new Set<number>();

    for (const loc of allLocations) {
      if (loc.addedBy === 'admin') {
        adminLocMap.set(loc.C_Number, loc);
        driverOnlySet.delete(loc.C_Number);
      } else if (!adminLocMap.has(loc.C_Number)) {
        driverOnlySet.add(loc.C_Number);
      }
    }

    return customers
      .filter((c) => !driverOnlySet.has(c.C_Number))
      .map((c) => {
        const loc = adminLocMap.get(c.C_Number);
        return {
          C_Number: c.C_Number,
          C_Name: c.C_Name ?? null,
          retailerLocation: loc ? loc.toJSON() : null,
        };
      });
  }

  async getCustomerByCNumber(search: string) {
    const term = search?.trim();
    if (!term) return [];

    const orCond: object[] = [
      { C_Name: { [Op.like]: `%${term}%` } },
      { C_Number: { [Op.like]: `%${term}%` } },
    ];

    const customers = await Customer.findAll({
      where: { [Op.or]: orCond as any, C_Inactive: false },
      attributes: ['C_Number', 'C_Name', 'C_CoName', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_Country', 'C_Phone', 'C_PhoneMobile', 'C_Email', 'C_Contact1', 'C_Contact2'],
      order: [['C_Name', 'ASC']],
    });
    if (!customers) {
      throw new AppError('Customer not found', 404);
    }
    return customers;
  }

  async setCustomerLatLong(
    driverId: number,
    body: {
      C_Number: number;
      lat: number;
      long: number;
      City?: string | null;
      Country?: string | null;
      Address?: string | null;
      State?: string | null;
      Zip?: string | null;
    }
  ) {
    const customer = await Customer.findByPk(body.C_Number, {
      attributes: ['C_Number'],
    });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const [row, created] = await RetailerLocation.findOrCreate({
      where: { C_Number: body.C_Number },
      defaults: {
        C_Number: body.C_Number,
        lat: body.lat,
        long: body.long,
        City: body.City ?? null,
        Country: body.Country ?? null,
        Address: body.Address ?? null,
        State: body.State ?? null,
        Zip: body.Zip ?? null,
        addedBy: 'driver',
        driverId,
      },
    });

    if (!created) {
      await row.update({
        lat: body.lat,
        long: body.long,
        City: body.City ?? row.City,
        Country: body.Country ?? row.Country,
        Address: body.Address ?? row.Address,
        State: body.State ?? row.State,
        Zip: body.Zip ?? row.Zip,
        addedBy: 'driver',
        driverId,
      });
    }

    return row.toJSON();
  }
}
