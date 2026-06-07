// Location search provider abstraction.
// Default implementation uses OpenStreetMap Nominatim (free, no API key).
// To swap providers later, implement the same `LocationProvider` interface
// and export it from this file.

export interface LocationResult {
  id: string;
  locationName: string;
  district?: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

export interface LocationProvider {
  search(query: string, signal?: AbortSignal): Promise<LocationResult[]>;
}

interface NominatimAddress {
  village?: string;
  hamlet?: string;
  town?: string;
  city?: string;
  municipality?: string;
  suburb?: string;
  county?: string;
  state_district?: string;
  district?: string;
  state?: string;
  country?: string;
}

interface NominatimItem {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

export const nominatimProvider: LocationProvider = {
  async search(query, signal) {
    const q = query.trim();
    if (q.length < 2) return [];
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "8");
    url.searchParams.set("accept-language", "en");

    const res = await fetch(url.toString(), {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Location search failed (${res.status})`);
    const items = (await res.json()) as NominatimItem[];

    return items.map((it) => {
      const a = it.address ?? {};
      const locationName =
        a.village || a.hamlet || a.town || a.city || a.municipality || a.suburb ||
        it.display_name.split(",")[0].trim();
      const district = a.district || a.state_district || a.county || undefined;
      return {
        id: String(it.place_id),
        locationName,
        district,
        state: a.state,
        country: a.country,
        latitude: parseFloat(it.lat),
        longitude: parseFloat(it.lon),
        displayName: it.display_name,
      };
    });
  },
};

export const defaultLocationProvider: LocationProvider = nominatimProvider;
