import axios from "axios";



interface Order {
  orderNumber: number;
  C_Number: number;
  lat: number;
  lng: number;
}
type LatLng = { lat: number; lng: number };

export async function getOptimizedDirections(
    origin: LatLng,
    destination: LatLng,
    stops: LatLng[]
  ) {
    if (!process.env.GOOGLE_MAP_API_KEY) {
      throw new Error("GOOGLE_MAP_API_KEY missing in env");
    }
  
    const url = "https://maps.googleapis.com/maps/api/directions/json";
  
    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;
  
    const waypoints = "optimize:true|" + stops.map(s => `${s.lat},${s.lng}`).join("|");
  
    const { data }: any = await axios.get(url, {
      params: {
        origin: originStr,
        destination: destinationStr,
        waypoints,
        key: process.env.GOOGLE_MAP_API_KEY,
      },
      timeout: 20000,
    });
  
    if (data.status !== "OK" || !data.routes?.length) {
      throw new Error(
        `Directions API failed: ${data.status} ${data.error_message || ""}`.trim()
      );
    }
  
    const route0 = data.routes[0];
  
    const legs = route0.legs as any[];
  
    // Sum meters across legs
    const totalMeters = legs.reduce((sum, leg) => {
      const meters = Number(leg?.distance?.value ?? 0); // distance.value is meters
      return sum + meters;
    }, 0);
  
    const totalKilometers = Number((totalMeters / 1000).toFixed(2));

    
  
    return {
      waypointOrder: route0.waypoint_order as number[],
      polyline: route0.overview_polyline?.points as string,
      legs,
      totalMeters,
      totalKilometers,
    };
  }
  



// utils/map.utils.ts

interface Order {
  orderNumber: number;
  C_Number: number;
  lat: number;
  lng: number;
}

// ── Simple K-Means (no library needed) ──────────────────────

function getDistance(a: Order, b: { lat: number; lng: number }): number {
  return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2));
}

function getCentroid(orders: Order[]): { lat: number; lng: number } {
  const lat = orders.reduce((sum, o) => sum + o.lat, 0) / orders.length;
  const lng = orders.reduce((sum, o) => sum + o.lng, 0) / orders.length;
  return { lat, lng };
}

export function clusterOrdersByLocation(
  orders: Order[],
  numberOfDrivers: number
): Order[][] {
  
  // Step 1: Pick initial centroids (spread evenly)
  const step = Math.floor(orders.length / numberOfDrivers);
  let centroids = Array.from(
    { length: numberOfDrivers },
    (_, i) => ({ lat: orders[i * step].lat, lng: orders[i * step].lng })
  );

  let clusters: Order[][] = [];

  // Step 2: Iterate until stable
  for (let iteration = 0; iteration < 100; iteration++) {
    
    // Assign each order to nearest centroid
    clusters = Array.from({ length: numberOfDrivers }, () => []);

    for (const order of orders) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      centroids.forEach((centroid, i) => {
        const dist = getDistance(order, centroid);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      });

      clusters[nearestIndex].push(order);
    }

    // Recalculate centroids
    const newCentroids = clusters.map(cluster =>
      cluster.length ? getCentroid(cluster) : centroids[clusters.indexOf(cluster)]
    );

    // Check if stable (centroids didn't move)
    const stable = newCentroids.every(
      (c, i) => c.lat === centroids[i].lat && c.lng === centroids[i].lng
    );

    centroids = newCentroids;
    if (stable) break;
  }

  // Step 3: Balance clusters (avoid empty clusters)
  clusters = balanceClusters(clusters, numberOfDrivers);

  return clusters;
}

// ── Balance: if one cluster is empty, move orders from largest ─
function balanceClusters(clusters: Order[][], k: number): Order[][] {
  for (let i = 0; i < k; i++) {
    if (clusters[i].length === 0) {
      // Find largest cluster
      const largestIndex = clusters.reduce(
        (maxIdx, c, idx) => (c.length > clusters[maxIdx].length ? idx : maxIdx),
        0
      );
      // Move one order to empty cluster
      clusters[i].push(clusters[largestIndex].pop()!);
    }
  }
  return clusters;
}