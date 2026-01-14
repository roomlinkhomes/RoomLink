import { getDistance } from 'geolib';

export const calculateDistanceKm = (userCoords, listingCoords) => {
  if (!userCoords || !listingCoords) return null;

  const distanceMeters = getDistance(
    { latitude: userCoords.latitude, longitude: userCoords.longitude },
    { latitude: listingCoords.latitude, longitude: listingCoords.longitude }
  );

  const km = (distanceMeters / 1000).toFixed(1);
  return km < 1 ? `${Math.round(distanceMeters)} m` : `${km} km`;
};