'use client';

import { useEffect, useState } from 'react';
import { Place } from '../types';
import { MapPin, Navigation, ExternalLink, AlertCircle, Compass } from 'lucide-react';

interface MapViewProps {
  places?: Place[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  onPinSelected?: (lat: number, lng: number, addressDetails?: { address?: string; locality?: string }) => void;
  interactivePinDrop?: boolean;
  showLocationStatus?: boolean;
}

export default function MapView({
  places = [],
  centerLat = 12.9716,
  centerLng = 77.5946,
  zoom = 13,
  onPinSelected,
  interactivePinDrop = false,
  showLocationStatus = false,
}: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [geoAccuracy, setGeoAccuracy] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: centerLat,
    lng: centerLng,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSelectedCoords({ lat: centerLat, lng: centerLng });
  }, [centerLat, centerLng]);

  // Reverse Geocoding via Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const googleResponse = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      if (googleResponse.ok) return await googleResponse.json();
    } catch (err) {
      // Fallback below
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      if (!res.ok) return undefined;
      const data = await res.json();
      if (data && data.address) {
        const locality = data.address.suburb || data.address.neighbourhood || data.address.city_district || data.address.city || 'Bengaluru';
        const road = data.address.road || data.address.pedestrian || '';
        const address = road ? `${road}, ${locality}` : data.display_name;
        return { address, locality };
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
    }
    return undefined;
  };

  // Browser Geolocation Acquisition with Two-Tier Fallback
  const handleAcquireLocation = async () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation API is not supported by your browser. Please drop the pin on the map manually.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    // Check permission state first (Chrome/Edge/Firefox)
    if (navigator.permissions) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (perm.state === 'denied') {
          setIsLocating(false);
          setGeoError(
            'Location access is blocked. Please click the 🔒 lock/info icon in your browser address bar → Site settings → Allow Location, then press the GPS button again.'
          );
          return;
        }
      } catch (_) {
        // permission API not supported, proceed anyway
      }
    }

    const onSuccess = async (pos: GeolocationPosition) => {
      const lat = Number(pos.coords.latitude.toFixed(5));
      const lng = Number(pos.coords.longitude.toFixed(5));
      const accuracy = Math.round(pos.coords.accuracy);

      setSelectedCoords({ lat, lng });
      setGeoAccuracy(accuracy);
      setIsLocating(false);

      const geoDetails = await reverseGeocode(lat, lng);
      if (onPinSelected) {
        onPinSelected(lat, lng, geoDetails);
      }
    };

    const onErrorFallback = (err2: GeolocationPositionError) => {
      setIsLocating(false);
      if (err2.code === 1) {
        setGeoError(
          'Location access denied. Click the 🔒 lock icon in your browser address bar → Allow Location, then try again. Or drop the pin on the map manually.'
        );
      } else if (err2.code === 2) {
        setGeoError('Location unavailable. Your device GPS may be off. Drop the pin on the map manually.');
      } else {
        setGeoError('GPS timed out. Try again or drop the pin on the map manually.');
      }
    };

    // Tier 1: High-accuracy GPS (up to 10 seconds)
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        if (err.code === 1) {
          onErrorFallback(err);
        } else {
          // Tier 2: Network/IP fallback (less precise, longer timeout)
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            onErrorFallback,
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (!isMounted) {
    return (
      <div className="w-full h-80 bg-orange-50/50 border border-orange-200/60 rounded-3xl flex items-center justify-center text-slate-400 text-xs font-medium">
        Loading Interactive Street Food Map...
      </div>
    );
  }

  // Dynamic Leaflet import for SSR safety
  const { MapContainer, TileLayer, Marker, Popup, useMapEvents } = require('react-leaflet');
  const L = require('leaflet');

  const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  function MapEventsHandler() {
    useMapEvents({
      async click(e: any) {
        if (interactivePinDrop && onPinSelected) {
          const lat = Number(e.latlng.lat.toFixed(5));
          const lng = Number(e.latlng.lng.toFixed(5));
          setSelectedCoords({ lat, lng });

          const geoDetails = await reverseGeocode(lat, lng);
          onPinSelected(lat, lng, geoDetails);
        }
      },
    });
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Geolocation Controls Bar */}
      {showLocationStatus && (
        <div className="bg-white border border-orange-200/80 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAcquireLocation}
              disabled={isLocating}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Acquiring GPS...' : 'Use Precise GPS Location'}</span>
            </button>

            {geoAccuracy !== null && (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                Accuracy: ±{geoAccuracy}m
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Lat: <span className="text-orange-700 font-bold">{selectedCoords.lat}</span>, Lng:{' '}
            <span className="text-orange-700 font-bold">{selectedCoords.lng}</span>
          </div>
        </div>
      )}

      {geoError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="w-full h-80 rounded-3xl overflow-hidden border border-orange-200/70 shadow-md relative">
        <MapContainer
          center={[selectedCoords.lat, selectedCoords.lng]}
          zoom={zoom}
          scrollWheelZoom={false}
          className="w-full h-full z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventsHandler />

          {/* Interactive selected pin marker */}
          {interactivePinDrop && (
            <Marker
              position={[selectedCoords.lat, selectedCoords.lng]}
              icon={defaultIcon}
              draggable={true}
              eventHandlers={{
                dragend: async (e: any) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  const lat = Number(pos.lat.toFixed(5));
                  const lng = Number(pos.lng.toFixed(5));
                  setSelectedCoords({ lat, lng });

                  const geoDetails = await reverseGeocode(lat, lng);
                  if (onPinSelected) onPinSelected(lat, lng, geoDetails);
                },
              }}
            >
              <Popup>
                <div className="text-xs text-slate-900 font-bold">
                  Selected Pin: {selectedCoords.lat}, {selectedCoords.lng}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Existing StreetBite vendors */}
          {places.map((place) => {
            const googleNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
            return (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
                icon={defaultIcon}
              >
                <Popup className="text-slate-900 font-sans">
                  <div className="p-1 space-y-1.5 min-w-[180px]">
                    <h4 className="font-bold text-sm text-slate-900">{place.name}</h4>
                    <p className="text-xs text-slate-600">{place.locality || place.address}</p>

                    <div className="text-xs font-semibold text-orange-600">
                      {place.review_count && place.review_count > 0 ? (
                        <span>★ {(place.rating_avg ?? 0).toFixed(1)} ({place.review_count} reviews)</span>
                      ) : (
                        <span className="text-slate-500 font-normal">New listing · 0 reviews</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      <a
                        href={`/place/${place.id}`}
                        className="text-xs font-bold text-orange-600 hover:underline"
                      >
                        View Listing
                      </a>
                      <span className="text-slate-300">•</span>
                      <a
                        href={googleNavUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        Directions <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {interactivePinDrop && (
          <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/95 backdrop-blur text-slate-700 text-xs px-3.5 py-2 rounded-xl border border-orange-200 text-center shadow-md font-medium">
            Click anywhere on the map or drag the pin 📍 to choose stall coordinates
          </div>
        )}
      </div>
    </div>
  );
}
