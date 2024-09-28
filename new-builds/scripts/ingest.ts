import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { along, featureCollection, length, lineString } from "@turf/turf";
import axios from "axios";
import { Feature, FeatureCollection, LineString, Point } from "geojson";

dotenv.config();

const key = process.env.GOOGLE_API_KEY || "";
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const storageBucket = process.env.STORAGE_BUCKET || "";

async function downloadStreetViewImageToSupabase(options: {
  longitude: number;
  latitude: number;
  size?: string;
  fov?: number;
  heading?: number;
  pitch?: number;
  key: string;
  signature?: string;
  supabaseUrl: string;
  supabaseKey: string;
  storageBucket: string;
}): Promise<void> {
  const {
    longitude,
    latitude,
    size = "2000x300",
    fov = 90,
    heading = 170,
    pitch = 0,
    key,
    signature,
    supabaseUrl,
    supabaseKey,
    storageBucket,
  } = options;

  const location = `${latitude},${longitude}`;

  const baseUrl = "https://maps.googleapis.com/maps/api/streetview";

  let url = `${baseUrl}?size=${size}&location=${encodeURIComponent(
    location
  )}&fov=${fov}&heading=${heading}&pitch=${pitch}&key=${key}`;

  if (signature) {
    url += `&signature=${signature}`;
  }

  try {
    const response = await axios({
      method: "get",
      url: url,
      responseType: "arraybuffer",
    });

    const contentType = response.headers["content-type"];
    if (contentType !== "image/jpeg") {
      console.error(`No Street View imagery for ${latitude}, ${longitude}`);
      return;
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upload image to Supabase Storage
    const fileName = `streetview_${latitude}_${longitude}_${heading}.jpg`;
    const { error: storageError } = await supabase.storage
      .from(storageBucket)
      .upload(fileName, response.data, {
        contentType: "image/jpeg",
      });

    if (storageError) {
      console.error("Storage Error:", storageError);
      throw storageError;
    }

    // Get public URL of the image
    const { data: publicUrlData } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(fileName);

    // Insert record into the database
    const { error: dbError } = await supabase
      .from("street_view_images")
      .insert([
        {
          longitude,
          latitude,
          heading,
          pitch,
          fov,
          image_url: publicUrlData.publicUrl,
        },
      ]);

    if (dbError) {
      console.error("Database Error:", dbError);
      throw dbError;
    }

    console.log(
      "Image successfully stored and record inserted into the database."
    );
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function downloadStreetViewImageToSupabaseFourDirections({
  longitude,
  latitude,
  key,
  supabaseUrl,
  supabaseKey,
  storageBucket,
}: {
  longitude: number;
  latitude: number;
  key: string;
  supabaseUrl: string;
  supabaseKey: string;
  storageBucket: string;
}) {
  const directions = [
    { heading: 0, pitch: 0 },
    { heading: 90, pitch: 0 },
    { heading: 180, pitch: 0 },
    { heading: 270, pitch: 0 },
  ];

  for (const { heading, pitch } of directions) {
    try {
      // Check if this coordinate and heading combination has been processed
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: existingRecords, error } = await supabase
        .from("street_view_images")
        .select("image_id")
        .eq("latitude", latitude)
        .eq("longitude", longitude)
        .eq("heading", heading);

      if (error) {
        console.error("Error checking database:", error);
        throw error;
      }

      if (existingRecords && existingRecords.length > 0) {
        console.log(
          `Skipping already processed coordinate: ${latitude}, ${longitude} at heading ${heading}`
        );
        continue;
      }

      await downloadStreetViewImageToSupabase({
        longitude,
        latitude,
        heading,
        pitch,
        key,
        supabaseUrl,
        supabaseKey,
        storageBucket,
      });
    } catch (error) {
      console.error(`Error processing ${latitude}, ${longitude}:`, error);
    }
  }
}

// Define the bounding box for downtown Toronto
const minLat = 43.6415;
const maxLat = 43.6677;
const minLon = -79.395;
const maxLon = -79.3676;

const overpassUrl = "https://overpass-api.de/api/interpreter";

const query = `
[out:json];
(
  way
    ["highway"]
    (${minLat},${minLon},${maxLat},${maxLon});
);
out geom;
`;

async function fetchStreetData() {
  try {
    const response = await axios.post(overpassUrl, query, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data.elements;
  } catch (error) {
    console.error("Error fetching OSM data:", error);
    throw error;
  }
}

function processOSMData(elements: any[]): FeatureCollection<LineString> {
  const lineStrings: Feature<LineString>[] = [];

  for (const element of elements) {
    if (element.type === "way" && element.geometry) {
      const coordinates = element.geometry.map((point: any) => [
        point.lon,
        point.lat,
      ]);
      const line = lineString(coordinates);
      lineStrings.push(line);
    }
  }

  return featureCollection(lineStrings);
}

function samplePointsAlongLines(
  lineCollection: FeatureCollection<LineString>,
  spacing: number
): FeatureCollection<Point> {
  const sampledPoints: Feature<Point>[] = [];

  for (const line of lineCollection.features) {
    const lineLength = length(line, { units: "kilometers" }) * 1000; // Convert to meters
    const numSamples = Math.floor(lineLength / spacing);
    for (let i = 0; i <= numSamples; i++) {
      const distance = (spacing * i) / 1000; // Convert meters to kilometers
      const point = along(line, distance, { units: "kilometers" });
      sampledPoints.push(point);
    }
  }

  // Remove duplicates based on coordinates
  const uniquePoints = featureCollection(
    sampledPoints.filter(
      (point, index, self) =>
        index ===
        self.findIndex(
          (p) =>
            p.geometry.coordinates[0] === point.geometry.coordinates[0] &&
            p.geometry.coordinates[1] === point.geometry.coordinates[1]
        )
    )
  );

  return uniquePoints;
}

function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length;
  let temporaryValue: T;
  let randomIndex: number;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

async function processCoordinates() {
  const elements = await fetchStreetData();
  const lineCollection = processOSMData(elements);
  const spacing = 50; // meters
  const pointCollection = samplePointsAlongLines(lineCollection, spacing);

  // Convert FeatureCollection to an array of coordinates
  const coordinates = pointCollection.features.map((feature) => {
    const [longitude, latitude] = feature.geometry.coordinates;
    return { latitude, longitude };
  });

  // Shuffle the coordinates array
  const shuffledCoordinates = shuffleArray(coordinates);

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Process each coordinate
  for (const coord of shuffledCoordinates) {
    try {
      await downloadStreetViewImageToSupabaseFourDirections({
        latitude: coord.latitude,
        longitude: coord.longitude,
        key,
        supabaseUrl,
        supabaseKey,
        storageBucket,
      });
      console.log(
        `Successfully processed ${coord.latitude}, ${coord.longitude}`
      );
    } catch (error) {
      console.error(
        `Error processing ${coord.latitude}, ${coord.longitude}:`,
        error
      );
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
  }
}

processCoordinates();
