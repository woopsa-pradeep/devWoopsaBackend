


import { Op, fn, col, literal } from "sequelize";
import moment from "moment";
import { Driver } from "../models/postgres/driver.model";
import { AppError } from "../utils/AppError";
import { AuthMessage, Manager } from "../constants";
import { DeliveryRoute, RouteStatus } from "../models/postgres/deliveryRoute.model";
import {
  DeliveryRouteStop,
  DeliveryStopStatus,
} from "../models/postgres/deliveryRouteStop.model";
import Vehicle from "../models/postgres/vehicle.model";
import { Customer } from "../models/mmsql/customer.model";
import DeliveryRoutePOD, {
  OrderPODStatus,
} from "../models/postgres/deliveryRoutePOD.model";
import { OrderPickBox } from "../models/postgres/epickOrderBox.model";
import { calculateDistanceInMeters, clusterOrdersByLocation, getDirectionsInOrder, getOptimizedDirections } from "../utils/map.utlis";
import DeliveryRouteGroup from "../models/postgres/driverRoutesGroup.model";
import { postgresSequelize, mssqlSequelize } from "../db";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { uploadFileToAzure } from "../utils/azureUploader";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { Distributor } from "../models/mmsql/distributor.model";
import { ARDefinitions } from "../models/mmsql/arDefinitions.model";
import { DriverExpense } from "../models/postgres/driverExpense.model";
import { redisConnection } from "../configuration/config";
import {
  getDriverLastSyncKey,
  getDriverLocationKey,
  getDriverLocationPattern,
} from "../utils/redis.keys";
import { ICustomerAttributes } from "../interfaces/customer.interface";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";
import { RetailerLocation } from "../models/postgres/retailerLocation.model";
import { Retailer } from "../models/postgres/retailer.model";
import { OrderDetail } from "../models/mmsql/orderDetail.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import PriceClass from "../models/mmsql/priceClass.mode";
import SalesCategory from "../models/mmsql/salesCategory.model";
import { PlaceOrder } from "../interfaces/cart.interface";
import { getDefaultOrderDetailValues, getDefaultOrderValues, getNextOrderNumber, sendEmailToOrder } from "../utils/order";
import { OptionDefsValues } from "../models/mmsql/optionDefsValue.model";

interface DriverAssignment {
  driverId: number;
  truckId: number;
  split: number;
}

interface OrderInput {
  orderNumber: number;
  C_Number: number;
  lat: number;
  lng: number;
}

interface PreviewMultiRouteBody {
  day: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  drivers: DriverAssignment[];
  orders: OrderInput[];
}
interface CreateMultiRouteBody {
  day: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  drivers: DriverAssignment[];
  orders: OrderInput[];
}

interface DriverLocationCachePayload {
  driverId: number;
  currentLatitude: number;
  currentLongitude: number;
  updatedAt: string;
}


const DRIVER_LOCATION_TTL_SECONDS = 2100;
const DRIVER_LOCATION_DB_SYNC_MS = 5 * 60 * 1000;


export class DriverService {

  async getDriverOrderList() {
    return [];
  }

  async updateDriverLatLong(driverId: number, body: any) {
    const { currentLocation, currentLatitude, currentLongitude } = body;

    if (
      currentLatitude === undefined ||
      currentLongitude === undefined
    ) {
      throw new AppError(AuthMessage.MISSING_DEVICE_FIELDS, 400);
    }

    const driver = await Driver.findOne({
      where: { id: driverId, isActive: true },
    });

    if (!driver) {
      throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
    }

    await driver.update({
      currentLatitude: currentLatitude,
      currentLongitude: currentLongitude,
    });

    const now = Date.now();
    const updatedAt = new Date(now).toISOString();
    const locationKey = getDriverLocationKey(driverId);
    const lastSyncKey = getDriverLastSyncKey(driverId);

    const payload: DriverLocationCachePayload = {
      driverId,
      currentLatitude: Number(currentLatitude),
      currentLongitude: Number(currentLongitude),
      updatedAt,
    };

    let syncedToDb = false;

    try {
      await redisConnection.setex(
        locationKey,
        DRIVER_LOCATION_TTL_SECONDS,
        JSON.stringify(payload)
      );

      const lastSyncValue = await redisConnection.get(lastSyncKey);
      const shouldSyncDb =
        !lastSyncValue || now - Number(lastSyncValue) >= DRIVER_LOCATION_DB_SYNC_MS;

      if (shouldSyncDb) {
        await driver.update({
          currentLatitude: payload.currentLatitude,
          currentLongitude: payload.currentLongitude,
          ...(currentLocation !== undefined ? { currentLocation } : {}),
        });
        await redisConnection.setex(
          lastSyncKey,
          DRIVER_LOCATION_TTL_SECONDS,
          String(now)
        );
        syncedToDb = true;
      }
    } catch (error: any) {
      console.error("Driver location write-behind cache failed:", error?.message || error);
      await driver.update({
        currentLatitude: payload.currentLatitude,
        currentLongitude: payload.currentLongitude,
        ...(currentLocation !== undefined ? { currentLocation } : {}),
      });
      syncedToDb = true;
    }

    return {
      ...payload,
      currentLocation: currentLocation ?? driver.currentLocation,
      syncedToDb,
    };
  }

  async getDriverCurrentLocation(driverId: number) {
    const locationKey = getDriverLocationKey(driverId);
    const cachedValue = await redisConnection.get(locationKey);

    if (cachedValue) {
      try {
        const parsed = JSON.parse(cachedValue) as DriverLocationCachePayload;
        return { ...parsed, source: "redis" };
      } catch (error: any) {
        console.warn(
          `Invalid driver location cache payload for driver ${driverId}:`,
          error?.message || error
        );
      }
    }

    const driver = await Driver.findOne({
      where: { id: driverId, isActive: true },
      attributes: ["id", "currentLatitude", "currentLongitude", "updatedAt"],
    });

    if (!driver) {
      throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
    }

    const fallbackPayload: DriverLocationCachePayload = {
      driverId: driver.id,
      currentLatitude: Number(driver.currentLatitude ?? 0),
      currentLongitude: Number(driver.currentLongitude ?? 0),
      updatedAt: driver.updatedAt
        ? new Date(driver.updatedAt).toISOString()
        : new Date().toISOString(),
    };

    return { ...fallbackPayload, source: "db" };
  }

