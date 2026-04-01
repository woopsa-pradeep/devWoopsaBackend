


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
import { clusterOrdersByLocation, getDirectionsInOrder, getOptimizedDirections } from "../utils/map.utlis";
import DeliveryRouteGroup from "../models/postgres/driverRoutesGroup.model";
import { postgresSequelize } from "../db";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { uploadFileToAzure } from "../utils/azureUploader";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { Distributor } from "../models/mmsql/distributor.model";
import { ARDefinitions } from "../models/mmsql/arDefinitions.model";

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

      return {
        ...plain,
        totalStops,
        stopCountByStatus,
        completionPercentage,
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
      where: { day, driverId: driverIds, isActive: true },
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
      where: { day, truckId: truckIds, isActive: true },
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
        // Directions API — no optimize:true — keeps FE stop order
        const directions = await getDirectionsInOrder(
          origin,
          destination,
          preview.stops.map((s: any) => ({ lat: s.latitude, lng: s.longitude }))
        );

        polyline = directions.polyline;
        totalKilometers = directions.totalKilometers;
        totalMiles = directions.totalMiles;
        totalDurationInMinutes = directions.totalDurationInMinutes;

        // Enrich each stop with real distanceKm + etaMinutes
        enrichedStops = preview.stops.map((stop: any, index: number) => {
          const leg = directions.legs[index];

          const legKm = Number(
            ((leg?.distanceMeters ?? 0) / 1000).toFixed(3)
          );

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

      // ── Create Route Group ────────────────────────────────────
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

        // ── Create DeliveryRoute (polyline stored) ────────────
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
            polyline: preview.polyline,    // ← stored
            hasChildren: false,
            parentRouteId: 0,
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

        console.log(orderNumbersToUpdate, 'orderNumbersToUpdate');
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

    if (stop.isLastStop) {
      let completedStops = await DeliveryRoute.findOne({
        where: { id: stop.routeId, isActive: true },
      });
      if (!completedStops) {
        throw new AppError(Manager.RECORD_NOT_FOUND, 404);
      }
      await DeliveryRoute.update({
        routeStatus: RouteStatus.COMPLETED,
      }, { where: { id: stop.routeId } });

    }

    const nextStop = await DeliveryRouteStop.findOne({
      where: {
        routeId: stop.routeId,
        stopSequence: stop.stopSequence + 1,
        isActive: true,
      },
    });

    await DeliveryRouteStop.update({
      status: DeliveryStopStatus.IN_PROGRESS,
    }, { where: { id: nextStop?.id } });


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
          ...stop,
          C_Name: customer?.C_Name || null,
          C_Address: customer?.C_Address || null,
          C_State: customer?.C_State || null,
          C_Zip: customer?.C_Zip || null,
          C_City: customer?.C_City || null,
          C_Phone: customer?.C_Phone || null,
          C_PhoneMobile: customer?.C_PhoneMobile || null
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

}
