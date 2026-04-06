


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
import { postgresSequelize } from "../db";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { uploadFileToAzure } from "../utils/azureUploader";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { Distributor } from "../models/mmsql/distributor.model";
import { ARDefinitions } from "../models/mmsql/arDefinitions.model";
import { DriverExpense } from "../models/postgres/driverExpense.model";

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



export class DriverService {

  async getDriverOrderList() {
    return [];
  }

  async updateDriverLatLong(driverId: number, body: any) {
    const { currentLocation, currentLatitude, currentLongitude } = body;

    if (
      currentLocation === undefined ||
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
      currentLocation,
      currentLatitude,
      currentLongitude,
    });

    return {
      driverId: driver.id,
      currentLocation: driver.currentLocation,
      currentLatitude: driver.currentLatitude,
      currentLongitude: driver.currentLongitude,
    };
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
        (s) => s.status === DeliveryStopStatus.IN_PROGRESS
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
          if (box.barcode) {
            boxBarCode.push(box.barcode);
          }
        }

        pod = await DeliveryRoutePOD.create({
          routeId,
          routeStopId: firstInProgressStop.id,
          driverId,
          orderNumber: firstInProgressStop.orderNumber,
          C_Number: firstInProgressStop.C_Number,
          boxBarCode,
          paymentTermComplete: false,
          postDeliveryCompleted: false,
          scanBarCode,
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
            boxBarCode.push(box.barcode);
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

  async getDriverCurrentOrder(driverId: number) {
    console.log(driverId, 'driverId')
    const currentRoute = await DeliveryRoute.findOne({
      where: {
        driverId,
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
            endLatitude: stop.endLatitude,
            endLongitude: stop.endLongitude,
            startLatitude: stop.startLatitude,
            startLongitude: stop.startLongitude,
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

    const driver = await Driver.findOne({
      where: { id: driverId, isActive: true },
    });
    if (!driver) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }
    await driver.update(body);
    return driver;
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

    if (stop.isLastStop) {
      await DeliveryRoute.update({
        routeStatus: RouteStatus.COMPLETED,
      }, { where: { id: stop.routeId } });


    }

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
    if (distanceInMeters > ALLOWED_RADIUS_METERS) {
      // throw new AppError(
      //   `You are ${Math.round(distanceInMeters)}m away from the stop. Must be within ${ALLOWED_RADIUS_METERS}m to complete delivery.`,
      //   400
      // );
      return true;
    }
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





}