  async getProfile(id: number) {
    const driver = await Driver.findOne({
      where: { id, isActive: true },
    });
    const wareHouse = await Distributor.findOne({ attributes: ['D_Name', 'D_Addr1', 'D_Addr2', 'D_City', 'D_State', 'D_Zip'] })
    if (!wareHouse) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }
    if (!driver) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }
    return {
      ...driver.get({ plain: true }),
      wareHouse: wareHouse.get({ plain: true }),
    };
  }

  async getTodayDriverOrders(driverId: number) {
    const today = moment().format("YYYY-MM-DD");
    console.log("today", today);

    // Fetch routes with vehicle + stops included via association (routeId FK)
    const routes = await DeliveryRoute.findAll({
      where: {
        driverId,
        isActive: true,
        day: today,
        routeStatus: { [Op.not]: RouteStatus.COMPLETED }
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["id", "description", "vinNumber"],
        },
        {
          model: DeliveryRouteStop,
          as: "stops",
          required: false,
          where: { isActive: true },
        },
      ],
      order: [
        ["id", "ASC"],
        [{ model: DeliveryRouteStop, as: "stops" }, "stopSequence", "ASC"],
      ],
    });

    if (routes.length === 0) {
      return [];
    }

    return routes.map((route) => {
      const plain = route.get({ plain: true }) as any;
      const stops: any[] = plain.stops ?? [];

      const totalStops = stops.length;

      const stopCountByStatus = {
        not_delivered: 0,
        in_progress: 0,
        delivered: 0,
        skipped: 0,
        failed: 0,
        returned: 0,
      };

      for (const s of stops) {
        const status = s.status as keyof typeof stopCountByStatus;
        if (status in stopCountByStatus) {
          stopCountByStatus[status]++;
        }
      }

      const completionPercentage =
        totalStops === 0
          ? 0
          : Number(
            ((stopCountByStatus.delivered * 100) / totalStops).toFixed(1)
          );

      const isCompleteRoute = !stops.some(
        (s) => s.status === DeliveryStopStatus.IN_PROGRESS || s.status === DeliveryStopStatus.NOT_DELIVERED
      );

      return {
        ...plain,
        totalStops,
        stopCountByStatus,
        completionPercentage,
        isCompleteRoute,
      };
    });
  }


  async startNavigation(routeId: number, driverId: number) {
    const route = await DeliveryRoute.findOne({
      where: { id: routeId, driverId, isActive: true },
    });

    if (!route) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }

    const firstInProgressStop = await DeliveryRouteStop.findOne({
      where: {
        routeId,
        status: DeliveryStopStatus.IN_PROGRESS,
        isActive: true,
      },
      order: [["stopSequence", "ASC"]],
    });

    if (firstInProgressStop) {


      let pod = await DeliveryRoutePOD.findOne({
        where: {
          routeId,
          routeStopId: firstInProgressStop.id,
          driverId,
          isActive: true,
        },
      });

      await DeliveryRoute.update({
        routeStatus: RouteStatus.IN_PROGRESS,
      }, { where: { id: routeId } });

      if (!pod) {
        const epicBoxes = await OrderPickBox.findAll({
          where: {
            orderNumber: firstInProgressStop.orderNumber,
          },
        });

        const boxBarCode: string[] = [];
        const scanBarCode: string[] = [];
        const expectedBundles = epicBoxes.length;

        for (const box of epicBoxes) {
          if (box.value) {
            boxBarCode.push(box.value ?? '');
          }
        }

        pod = await DeliveryRoutePOD.create({
          routeId,
          routeStopId: firstInProgressStop.id,
          driverId,
          checkAmount: 0,
          orderNumber: firstInProgressStop.orderNumber,
          C_Number: firstInProgressStop.C_Number,
          boxBarCode,
          paymentTermComplete: false,
          postDeliveryCompleted: false,
          scanBarCode,
          otherMethodPayment: false,
          otherMethodPaymentAmount: [],
          invoiceUrl: firstInProgressStop?.invoiceUrl || null,
          invoiceAmount: firstInProgressStop?.invoiceAmount || 0,
          invoiceMessage: '',
          amount: 0,
          expectedBundles,
          scannedBundles: 0,
          allBundlesScanned: false,
          orderStatus: OrderPODStatus.IN_PROGRESS,
          paymentTerms: 'cash',
          paymentInCheck: false,
          photos: [],
          podAt: new Date(),
          isActive: true,
        });
      }

      return {
        pod: pod!.get({ plain: true }),
        firstStop: firstInProgressStop.get({ plain: true }),
      };


    } else {
      const firstStop = await DeliveryRouteStop.findOne({
        where: {
          routeId,
          status: DeliveryStopStatus.NOT_DELIVERED,
          isActive: true,
        },
        order: [["stopSequence", "ASC"]],
      });

      if (!firstStop) {
        throw new AppError("No pending delivery stop found for this route", 404);
      }
      let pod = await DeliveryRoutePOD.findOne({
        where: {
          routeId,
          routeStopId: firstStop.id,
          driverId,
          isActive: true,
        },
      });

      await DeliveryRoute.update({
        routeStatus: RouteStatus.IN_PROGRESS,
      }, { where: { id: routeId } });

      if (!pod) {
        const epicBoxes = await OrderPickBox.findAll({
          where: {
            orderNumber: firstStop.orderNumber,
          },
        });

        const boxBarCode: string[] = [];
        const scanBarCode: string[] = [];
        const expectedBundles = epicBoxes.length;

        for (const box of epicBoxes) {
          if (box.barcode) {
            const normalizedBoxValue = String(box.value ?? '').replace(/\.0+$/, '');
            boxBarCode.push(normalizedBoxValue);
          }
        }

        pod = await DeliveryRoutePOD.create({
          routeId,
          routeStopId: firstStop.id,
          driverId,
          orderNumber: firstStop.orderNumber,
          C_Number: firstStop.C_Number,
          boxBarCode,
          scanBarCode,
          checkAmount: 0,
          otherMethodPayment: false,
          otherMethodPaymentAmount: [],
          amount: 0,
          invoiceUrl: firstStop?.invoiceUrl || null,
          invoiceAmount: firstStop?.invoiceAmount || 0,
          invoiceMessage: '',
          paymentTermComplete: false,
          postDeliveryCompleted: false,
          expectedBundles,
          scannedBundles: 0,
          allBundlesScanned: false,
          orderStatus: OrderPODStatus.IN_PROGRESS,
          paymentTerms: 'cash',
          paymentInCheck: false,
          photos: [],
          podAt: new Date(),
          isActive: true,
        });
      }

      return {
        pod: pod!.get({ plain: true }),
        firstStop: firstStop.get({ plain: true }),
      };
    }



  }

  async getRouteFullDetails(routeId: number) {

    const routeStopDetails = await DeliveryRouteStop.findAll({
      where: { routeId, isActive: true },
      order: [["stopSequence", "ASC"]],
    });

    const finalRouteDetails = Promise.all(routeStopDetails.map(async (stop) => {
      const findCustomer = await Customer.findOne({
        where: { C_Number: stop.C_Number },
        attributes: [
          'C_Number',
          'C_Name',
          'C_Address',
          'C_City',
          'C_State',
          'C_Zip',
        ],
      });

      if (!findCustomer) {
        throw new AppError(Manager.RECORD_NOT_FOUND, 404);
      }

      const stopDetails = {
        ...stop.get({ plain: true }),
        customer: findCustomer.get({ plain: true }),
      };

      return stopDetails;
    }));

    return finalRouteDetails;
  }


  async dashboardDetails(driverId: number) {

    const today = moment().format("YYYY-MM-DD");
    const todayRoutes = await DeliveryRoute.findAll({
      where: {
        driverId: driverId,
        isActive: true,
        day: today,
      },
      attributes: ["id"],
    });

    const routeIds = todayRoutes.map((r: any) => r.id);
    const todayStopsCount =
      routeIds.length === 0
        ? 0
        : await DeliveryRouteStop.count({
          where: {
            isActive: true,
            routeId: { [Op.in]: routeIds },
          },
        });


    const totalStopsCompleted = await DeliveryRouteStop.count({
      where: {
        isActive: true,
        status: DeliveryStopStatus.DELIVERED,
      },
      include: [
        {
          model: DeliveryRoute,
          as: "route",
          where: {
            driverId: driverId,
            isActive: true,
            // day: today,
          },
          attributes: [],
        },
      ],
    });

    const totalStopsSkipped = await DeliveryRouteStop.count({
      where: {
        isActive: true,
        status: DeliveryStopStatus.SKIPPED,
      },
      include: [
        {
          model: DeliveryRoute,
          as: "route",
          where: {
            driverId: driverId,
            isActive: true,
            // day: today,
          },
          attributes: [],
        },
      ],
    });

    const totalPendingStops = await DeliveryRouteStop.count({
      where: {
        isActive: true,
        status: DeliveryStopStatus.NOT_DELIVERED,
      },
      include: [
        {
          model: DeliveryRoute,
          as: "route",
          where: {
            driverId: driverId,
            isActive: true,
            // day: today,
          },
          attributes: [],
        },
      ],
    });



    return { todayStopsCount, totalStopsCompleted, totalStopsSkipped, totalPendingStops };
  }


  async previewMultiDriverRoutes(body: PreviewMultiRouteBody) {
    const { day, origin, destination, drivers, orders } = body;

    // ── Validations ──────────────────────────────────────
    if (!day) throw new AppError('day is required', 400);
    if (!origin) throw new AppError('origin is required', 400);
    if (!destination) throw new AppError('destination is required', 400);
    if (!drivers?.length) throw new AppError('At least 1 driver required', 400);
    if (!orders?.length) throw new AppError('At least 1 order required', 400);

    if (orders.length < drivers.length) {
      throw new AppError(
        `Cannot split ${orders.length} orders into ${drivers.length} routes`,
        400
      );
    }

    // ── Check if manual split or auto cluster ────────────
    const isManualSplit = drivers.some((d: any) => d.split && d.split > 0);

    // ── Validate manual split total = orders.length ──────
    if (isManualSplit) {
      const totalSplit = drivers.reduce((sum: number, d: any) => sum + (d.split ?? 0), 0);
      if (totalSplit !== orders.length) {
        throw new AppError(
          `Split total (${totalSplit}) must equal total orders (${orders.length})`,
          400
        );
      }
    }

    // ── Step 1: Cluster or Manual Split ──────────────────
    let clusters: any[][] = [];

    if (isManualSplit) {
      // Manual split — just slice orders array by split count
      let startIndex = 0;
      for (const driver of drivers) {
        const count = driver.split ?? 0;
        clusters.push(orders.slice(startIndex, startIndex + count));
        startIndex += count;
      }
    } else {
      // Auto cluster by geography (K-Means)
      clusters = clusterOrdersByLocation(orders, drivers.length);
    }

    // ── Step 2: For each cluster get Google Maps preview ─
    const previewRoutes: any[] = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const driver = drivers[i];

      if (!cluster.length) continue;

      // Google Maps optimize
      const { waypointOrder, polyline, legs, totalKilometers } =
        await getOptimizedDirections(
          origin,
          destination,
          cluster.map((o: any) => ({ lat: o.lat, lng: o.lng }))
        );

      // Total duration
      const totalDurationSeconds = legs.reduce(
        (sum: number, leg: any) => sum + Number(leg?.duration?.value ?? 0),
        0
      );
      const totalDurationInMinutes = Math.ceil(totalDurationSeconds / 60);
      const totalMiles = Number((totalKilometers * 0.621371).toFixed(4));

      // Build optimized stops
      const stops = waypointOrder.map((originalIndex: number, optimizedIndex: number) => {
        const order = cluster[originalIndex];
        const leg = legs[optimizedIndex];

        const legKm = Number(
          ((Number(leg?.distance?.value ?? 0)) / 1000).toFixed(3)
        );

        const cumulativeKm = Number(
          (legs
            .slice(0, optimizedIndex + 1)
            .reduce((sum: number, l: any) => sum + Number(l?.distance?.value ?? 0), 0) / 1000
          ).toFixed(3)
        );

        const stopLocation = leg?.end_location || { lat: order.lat, lng: order.lng };
        const startLocation = optimizedIndex === 0
          ? origin
          : legs[optimizedIndex - 1]?.end_location || origin;

        const etaSeconds = legs
          .slice(0, optimizedIndex + 1)
          .reduce((sum: number, l: any) => sum + Number(l?.duration?.value ?? 0), 0);
        const etaMinutes = Math.ceil(etaSeconds / 60);

        return {
          stopSequence: optimizedIndex + 1,
          orderNumber: order.orderNumber,
          C_Number: order.C_Number,
          latitude: Number(stopLocation.lat),
          longitude: Number(stopLocation.lng),
          startLatitude: Number(startLocation.lat),
          startLongitude: Number(startLocation.lng),
          endLatitude: Number(stopLocation.lat),
          endLongitude: Number(stopLocation.lng),
          distanceKm: legKm,
          cumulativeKm,
          etaMinutes,
          isLastStop: optimizedIndex === cluster.length - 1,
        };
      });

      previewRoutes.push({
        driverId: driver.driverId,
        truckId: driver.truckId,
        day,
        totalStops: cluster.length,
        totalKilometers: Number(totalKilometers.toFixed(2)),
        totalMiles,
        totalDurationInMinutes,
        polyline,
        stops,
      });
    }

    return {
      totalOrders: orders.length,
      totalDrivers: drivers.length,
      routes: previewRoutes,
    };
  }


  async createMultiDriverRoutes(body: any) {
    const { day, origin, destination, previewedRoutes } = body;

    // ── Validations ──────────────────────────────────────────────
    if (!day) throw new AppError('day is required', 400);
    if (!origin) throw new AppError('origin is required', 400);
    if (!destination) throw new AppError('destination is required', 400);
    if (!previewedRoutes?.length) throw new AppError('previewedRoutes is required', 400);

    // ── Check duplicate driverIds ────────────────────────────────
    const driverIds = previewedRoutes.map((r: any) => r.driverId);
    if (new Set(driverIds).size !== driverIds.length) {
      throw new AppError('Duplicate driverIds found in payload', 400);
    }

    // ── Check duplicate truckIds ─────────────────────────────────
    const truckIds = previewedRoutes.map((r: any) => r.truckId);
    if (new Set(truckIds).size !== truckIds.length) {
      throw new AppError('Duplicate truckIds found in payload', 400);
    }

    // ── Check drivers not already assigned on this day ───────────
    const alreadyAssignedDrivers = await DeliveryRoute.findAll({
      where: {
        day,
        driverId: driverIds,
        routeStatus: { [Op.in]: [RouteStatus.NOT_STARTED, RouteStatus.IN_PROGRESS] },
        isActive: true,
      },
    });
    if (alreadyAssignedDrivers.length) {
      const conflictIds = [...new Set(alreadyAssignedDrivers.map((r: any) => r.driverId))];
      throw new AppError(
        `These drivers already have routes on ${day}: ${conflictIds.join(', ')}`,
        400
      );
    }

    // ── Check trucks not already assigned on this day ────────────
    const alreadyAssignedTrucks = await DeliveryRoute.findAll({
      where: {
        day,
        truckId: truckIds,
        routeStatus: { [Op.in]: [RouteStatus.NOT_STARTED, RouteStatus.IN_PROGRESS] },
        isActive: true,
      },
    });
    if (alreadyAssignedTrucks.length) {
      const conflictIds = [...new Set(alreadyAssignedTrucks.map((r: any) => r.truckId))];
      throw new AppError(
        `These trucks already have routes on ${day}: ${conflictIds.join(', ')}`,
        400
      );
    }

    // ── Step 1: Enrich routes — call Google Maps if needed ───────
    const enrichedRoutes: any[] = [];

    for (const preview of previewedRoutes) {

      const needsGoogleMaps =
        !preview.polyline ||
        preview.polyline === '' ||
        Number(preview.totalKilometers) === 0 ||
        Number(preview.totalDurationInMinutes) === 0;

      let polyline = preview.polyline;
      let totalKilometers = preview.totalKilometers;
      let totalMiles = preview.totalMiles;
      let totalDurationInMinutes = preview.totalDurationInMinutes;
      let enrichedStops = preview.stops;

      if (needsGoogleMaps) {
        const directions = await getDirectionsInOrder(
          origin,
          destination,
          preview.stops.map((s: any) => ({ lat: s.latitude, lng: s.longitude }))
        );

        polyline = directions.polyline;
        totalKilometers = directions.totalKilometers;
        totalMiles = directions.totalMiles;
        totalDurationInMinutes = directions.totalDurationInMinutes;

        enrichedStops = preview.stops.map((stop: any, index: number) => {
          const leg = directions.legs[index];

          const legKm = Number(((leg?.distanceMeters ?? 0) / 1000).toFixed(3));

          const cumulativeKm = Number(
            (
              directions.legs
                .slice(0, index + 1)
                .reduce((sum: number, l: any) => sum + (l?.distanceMeters ?? 0), 0) / 1000
            ).toFixed(3)
          );

          const etaSeconds = directions.legs
            .slice(0, index + 1)
            .reduce((sum: number, l: any) => sum + (l?.durationSeconds ?? 0), 0);

          return {
            ...stop,
            distanceKm: legKm,
            cumulativeKm,
            etaMinutes: Math.ceil(etaSeconds / 60),
          };
        });
      }

      enrichedRoutes.push({
        ...preview,
        polyline,
        totalKilometers,
        totalMiles,
        totalDurationInMinutes,
        stops: enrichedStops,
      });
    }

    // ── Step 2: One transaction — create group + routes + stops ──
    let finalResult: any = {};

    await postgresSequelize.transaction(async (t) => {

      // ── Create Route Group ──────────────────────────────────
      const groupNumber = `GRP-${day}-${Date.now()}`;

      const totalOrders = enrichedRoutes.reduce(
        (sum: number, r: any) => sum + r.stops.length, 0
      );

      const routeGroup = await DeliveryRouteGroup.create(
        {
          groupNumber,
          day,
          routeType: 'auto',
          totalOrders,
          totalRoutes: enrichedRoutes.length,
          totalStops: 0,
          totalKilometers: 0,
          totalMiles: 0,
          originLat: origin.lat,
          originLng: origin.lng,
          destinationLat: destination.lat,
          destinationLng: destination.lng,
          status: 'not_started',
          isActive: true,
        },
        { transaction: t }
      );

      const createdRoutes: any[] = [];

      // ── Loop each enriched route ──────────────────────────────
      for (const preview of enrichedRoutes) {
        const routeNumber = `R-${day}-D${preview.driverId}`;

        // ── Create DeliveryRoute ──────────────────────────────
        const route = await DeliveryRoute.create(
          {
            routeGroupId: routeGroup.id,
            routeNumber,
            routeGroupKey: routeNumber,
            day,
            driverId: preview.driverId,
            truckId: preview.truckId,
            orderStartLat: origin.lat,
            orderStartLong: origin.lng,
            orderEndLat: destination.lat,
            orderEndLong: destination.lng,
            routeStatus: 'not_started',
            totalStops: preview.stops.length,
            completedStops: 0,
            totalKilometers: preview.totalKilometers,
            totalMiles: preview.totalMiles,
            totalDurationInMinutes: preview.totalDurationInMinutes,
            polyline: preview.polyline,
            hasChildren: false,
            parentRouteId: 0,    // ✅ fixed: was 0
            splitIndex: 0,
            isActive: true,
          },
          { transaction: t }
        );

        // ── Build Stops ───────────────────────────────────────
        const stops = preview.stops.map((stop: any) => ({
          routeId: route.id,
          routeName: routeNumber,
          day,
          orderNumber: stop.orderNumber,
          C_Number: stop.C_Number,
          stopSequence: stop.stopSequence,
          type: stop.type,
          latitude: stop.latitude,
          longitude: stop.longitude,
          startLatitude: stop.startLatitude,
          startLongitude: stop.startLongitude,
          endLatitude: stop.endLatitude,
          endLongitude: stop.endLongitude,
          invoiceUrl: stop.invoiceUrl ?? null,   // ✅ fixed
          invoiceAmount: stop.invoiceAmount ?? null,   // ✅ fixed: was || 0
          totalKilometers: stop.distanceKm,
          status: 'not_delivered',
          isLastStop: stop.isLastStop,
          isActive: true,
        }));

        await DeliveryRouteStop.bulkCreate(stops, { transaction: t });

        // ── Update OrderHeader route_created flag ─────────────
        const orderNumbersToUpdate: number[] = preview.stops.map(
          (stop: any) => stop.orderNumber
        );

        if (orderNumbersToUpdate.length > 0) {
          await OrderHeader.update(
            { route_created: true },
            { where: { Order_Number: { [Op.in]: orderNumbersToUpdate as any } } }
          );
        }

        createdRoutes.push({
          routeId: route.id,
          routeNumber,
          driverId: preview.driverId,
          truckId: preview.truckId,
          totalStops: preview.stops.length,
          totalKilometers: preview.totalKilometers,
          totalMiles: preview.totalMiles,
          totalDurationInMinutes: preview.totalDurationInMinutes,
          polyline: preview.polyline,
        });
      }

      // ── Update Route Group totals ─────────────────────────────
      const sumKilometers = Number(
        createdRoutes.reduce((sum, r) => sum + r.totalKilometers, 0).toFixed(2)
      );
      const sumMiles = Number(
        createdRoutes.reduce((sum, r) => sum + r.totalMiles, 0).toFixed(4)
      );
      const sumStops = createdRoutes.reduce((sum, r) => sum + r.totalStops, 0);

      await DeliveryRouteGroup.update(
        {
          totalKilometers: sumKilometers,
          totalMiles: sumMiles,
          totalStops: sumStops,
        },
        { where: { id: routeGroup.id }, transaction: t }
      );

      finalResult = {
        message: `${createdRoutes.length} routes created successfully`,
        routeGroup: {
          id: routeGroup.id,
          groupNumber: routeGroup.groupNumber,
          day,
          totalOrders,
          totalRoutes: createdRoutes.length,
          totalStops: sumStops,
          totalKilometers: sumKilometers,
          totalMiles: sumMiles,
        },
        childRoutes: createdRoutes,
      };
    });

    return finalResult;
  }
  async startDeliveryRoute(routeId: number, stopId: number, driverId: number) {
    const route = await DeliveryRoute.findOne({
      where: { id: routeId, driverId, isActive: true },
    });
    if (!route) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }


    const stop = await DeliveryRouteStop.findOne({
      where: { routeId, isActive: true },
    });
    if (!stop) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }

    await DeliveryRouteStop.update({
      status: DeliveryStopStatus.IN_PROGRESS,
      arrivedAt: new Date(),
      routeStarted: true,
    }, { where: { id: stopId } });

    const updatedRoute = await DeliveryRoute.update({
      routeStatus: RouteStatus.IN_PROGRESS,
    }, { where: { id: routeId } });

    return {
      message: 'Delivery route started successfully',
      route: route.get({ plain: true }),
      stop: stop.get({ plain: true }),
      updatedRoute: updatedRoute[0] > 0 ? true : false,
    };


  }

  async updateDeliveryPod(podId: number, body: any) {

    const pod = await DeliveryRoutePOD.findOne({
      where: { id: podId, isActive: true },
    });
    if (!pod) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }
    await DeliveryRoutePOD.update(body, { where: { id: podId } });
    const updatedPod = await DeliveryRoutePOD.findByPk(podId);
    return {
      message: 'Delivery pod updated successfully',
      pod: updatedPod?.get({ plain: true }) || null,
    };
  }

  async uploadImages(req: any) {
    const file = req.file;
    if (!file) {
      throw new AppError('File not found', 404);
    }
    const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, 'driver-attachments');
    if (!result.success) {
      throw new AppError(result.error || 'Failed to upload image', 500);
    }
    return result;
  }

  async updateStop(id: number, body: any) {
    const stop = await DeliveryRouteStop.findOne({
      where: { id: id, isActive: true },
    });
    if (!stop) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }
    await DeliveryRouteStop.update(body, { where: { id: id } });
    return stop;
  }


  async orderStopCompleted(stopId: number) {
    const stop = await DeliveryRouteStop.findOne({
      where: { id: stopId, isActive: true },
    });
    if (!stop) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }

    await DeliveryRouteStop.update({
      status: DeliveryStopStatus.DELIVERED,
      deliveredAt: new Date(),
    }, { where: { id: stopId } });

    await OrderHeader.update({
      deliverd: true,
    }, { where: { Order_Number: stop.orderNumber } });

    if (stop.isLastStop) {
      let completedStops = await DeliveryRoute.findOne({
        where: { id: stop.routeId, isActive: true },
      });
      if (!completedStops) {
        throw new AppError(Manager.RECORD_NOT_FOUND, 404);
      }

    }
    const updateLastStop = await DeliveryRoute.findOne({
      where: { id: stop.routeId, isActive: true },
    })

    if (updateLastStop) {
      await DeliveryRoute.update({
        completedStops: updateLastStop.completedStops + 1,
      }, { where: { id: stop.routeId } });
    }

    const nextStop = await DeliveryRouteStop.findOne({
      where: {
        routeId: stop.routeId,
        stopSequence: stop.stopSequence + 1,
        isActive: true,
      },
    });

    if (nextStop) {
      await DeliveryRouteStop.update({
        status: DeliveryStopStatus.IN_PROGRESS,
      }, { where: { id: nextStop?.id } });
    }

    return {
      orderCompleted: false,
      nextStop: nextStop ? nextStop.get({ plain: true }) : null,
    };
  }

  async getDriverCurrentOrder(driverId: number, orderId: number) {
    console.log(driverId, 'driverId')
    const currentRoute = await DeliveryRoute.findOne({
      where: {
        driverId,
        id: orderId,
        isActive: true,
        routeStatus: RouteStatus.IN_PROGRESS,
      },
    });
    if (!currentRoute) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }
    const currentStop = await DeliveryRouteStop.findOne({
      where: {
        routeId: currentRoute.id,
        isActive: true,
        status: DeliveryStopStatus.IN_PROGRESS,
      },
    });
    if (!currentStop) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }
    console.log(currentRoute.id, currentStop.id, 'currentRoute.id, currentStop.id')
    const deliveryPod = await DeliveryRoutePOD.findOne({
      where: {
        routeId: currentRoute.id,
        routeStopId: currentStop.id,
        isActive: true,
      },
    });
    if (!deliveryPod) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }
    return {
      route: currentRoute.get({ plain: true }),
      stop: currentStop.get({ plain: true }),
      pod: deliveryPod.get({ plain: true }),
    };
  }

  async getTodayDriverStops(driverId: number) {

    const today = moment().format("YYYY-MM-DD");

    // Fetch routes with vehicle + stops included via association (routeId FK)
    const routes = await DeliveryRoute.findAll({
      where: {
        driverId,
        isActive: true,
        day: today,
        routeStatus: { [Op.not]: RouteStatus.COMPLETED }
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["id", "description", "vinNumber"],
        },
        {
          model: DeliveryRouteStop,
          as: "stops",
          required: false,
          where: { isActive: true },
        },
      ],
      order: [
        ["id", "ASC"],
        [{ model: DeliveryRouteStop, as: "stops" }, "stopSequence", "ASC"],
      ],
    });

    if (routes.length === 0) {
      return [];
    }

    const allCNumbers = [
      ...new Set(
        routes.flatMap((r: any) =>
          (r.stops || []).map((s: any) => s.C_Number)
        )
      ),
    ];

    const customers = await Customer.findAll({
      where: { C_Number: { [Op.in]: allCNumbers } },
      attributes: ["C_Number", "C_Name", "C_Address", "C_State", "C_Zip", "C_City", "C_Phone", "C_PhoneMobile"],
      raw: true,
    });

    const customerMap = new Map(
      customers.map((c: any) => [c.C_Number, c])
    );

    const finalResult = routes.map((route: any) => {
      const routeData = route.get({ plain: true });

      routeData.stops = (routeData.stops || []).map((stop: any) => {
        const customer = customerMap.get(stop.C_Number);
        return {
          warehouse: {
            endLatitude: route.orderEndLat,
            endLongitude: route.orderEndLong,
            startLatitude: route.orderStartLat,
            startLongitude: route.orderStartLong,
          },
          ...stop,
          C_Name: customer?.C_Name || null,
          C_Address: customer?.C_Address || null,
          C_State: customer?.C_State || null,
          C_Zip: customer?.C_Zip || null,
          C_City: customer?.C_City || null,
          C_Phone: customer?.C_Phone || null,
          C_PhoneMobile: customer?.C_PhoneMobile || null,

        };
      });
      return routeData;
    });

    return finalResult;
  }

  async updateDriverLation(driverId: number, body: any) {
    return this.updateDriverLatLong(driverId, body);
  }


  async getPaymentOptions() {
    const paymentOptions = await ARDefinitions.findAll({
      where: {
        AR_Ref: 'PMT',
        AR_SubTypeRef: {
          [Op.notIn]: [''],
        },

      },
      attributes: ['AR_SubTypeRef'],
    });
    return paymentOptions;
  }

  async createDriverExpense(driverId: number, body: any) {
    const driver = await Driver.findOne({
      where: { id: driverId, isActive: true },
    });
    if (!driver) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }
    if (body.vehicleId != null) {
      const vehicle = await Vehicle.findOne({
        where: { id: body.vehicleId, isActive: true },
      });
      if (!vehicle) {
        throw new AppError(Manager.RECORD_NOT_FOUND, 404);
      }
    }
    const receiptUrl =
      typeof body.receiptUrl === 'string' && body.receiptUrl.trim() !== ''
        ? body.receiptUrl.trim()
        : null;
    const notes =
      typeof body.notes === 'string' && body.notes.trim() !== ''
        ? body.notes.trim()
        : null;
    const arSubTypeRef = String(body.arSubTypeRef).toLowerCase().trim();
    const expense = await DriverExpense.create({
      driverId,
      expenseCategory: String(body.expenseCategory).trim(),
      vehicleId: body.vehicleId ?? null,
      expenseType: String(body.expenseType).trim(),
      amount: body.amount,
      expenseDate: moment(body.expenseDate).format('YYYY-MM-DD'),
      arSubTypeRef,
      receiptUrl,

      notes,
    });
    return expense.reload({
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: [
            'id',
            'description',
            'truckType',
            'licenseRegistrationNumber',
          ],
        },
      ],
    });
  }

  async listDriverExpenses(
    driverId: number,
    query?: { startDate?: Date; endDate?: Date }
  ) {
    const where: any = { driverId };
    if (query?.startDate && query?.endDate) {
      where.expenseDate = {
        [Op.between]: [
          moment(query.startDate).format('YYYY-MM-DD'),
          moment(query.endDate).format('YYYY-MM-DD'),
        ],
      };
    } else if (query?.startDate) {
      where.expenseDate = {
        [Op.gte]: moment(query.startDate).format('YYYY-MM-DD'),
      };
    } else if (query?.endDate) {
      where.expenseDate = {
        [Op.lte]: moment(query.endDate).format('YYYY-MM-DD'),
      };
    }
    return DriverExpense.findAll({
      where,
      order: [
        ['expenseDate', 'DESC'],
        ['id', 'DESC'],
      ],
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: [
            'id',
            'description',
            'truckType',
            'licenseRegistrationNumber',
          ],
        },
      ],
    });
  }

  async getDriverExpenseById(driverId: number, expenseId: number) {
    const expense = await DriverExpense.findOne({
      where: { id: expenseId, driverId },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: [
            'id',
            'description',
            'truckType',
            'licenseRegistrationNumber',
          ],
        },
      ],
    });
    if (!expense) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }
    return expense;
  }

  async updateDriverExpense(driverId: number, expenseId: number, body: any) {
    const expense = await DriverExpense.findOne({
      where: { id: expenseId, driverId },
    });
    if (!expense) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }
    if (body.vehicleId !== undefined && body.vehicleId !== null) {
      const vehicle = await Vehicle.findOne({
        where: { id: body.vehicleId, isActive: true },
      });
      if (!vehicle) {
        throw new AppError(Manager.RECORD_NOT_FOUND, 404);
      }
    }
    const patch: any = {};
    if (body.vehicleId !== undefined) {
      patch.vehicleId = body.vehicleId;
    }
    if (body.expenseType !== undefined) {
      patch.expenseType = String(body.expenseType).trim();
    }
    if (body.amount !== undefined) {
      patch.amount = body.amount;
    }
    if (body.expenseDate !== undefined) {
      patch.expenseDate = moment(body.expenseDate).format('YYYY-MM-DD');
    }
    if (body.arSubTypeRef !== undefined) {
      patch.arSubTypeRef = String(body.arSubTypeRef).toLowerCase().trim();
    }
    if (body.receiptUrl !== undefined) {
      patch.receiptUrl =
        typeof body.receiptUrl === 'string' && body.receiptUrl.trim() !== ''
          ? body.receiptUrl.trim()
          : null;
    }
    if (body.notes !== undefined) {
      patch.notes =
        typeof body.notes === 'string' && body.notes.trim() !== ''
          ? body.notes.trim()
          : null;
    }
    await expense.update(patch);
    return expense.reload({
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: [
            'id',
            'description',
            'truckType',
            'licenseRegistrationNumber',
          ],
        },
      ],
    });
  }

  async deleteDriverExpense(driverId: number, expenseId: number) {
    const expense = await DriverExpense.findOne({
      where: { id: expenseId, driverId },
    });
    if (!expense) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }
    await expense.destroy();
    return { deleted: true };
  }

  async getDriverCurrentVehicle(driverId: number) {
    const currentRoute = await DeliveryRoute.findOne({
      where: {
        driverId,
        isActive: true,
        routeStatus: RouteStatus.IN_PROGRESS,
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'description', 'truckType', 'licenseRegistrationNumber'],
        },
      ],
    });

    if (!currentRoute) {
      return null;
    }

    const row = currentRoute.get({ plain: true }) as { vehicle?: Record<string, unknown> };
    return row.vehicle ?? null;
  }
  /**
   * Moves a stop to a new position (after `insertAfterStopSequence`), applies reschedule metadata,
   * sets the moved stop to not_delivered, and marks one stop as in_progress (default: moved stop's new index).
   */
  async reScheduleStop(driverId: number, stopId: number, body: any) {
    const {
      insertAfterStopSequence,
      inProgressStopSequence: inProgressFromBody,
      reScheduleReason,
      reScheduleNotes,
      notes,
    } = body;

    // ── Validate required fields ──────────────────────────────────
    if (insertAfterStopSequence === undefined || insertAfterStopSequence === null) {
      throw new AppError('insertAfterStopSequence is required', 400);
    }

    return postgresSequelize.transaction(async (transaction) => {

      // ── Find moving stop ──────────────────────────────────────────
      const movingStop = await DeliveryRouteStop.findOne({
        where: { id: stopId, isActive: true },
        transaction,
        lock: true,
      });
      if (!movingStop) throw new AppError('Stop not found', 404);

      // ── Validate route belongs to this driver ─────────────────────
      const route = await DeliveryRoute.findOne({
        where: { id: movingStop.routeId, driverId, isActive: true },
        transaction,
      });
      if (!route) throw new AppError('Route not found for this driver', 404);

      // ── Cannot reschedule a delivered stop ────────────────────────
      if (movingStop.status === DeliveryStopStatus.DELIVERED) {
        throw new AppError('Cannot reschedule a delivered stop', 400);
      }

      // ── Cannot reschedule on completed/cancelled route ────────────
      if (
        route.routeStatus === RouteStatus.COMPLETED ||
        route.routeStatus === RouteStatus.CANCELLED
      ) {
        throw new AppError(
          `Cannot reschedule on a ${route.routeStatus} route`,
          400
        );
      }

      // ── Fetch all active stops for this route ─────────────────────
      const allRows = await DeliveryRouteStop.findAll({
        where: { routeId: movingStop.routeId, isActive: true },
        order: [['stopSequence', 'ASC']],
        transaction,
      });

      const allStops = allRows.map((r) =>
        r.get({ plain: true })
      ) as Array<Record<string, any>>;

      // ── Validate insertAfterStopSequence ──────────────────────────
      if (insertAfterStopSequence > 0) {
        const anchor = allStops.find(
          (s) => s.stopSequence === insertAfterStopSequence
        );
        if (!anchor) {
          throw new AppError(
            'insertAfterStopSequence does not match any stop on this route',
            400
          );
        }
        if (anchor.id === stopId) {
          throw new AppError(
            'Cannot insert after the same stop being moved',
            400
          );
        }
      }

      // ── Build new stop order ──────────────────────────────────────
      const without = allStops
        .filter((s) => s.id !== stopId)
        .sort((a, b) => a.stopSequence - b.stopSequence);

      const moving = allStops.find((s) => s.id === stopId)!;

      let newOrder: typeof allStops;

      if (insertAfterStopSequence === 0) {
        // Move to first position
        newOrder = [moving, ...without];
      } else {
        const anchorIndex = without.findIndex(
          (s) => s.stopSequence === insertAfterStopSequence
        );
        if (anchorIndex === -1) {
          throw new AppError(
            'insertAfterStopSequence not found after excluding moved stop',
            400
          );
        }
        newOrder = [
          ...without.slice(0, anchorIndex + 1),
          moving,
          ...without.slice(anchorIndex + 1),
        ];
      }

      // ── Determine effective inProgress stop ───────────────────────
      const currentInProgressStop = allStops.find(
        (s) => s.status === DeliveryStopStatus.IN_PROGRESS
      );

      const effectiveInProgress =
        inProgressFromBody ??
        currentInProgressStop?.stopSequence ??
        1;

      if (effectiveInProgress < 1 || effectiveInProgress > newOrder.length) {
        throw new AppError('inProgressStopSequence is out of range', 400);
      }

      if (
        newOrder[effectiveInProgress - 1].status === DeliveryStopStatus.DELIVERED
      ) {
        throw new AppError(
          'Cannot set a delivered stop as in progress',
          400
        );
      }

      // ── Route origin + destination for start/end coordinates ──────
      const routeOriginLat = Number(route.orderStartLat);
      const routeOriginLng = Number(route.orderStartLong);
      const routeDestLat = Number(route.orderEndLat);
      const routeDestLng = Number(route.orderEndLong);

      const now = new Date();
      const targetStopId = newOrder[effectiveInProgress - 1].id;
      const oldInProgressIds = allStops
        .filter((s) => s.status === DeliveryStopStatus.IN_PROGRESS)
        .map((s) => s.id);

      // ── Update all stops ──────────────────────────────────────────
      for (let i = 0; i < newOrder.length; i++) {
        const seq = i + 1;
        const row = newOrder[i];
        const inst = allRows.find((r) => r.id === row.id)!;

        const isLast = seq === newOrder.length;
        const isMoved = row.id === stopId;
        const isTargetInProgress = row.id === targetStopId;

        // Next stop for endLat/endLng
        const nextStop = newOrder[i + 1] ?? null;

        const patch: any = {
          stopSequence: seq,
          isLastStop: isLast,

          // startLat/Lng: warehouse origin if first, else previous stop
          startLatitude: i === 0
            ? routeOriginLat
            : Number(newOrder[i - 1].latitude),
          startLongitude: i === 0
            ? routeOriginLng
            : Number(newOrder[i - 1].longitude),

          // endLat/Lng: warehouse destination if last, else next stop
          endLatitude: isLast
            ? routeDestLat
            : Number(nextStop?.latitude),
          endLongitude: isLast
            ? routeDestLng
            : Number(nextStop?.longitude),
        };

        // ── Rescheduled stop fields ──────────────────────────────
        if (isMoved) {
          patch.reSchedule = true;
          patch.reScheduleDate = moment(now).format('YYYY-MM-DD');
          patch.reScheduleTime = moment(now).format('HH:mm:ss');
          patch.reScheduleReason = reScheduleReason?.trim() || null;
          patch.reScheduleNotes = reScheduleNotes?.trim() || null;
          patch.reScheduleUpdatedAt = now;

          if (!inst.reScheduleCreatedAt) {
            patch.reScheduleCreatedAt = now;
          }

          if (notes !== undefined) {
            patch.notes = notes?.trim() || '';
          }

          // Reset delivery fields
          patch.status = DeliveryStopStatus.NOT_DELIVERED;
          patch.arrivedAt = null;
          patch.deliveredAt = null;
        }

        // ── Set in-progress on target stop ───────────────────────
        if (isTargetInProgress && !isMoved) {
          patch.status = DeliveryStopStatus.IN_PROGRESS;
          if (!inst.arrivedAt) patch.arrivedAt = now;
        }

        // ── Clear previously in-progress stops ───────────────────
        if (
          oldInProgressIds.includes(row.id) &&
          row.id !== targetStopId &&
          !isMoved
        ) {
          patch.status = DeliveryStopStatus.NOT_DELIVERED;
          patch.arrivedAt = null;
        }

        await inst.update(patch, { transaction });
      }

      // ── Update route completedStops count ────────────────────────
      const completedCount = await DeliveryRouteStop.count({
        where: {
          routeId: movingStop.routeId,
          isActive: true,
          status: DeliveryStopStatus.DELIVERED,
        },
        transaction,
      });

      await DeliveryRoute.update(
        { completedStops: completedCount },
        { where: { id: movingStop.routeId }, transaction }
      );

      // ── Return refreshed stops ────────────────────────────────────
      const refreshed = await DeliveryRouteStop.findAll({
        where: { routeId: movingStop.routeId, isActive: true },
        order: [['stopSequence', 'ASC']],
        transaction,
      });

      return {
        routeId: movingStop.routeId,
        inProgressStopSequence: effectiveInProgress,
        stops: refreshed.map((s) => s.get({ plain: true })),
      };
    });
  }


  async cancelStop(
    driverId: number,
    stopId: number,
    cancelledReason?: string | null
  ) {
    const stop = await DeliveryRouteStop.findOne({
      where: { id: stopId, isActive: true },
    });
    if (!stop) throw new AppError('Stop not found', 404);

    const route = await DeliveryRoute.findOne({
      where: { id: stop.routeId, driverId, isActive: true },
    });
    if (!route) throw new AppError('Route not found for this driver', 404);

    if (
      route.routeStatus === RouteStatus.COMPLETED ||
      route.routeStatus === RouteStatus.CANCELLED
    ) {
      throw new AppError(
        `Cannot cancel stop on a ${route.routeStatus} route`,
        400
      );
    }

    if (stop.status === DeliveryStopStatus.DELIVERED) {
      throw new AppError('Cannot cancel a delivered stop', 400);
    }

    await stop.update({
      status: DeliveryStopStatus.CANCELLED,
      cancelledReason: cancelledReason ?? null,
      cancelledAt: new Date(),
    });


    const updateNextStop = await DeliveryRouteStop.findOne({
      where: { routeId: stop.routeId, isActive: true, stopSequence: stop.stopSequence + 1 },
    });
    if (updateNextStop) {
      await updateNextStop.update({
        status: DeliveryStopStatus.IN_PROGRESS,
      });
    }
    return stop;
  }

  async getDriverPendingStop(routeId: number) {
    const pendingStops = await DeliveryRouteStop.findAll({
      where: { routeId, isActive: true, status: DeliveryStopStatus.NOT_DELIVERED },
      order: [['stopSequence', 'ASC']],
    });
    if (!pendingStops.length) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }

    const allCNumbers = [...new Set(pendingStops.map((s) => s.C_Number))];

    const customers = await Customer.findAll({
      where: { C_Number: { [Op.in]: allCNumbers } },
      attributes: ["C_Number", "C_Name", "C_Address", "C_State", "C_Zip", "C_City", "C_Phone", "C_PhoneMobile"],
      raw: true,
    });

    const customerMap = new Map(
      customers.map((c: any) => [c.C_Number, c])
    );

    return pendingStops.map((stop) => {
      const plain = stop.get({ plain: true });
      const c = customerMap.get(plain.C_Number);
      return {
        ...plain,
        C_Name: c?.C_Name ?? null,
        C_Address: c?.C_Address ?? null,
        C_State: c?.C_State ?? null,
        C_Zip: c?.C_Zip ?? null,
        C_City: c?.C_City ?? null,
        C_Phone: c?.C_Phone ?? null,
      };
    });
  }

  async allowToCompleteStop(body: any) {

    const { driverLat, driverLng, stopLat, stopLng } = body;
    const distanceInMeters = calculateDistanceInMeters(
      Number(driverLat), Number(driverLng),
      Number(stopLat), Number(stopLng)
    );

    const ALLOWED_RADIUS_METERS = 100;
    // if (distanceInMeters > ALLOWED_RADIUS_METERS) {
    //   throw new AppError(
    //     `You are ${Math.round(distanceInMeters)}m away from the stop. Must be within ${ALLOWED_RADIUS_METERS}m to complete delivery.`,
    //     400
    //   );

    // }
    return true;


  }

  async completeRoute(routeId: number) {

    const route = await DeliveryRoute.findOne({
      where: { id: routeId, isActive: true },
    });
    if (!route) throw new AppError('Route not found', 404);

    if (route.routeStatus === RouteStatus.COMPLETED || route.routeStatus === RouteStatus.CANCELLED) {
      throw new AppError('Route is already completed or cancelled', 400);
    }

    await DeliveryRoute.update({
      routeStatus: RouteStatus.COMPLETED,
    }, { where: { id: routeId } });

    return true;

  }

  async syncCachedDriverLocationsToDbOnShutdown() {
    const keys = await redisConnection.keys(getDriverLocationPattern());
    if (!keys.length) {
      return { syncedCount: 0 };
    }

    let syncedCount = 0;

    for (const key of keys) {
      try {
        const raw = await redisConnection.get(key);
        if (!raw) continue;

        const payload = JSON.parse(raw) as DriverLocationCachePayload;
        if (!payload?.driverId) continue;

        // ── Update DB with last known location ──────────────────
        const [updatedRows] = await Driver.update(
          {
            currentLatitude: payload.currentLatitude,
            currentLongitude: payload.currentLongitude,
          },
          { where: { id: payload.driverId, isActive: true } }
        );

        if (updatedRows > 0) {
          syncedCount++;
          console.log(`✅ Synced driver ${payload.driverId} → lat: ${payload.currentLatitude}, lng: ${payload.currentLongitude}`);
        }


      } catch (error: any) {
        console.error(
          `❌ Failed to sync driver ${key}:`,
          error?.message || error
        );

      }
    }

    return { syncedCount };
  }

  async uploadSignature(req: any) {
    const file = req.file;
    if (!file) {
      throw new AppError('File not found', 404);
    }
    const fileExtension = file.originalname?.includes(".")
      ? `.${file.originalname.split(".").pop()}`
      : "";
    const generatedFileName = `signature-${Date.now()}${fileExtension}`;
    const result = await uploadFileToAzure(file.buffer, generatedFileName, file.mimetype, 'driver-attachments');
    if (!result.success) {
      throw new AppError(result.error || 'Failed to upload image', 500);
    }
    return result;
  }

  async getDriverHistory(driverId: number) {
    const driver = await Driver.findOne({
      where: { id: driverId, isActive: true },
    });
    if (!driver) throw new AppError('Driver not found', 404);

    const routes = await DeliveryRoute.findAll({
      where: { driverId, isActive: true },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["id", "description", "vinNumber"],
        },
        {
          model: DeliveryRouteStop,
          as: "stops",
          where: { isActive: true },
          required: false,
          separate: true,
          order: [["stopSequence", "ASC"]],
        },
      ],
      order: [["id", "DESC"]],
    });

    const allStops = routes.flatMap(
      (r) =>
        (r.get("stops") as DeliveryRouteStop[] | undefined) ?? []
    );
    const cNumbers = [
      ...new Set(
        allStops.map((s) => s.C_Number).filter((n) => n != null)
      ),
    ] as number[];

    const retailerByCNumber = new Map<number, object>();
    const locationByCNumber = new Map<number, object>();

    if (cNumbers.length > 0) {
      const [retailers, locations] = await Promise.all([
        Retailer.findAll({
          where: { Customer_Number: { [Op.in]: cNumbers } },
        }),
        RetailerLocation.findAll({
          where: { C_Number: { [Op.in]: cNumbers } },
        }),
      ]);

      for (const row of retailers) {
        retailerByCNumber.set(row.Customer_Number, row.get({ plain: true }));
      }
      for (const row of locations) {
        if (!locationByCNumber.has(row.C_Number)) {
          locationByCNumber.set(row.C_Number, row.get({ plain: true }));
        }
      }
    }

    return routes.map((route) => {
      const stops =
        (route.get("stops") as DeliveryRouteStop[] | undefined) ?? [];
      const routePlain = route.get({ plain: true }) as unknown as Record<
        string,
        unknown
      >;

      const stopsWithCustomer = stops.map((stop) => {
        const plain = stop.get({ plain: true });
        const cn = plain.C_Number;
        return {
          ...plain,
          customer: {
            retailer: retailerByCNumber.get(cn) ?? null,
            location: locationByCNumber.get(cn) ?? null,
          },
        };
      });

      return {
        ...routePlain,
        stops: stopsWithCustomer,
        totalStops: stopsWithCustomer.length,
      };
    });
  }

  async getDriverHistoryByRouteId(routeId: number, driverId: number) {
    const route = await DeliveryRoute.findOne({
      where: { id: routeId, driverId, isActive: true },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["id", "description", "vinNumber"],
        },
        {
          model: DeliveryRouteStop,
          as: "stops",
          where: { isActive: true },
          required: false,
          separate: true,
          order: [["stopSequence", "ASC"]],
        },
        {
          model: DeliveryRoutePOD,
          as: "pods",
          where: { isActive: true },
          required: false,
          separate: true,
          order: [["id", "ASC"]],
        },
      ],
    });

    if (!route) {
      throw new AppError("Route not found", 404);
    }

    const pods = (route.get("pods") as DeliveryRoutePOD[] | undefined) ?? [];

    const cNumbers = [
      ...new Set(pods.map((p) => p.C_Number).filter((n) => n != null)),
    ] as number[];

    const customerByCNumber = new Map<number, ICustomerAttributes>();
    if (cNumbers.length > 0) {
      const customers = await Customer.findAll({
        where: { C_Number: { [Op.in]: cNumbers } },
        attributes: ["C_Number", "C_Name", "C_Address", "C_State", "C_Zip", "C_City", "C_Phone", "C_PhoneMobile"],
      });
      for (const c of customers) {
        customerByCNumber.set(
          c.C_Number,
          c.get({ plain: true }) as ICustomerAttributes
        );
      }
    }

    const podsWithCustomer = pods.map((pod) => {
      const plain = pod.get({ plain: true });
      return {
        ...plain,
        customer: customerByCNumber.get(plain.C_Number) ?? null,
      };
    });

    const podsByStopId = new Map<number, typeof podsWithCustomer>();
    for (const pod of podsWithCustomer) {
      const sid = pod.routeStopId;
      if (!podsByStopId.has(sid)) {
        podsByStopId.set(sid, []);
      }
      podsByStopId.get(sid)!.push(pod);
    }

    const routePlain = route.get({ plain: true }) as unknown as {
      stops?: Array<Record<string, unknown>>;
      pods?: unknown[];
    } & Record<string, unknown>;
    const { pods: _routePods, ...routeWithoutTopLevelPods } = routePlain;

    const stopsWithPods = (routePlain.stops ?? []).map((stop) => ({
      ...stop,
      pods: podsByStopId.get(stop.id as number) ?? [],
    }));

    return {
      route: {
        ...routeWithoutTopLevelPods,
        stops: stopsWithPods,
      },
    };
  }



  async updateTransferredStop(stopId: number, body: any) {
    const stop = await DeliveryRouteStop.findOne({
      where: { id: stopId, isActive: true },
    });
    if (!stop) throw new AppError('Stop not found', 404);

    // ── Validate not already transferred ─────────────────────────
    if (stop.isTransferred) {
      throw new AppError('Stop already transferred', 400);
    }

    await stop.update({
      // ── Save original customer info BEFORE overwriting ────────
      originalC_Number: stop.C_Number,    // ← old customer saved
      originalLatitude: stop.latitude,    // ← old lat saved
      originalLongitude: stop.longitude,   // ← old lng saved

      // ── Update to new customer ────────────────────────────────
      C_Number: body.C_Number,
      latitude: body.latitude,
      longitude: body.longitude,

      // ── Transfer metadata ─────────────────────────────────────
      isTransferred: true,
      transferredToC_Number: body.C_Number,
      transferredToLatitude: body.latitude,
      transferredToLongitude: body.longitude,
      transferredAt: new Date(),
      transferredReason: body.reason ?? null,
    });

    return stop;
  }

  async getCustomerRouteNumber(customerId: number) {
    const findCustomerRoute = await CustomerRoute.findOne({
      where: { C_Number: customerId }
    });
    if (!findCustomerRoute) throw new AppError('Customer route not found', 404);
    return findCustomerRoute.Route_Number;

  }


  async getDriverNearByCustomer(routeNumber: number) {
    const findCustomer = await CustomerRoute.findAll({
      where: { Route_Number: routeNumber },
    });
    if (!findCustomer?.length) throw new AppError('Customer route not found', 404);

    const customerList = await Customer.findAll({
      where: { C_Number: { [Op.in]: findCustomer.map((c) => c.C_Number) } },
      attributes: ['C_Number', 'C_Name', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_Phone'],
    });

    const customerLocation = await RetailerLocation.findAll({
      where: { C_Number: { [Op.in]: customerList.map((c) => c.C_Number) } },
      attributes: ['C_Number', 'lat', 'long'],
    });
    const customerLocationMap = new Map<number, { lat: number | null, long: number | null }>();
    for (const c of customerLocation) {
      customerLocationMap.set(c.C_Number, { lat: c.lat ?? 0, long: c.long ?? 0 });
    }
    const customerListWithLocation = customerList.map((c) => ({
      ...c.get({ plain: true }),
      location: customerLocationMap.get(c.C_Number) ?? null,
    }));
    return customerListWithLocation;

  }

  async setCustomerLocation(
    driverId: number,
    body: {
      customerId: number;
      lat: number;
      long: number;
      city?: string | null;
      state?: string | null;
      zip?: string | null;
      country?: string | null;
      address?: string | null;
    }
  ) {
    const cNumber = body.customerId;
    const existing = await RetailerLocation.findOne({
      where: { C_Number: cNumber },
    });

    const payload = {
      C_Number: cNumber,
      lat: body.lat,
      long: body.long,
      City: body.city?.trim() || null,
      State: body.state?.trim() || null,
      Zip: body.zip?.trim() || null,
      Country: body.country?.trim() || null,
      Address: body.address?.trim() || null,
      addedBy: "driver" as const,
      driverId,
    };

    if (existing) {
      await existing.update(payload);
      return existing.get({ plain: true });
    }

    const created = await RetailerLocation.create(payload);
    return created.get({ plain: true });
  }


  async getOrderDetails(orderNumber: number) {

    const order = await OrderDetail.findAll({
      where: { Order_Number: orderNumber },
      attributes: [
        "Order_Number",
        "Line_Number",
        "Item_Number",
        "Quantity_Ordered",
        "Quantity_Shipped",
        "Sales_Category",
        "OTP_Number",
        "Pack",
        "Price",
        "OTP_Amount_State",
        "PPD_PackType",
        "PPD_Packs",
        "Stamp_Qty",
        "CaseCount",
        "Price_Reference",
        "Retail",
        "NetCost",
        "BaseCost",
        "Invoice_Cost",
        "AvgCost",
        "OTP_Amount_City",
        "OTP_Amount_County",
        "Item_Message",
        "DepositAmount",
        "Price_Subclass",
        "EBT",
        "Points",
        "ItemDescription",
        "CaseWeight",
      ],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: [
            'Item_Number',
            'Description',
            'Pack',
            'CaseCount',
            'UOM',
            'BaseCost',
            'NetCost',
            'Section',
            'Location',
            'Section2',
            'Location2',
            'Sequence',
            'Vendor_ItemNumberAlpha',

          ],
          include: [
            {
              model: SalesCategory,
              as: 'SalesCategory',
              attributes: ['Sales_Category', 'Category_Desc'],
            },
            {
              model: PriceClass,
              as: 'PriceClass',
              attributes: ['Price_Class', 'Class_Desc'],
            },
            {
              model: InventoryUPC,
              as: 'UPCList',
              attributes: ['UPC_Number'],
              where: {
                Status: 0,
              },
              required: false,
            }
          ]
        }
      ]
    });
    return order;


  }

  async placeReturnOrder(orderData: PlaceOrder, req: any, customerId: any) {
    const totalPrice = orderData.orderPlayload.reduce((sum: any, item: any) => sum + Number(item.TotalPriceWithTax), 0);
    const isWebOrder = req.headers['is-web-order'];
    const isWeb = isWebOrder === 'true' ? true : false;

    const { orderPlayload } = orderData;

    let deliveryId = 0;


    // Get customer and route info

    let customer = await Customer.findOne({ where: { C_Number: customerId } });


    customer = customer?.dataValues as any;
    const customerRoutes = await CustomerRoute.findOne({ where: { C_Number: customerId } });



    if (!customer) {
      throw new AppError("Customer not found", 404);
    }
    const orderNumber = await getNextOrderNumber();
    let Order_Type = 6;



    // Prepare dynamic header data
    const orderHeaderObject = {
      Order_Number: orderNumber,

      C_Number: customerId,
      S_Number: customer.C_Salesman || 0,
      Order_Source: isWeb ? 13 : 12,
      AR_C_Number: customer.C_StatementAccount || customerId,
      Jurisdiction_State: customer.Jurisdiction_State || '',
      Jurisdiction_County: customer.Jurisdiction_County || '',
      Jurisdiction_City: customer.Jurisdiction_City || '',
      Route_Number: customerRoutes?.Route_Number || 0,
      Stop_Number: customerRoutes?.Stop_Number || 0,
      Delivery_ID: deliveryId,
      User_ID: 0,
      Reference: `DRI-${customer.C_Number}`,
      Invoice_Type: customer.C_InvoiceFormat || 0,
      Invoice_Deposit: 0,
      Delivery_Charge: 0,
      Other_Charge: 0,
      Invoice_Total: 0,
      Sales_Taxable: 0,
      Sales_NonTaxable: 0,
      Cig20: 0,
      Cig10tax: 0,
      Cig20tax: 0,
      Cig25tax: 0,
      POS_ChangeDue: 0,
      Order_Pricing_Account: customer.C_PricingAccount || customerId,
      Order_Type: Order_Type || 0,
      Points: 0,
      Total_Weight: 0,
      Delivery_Charge_Select: !!customer.Delivery_Charge,
      Other_Charge_Select: !!customer.Other_Amount,
      deliverd: true,
    };



    // Combine with defaults (exclude Order_Number since it's auto-increment)
    const { Order_Number, ...defaultValues } = getDefaultOrderValues();
    const finalOrderHeader: any = {
      ...defaultValues,
      ...orderHeaderObject,
    };



    // Ensure no null values in required fields
    Object.keys(finalOrderHeader).forEach(key => {
      if (finalOrderHeader[key] === null || finalOrderHeader[key] === undefined) {
        if (typeof finalOrderHeader[key] === 'number') {
          finalOrderHeader[key] = 0;
        } else if (typeof finalOrderHeader[key] === 'boolean') {
          finalOrderHeader[key] = false;
        } else if (typeof finalOrderHeader[key] === 'string') {
          finalOrderHeader[key] = '';
        }
      }
    });





    let orderHeaderCreated: any;
    try {
      orderHeaderCreated = await OrderHeader.create(finalOrderHeader) as any;
    } catch (error) {
      console.log(error, 'error--> in create order header')
      throw new AppError('Failed to create order header', 500);
    }

    // Fetch products and options
    const itemNumbers = orderPlayload.map(item => item.Item_Number);
    const [products] = await Promise.all([
      Inventory.findAll({ where: { Item_Number: itemNumbers }, raw: true }),
    ]);



    const productMap = new Map(products.map(product => [product.Item_Number, product]));

    const orderDetails = orderPlayload.map(async (item: any, index) => {
      const product = productMap.get(item.Item_Number);

      if (!product) {
        throw new AppError(`Product with Item_Number ${item.Item_Number} not found`, 404);
      }

      // if (item.Qty <= 0) {
      //   throw new AppError(`Invalid quantity for item ${item.Item_Number}`, 400);
      // }


      let optionDefsValues: any = await OptionDefsValues.findOne({ where: { ID_Number: 4003, Option_Value: product.Sales_Category }, raw: true })

      if (!optionDefsValues) {
        optionDefsValues = await OptionDefsValues.findOne({ where: { ID_Number: 4003, Option_Value: product.OTP_Number }, raw: true })
      }

      console.log(optionDefsValues, 'optionDefsValues-->')
      if (!optionDefsValues) {
        optionDefsValues = 0
      } else {
        optionDefsValues = Number(item.Qty)
      }

      let PPD_PackType = 0
      let PPD_Packs = 0

      if (product.OTP_Number == 255) {
        if (product.Cig_Pack == 20) {
          PPD_PackType = 20
          PPD_Packs = 10
        }
        else if (product.Cig_Pack == 10) {
          PPD_PackType = 10
          PPD_Packs = 20
        }

      }

      let adjprice = Number(item.Price);
      const orderDetail = {
        PrepaidTax_Amount: item.prepaidTaxRate ? Number(item.prepaidTaxRate) : 0,
        Order_Number: orderHeaderCreated.Order_Number,
        Item_Number: item.Item_Number,
        Line_Number: index + 1,
        Sales_Category: product.Sales_Category,
        OTP_Number: product.OTP_Number,
        Quantity_Ordered: Number(item.Qty),
        Quantity_Shipped: item.Qty,
        Pack: product.Pack,
        UOM: product.UOM,
        Price: Number(adjprice),
        Price_Reference: Number(adjprice),
        Retail: product.Retail1,
        NetCost: product.NetCost,
        BaseCost: product.BaseCost,
        Invoice_Cost: product.Invoice_Cost,
        AvgCost: product.AvgCost,
        OTP_Amount_State: Number(item.Tax_Rate ?? 0),

        OTP_Amount_County: 0,
        OTP_Amount_City: 0,
        Item_Message: product.Item_Message ? product.Item_Message : ' ',

        DepositAmount: product.DepositAmount,
        Price_Subclass: product.Price_Subclass,
        OffInvoice_Amount: 0,
        OffInvoice_OffCost: 0,
        OffInvoice_Special: false,
        EBT: product.EBT,
        Points: product.Points,
        Stamp_Qty: optionDefsValues || 0,
        ItemDescription: product.Description,
        CaseWeight: product.CaseWeight,
        CaseCount: product.CaseCount,
        PPD_PackType: PPD_PackType,
        PPD_Packs: PPD_Packs,
        // CasesPerPallet: product.CasesPerPallet,
      };

      return {
        ...getDefaultOrderDetailValues(),
        ...orderDetail
      };
    });


    let resolvedOrderDetails: any[] = [];
    try {
      resolvedOrderDetails = await Promise.all(orderDetails);

      await OrderDetail.bulkCreate(resolvedOrderDetails);

      try {
        sendEmailToOrder(orderHeaderCreated, resolvedOrderDetails, customer, 0);
      } catch (error) {
        console.log(error, 'error-->')
      }

      console.log('Order details created successfully');
    } catch (error) {
      console.log(error, 'error-->')
      throw new AppError('Failed to create order details', 500);
    }

    return {
      orderHeader: orderHeaderCreated,
      orderDetails: resolvedOrderDetails,
      message: "Order placed successfully"
    };
  }


  async updateReturnOrder(
    orderUpdateData: Array<{ Order_Number: number; Item_Number: number; Quantity_Shipped: number }>
  ) {
    if (!Array.isArray(orderUpdateData) || orderUpdateData.length === 0) {
      throw new AppError("orderUpdateData must be a non-empty array", 400);
    }

    return mssqlSequelize.transaction(async (t) => {
      const updates: Array<{
        Order_Number: number;
        Item_Number: number;
        rowsAffected: number;
      }> = [];

      for (const row of orderUpdateData) {
        const orderNum = Number(row.Order_Number);
        const qtyShipped = Number(row.Quantity_Shipped);
        const Item_Number = Number(row.Item_Number);
        if (
          !Number.isFinite(orderNum) ||
          orderNum <= 0 ||
          !Number.isFinite(Item_Number) ||
          Item_Number <= 0 ||
          !Number.isFinite(qtyShipped) ||
          qtyShipped < 0
        ) {
          throw new AppError(
            "Each item must have valid Order_Number, Item_Number, and Quantity_Shipped",
            400
          );
        }

        const [rowsAffected] = await OrderDetail.update(
          { Quantity_Shipped: qtyShipped },
          {
            where: { Order_Number: orderNum, Item_Number },
            transaction: t,
          }
        );

        updates.push({
          Order_Number: orderNum,
          Item_Number,
          rowsAffected,
        });
      }

      return { updates };
    });
  }


}
