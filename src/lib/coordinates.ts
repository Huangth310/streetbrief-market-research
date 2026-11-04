interface Coordinate {
  lat: number;
  lng: number;
}

const PI = Math.PI;
const AXIS = 6378245;
const ECCENTRICITY = 0.006693421622965943;

function isOutsideChina({ lat, lng }: Coordinate) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x: number, y: number) {
  let result =
    -100 +
    2 * x +
    3 * y +
    0.2 * y * y +
    0.1 * x * y +
    0.2 * Math.sqrt(Math.abs(x));
  result +=
    ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
  result +=
    ((20 * Math.sin(y * PI) + 40 * Math.sin((y / 3) * PI)) * 2) / 3;
  result +=
    ((160 * Math.sin((y / 12) * PI) + 320 * Math.sin((y * PI) / 30)) *
      2) /
    3;
  return result;
}

function transformLng(x: number, y: number) {
  let result =
    300 +
    x +
    2 * y +
    0.1 * x * x +
    0.1 * x * y +
    0.1 * Math.sqrt(Math.abs(x));
  result +=
    ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
  result +=
    ((20 * Math.sin(x * PI) + 40 * Math.sin((x / 3) * PI)) * 2) / 3;
  result +=
    ((150 * Math.sin((x / 12) * PI) + 300 * Math.sin((x / 30) * PI)) *
      2) /
    3;
  return result;
}

function wgs84ToGcj02({ lat, lng }: Coordinate): Coordinate {
  if (isOutsideChina({ lat, lng })) return { lat, lng };
  let deltaLat = transformLat(lng - 105, lat - 35);
  let deltaLng = transformLng(lng - 105, lat - 35);
  const radLat = (lat / 180) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ECCENTRICITY * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  deltaLat =
    (deltaLat * 180) /
    (((AXIS * (1 - ECCENTRICITY)) / (magic * sqrtMagic)) * PI);
  deltaLng =
    (deltaLng * 180) /
    ((AXIS / sqrtMagic) * Math.cos(radLat) * PI);
  return {
    lat: lat + deltaLat,
    lng: lng + deltaLng,
  };
}

export function gcj02ToWgs84(coordinate: Coordinate): Coordinate {
  if (isOutsideChina(coordinate)) return coordinate;
  let result = { ...coordinate };
  for (let index = 0; index < 2; index += 1) {
    const converted = wgs84ToGcj02(result);
    result = {
      lat: result.lat + coordinate.lat - converted.lat,
      lng: result.lng + coordinate.lng - converted.lng,
    };
  }
  return result;
}
