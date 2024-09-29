"use client";

import Map from "@/components/Map";
import SearchBar from "@/components/SearchBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import torontoLogo from "./icons/toronto_logo.png";

export interface MarkerDetails {
  image_id: string;
  longitude: number;
  latitude: number;
  heading: number;
  pitch: number;
  captured_at: string;
  fov: number;
  image_url: string;
  description: string | null;
}

export interface SearchResults {
  results: MarkerDetails[];
  heatmap_data: [number, number, number][];
}

export default function Home() {
  const [markers, setMarkers] = useState<MarkerDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<[number, number, number][]>(
    []
  );
  const [showMarkers, setShowMarkers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const handleToggle = (type: "markers" | "heatmap") => {
    if (type === "markers") {
      setShowMarkers(!showMarkers);
    } else if (type === "heatmap") {
      setShowHeatmap(!showHeatmap);
    }
  };
  const handleSearch = async (query: string) => {
    console.log("Search query:", query);

    if (!query) {
      setMarkers([]);
      setHeatmapData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://new-builds-2024-818004117691.us-central1.run.app/search?q=${encodeURIComponent(
          query
        )}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const results = await response.json();

      setMarkers(results.results.slice(0, 5));
      setHeatmapData(results.heatmap_data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching markers:", error);
      setError("Failed to fetch markers. Please try again.");
      setMarkers([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white shadow-lg z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex flex-row items-center">
            <Image
              src={torontoLogo}
              alt="Toronto Logo"
              width={40} // Adjust width as needed
              height={40} // Adjust height as needed
              className="mr-2" // Margin to separate the logo from the text
            />
            <h1 className="text-3xl font-bold text-black">Unsearchable TO</h1>
          </div>

          <div className="text-xl font-bold italic text-[#2d3748]">
            511k+ views indexed
          </div>
        </div>
      </header>
      <div className="relative flex-grow overflow-hidden">
        <div className="absolute inset-0 h-full">
          <Map
            markers={markers}
            heatmapData={heatmapData}
            showHeatmap={showHeatmap}
            showMarkers={showMarkers}
          />
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center z-10">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#4fd1c5]"></div>
          </div>
        )}

        {/* Overlay content */}
        <div className="pb-4 absolute top-10 left-10">
          <div className="flex space-x-4">
            <div
              onClick={() => handleToggle("markers")}
              className={`${
                showMarkers
                  ? "bg-[#4fd1c5] text-black border-transparent shadow-lg" // Selected state
                  : "bg-white text-black border-gray-300 hover:bg-gray-100" // Unselected state
              } px-6 py-3 text-sm font-semibold rounded-lg border transition-all duration-200 cursor-pointer`}
            >
              Markers
            </div>
            <div
              onClick={() => handleToggle("heatmap")}
              className={`${
                showHeatmap
                  ? "bg-[#4fd1c5] text-black border-transparent shadow-lg" // Selected state
                  : "bg-white text-black border-gray-300 hover:bg-gray-100" // Unselected state
              } px-6 py-3 text-sm font-semibold rounded-lg border transition-all duration-200 cursor-pointer`}
            >
              Heatmap
            </div>
          </div>
        </div>
        <main className="absolute top-10 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
          <div className="space-y-8 flex flex-col items-center">
            <SearchBar onSearch={handleSearch} />

            {error && (
              <Alert
                variant="destructive"
                className="bg-red-900/50 border-red-700 w-full"
              >
                <AlertCircle className="h-5 w-5 text-red-400" />
                <AlertTitle className="text-red-400 font-semibold">
                  Error
                </AlertTitle>
                <AlertDescription className="text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* <div className='flex flex-row justify-between w-full'>
              <CameraUpload />
            </div> */}
          </div>
        </main>
      </div>
    </div>
  );
}
