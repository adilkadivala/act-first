export interface RideLocation {
  name: string;
  latitude: number;
  longitude: number;
}

const knownLocations: Record<string, RideLocation> = {
  "Home - Koramangala 6th Block": {
    name: "Home - Koramangala 6th Block",
    latitude: 12.9352,
    longitude: 77.6245
  },
  "ActFirst HQ - HSR Layout": {
    name: "ActFirst HQ - HSR Layout",
    latitude: 12.9116,
    longitude: 77.6474
  },
  "Pulse Fit Gym - Indiranagar": {
    name: "Pulse Fit Gym - Indiranagar",
    latitude: 12.9784,
    longitude: 77.6408
  }
};

export function getKnownLocation(name: string) {
  return knownLocations[name];
}
