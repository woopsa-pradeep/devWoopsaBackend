import axios from "axios";

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
  