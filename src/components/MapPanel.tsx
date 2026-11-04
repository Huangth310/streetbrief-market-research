import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Competitor, Report } from "../types";
import { FileSearch, Minus, Navigation, Plus, X } from "lucide-react";
import { gcj02ToWgs84 } from "../lib/coordinates";

interface MapPanelProps {
  report: Report;
  competitors: Competitor[];
  activeRadius: number | null;
  selectedId: string | null;
  onSelect: (competitor: Competitor) => void;
  onClearSelection: () => void;
  onEvidence: (ids: string[]) => void;
}

function centerIcon() {
  return L.divIcon({
    className: "map-marker-center-wrap",
    html: '<div class="map-marker-center"><span></span></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function competitorIcon(
  index: number,
  selected: boolean,
  complete: boolean,
  offset: { x: number; y: number },
) {
  return L.divIcon({
    className: "map-marker-wrap",
    html: `<div class="map-marker ${complete ? "is-complete" : "is-sparse"} ${
      selected ? "is-selected" : ""
    }" style="transform:translate(${offset.x}px,${offset.y}px)"><span class="map-marker-pin"><b>${String(index + 1).padStart(2, "0")}</b></span></div>`,
    iconSize: [36, 46],
    iconAnchor: [18, 43],
  });
}

function mapOffsets(competitors: Competitor[]) {
  const offsets = new Map<string, { x: number; y: number }>();
  const groups: Competitor[][] = [];

  for (const item of competitors) {
    const group = groups.find((items) =>
      items.some((candidate) => {
        const latMeters = (candidate.lat - item.lat) * 111_000;
        const lngMeters =
          (candidate.lng - item.lng) *
          111_000 *
          Math.cos((item.lat * Math.PI) / 180);
        return Math.hypot(latMeters, lngMeters) < 900;
      }),
    );
    if (group) group.push(item);
    else groups.push([item]);
  }

  for (const group of groups) {
    if (group.length < 2) continue;
    group.forEach((item, index) => {
      const angle = (Math.PI * 2 * index) / group.length - Math.PI / 2;
      const radius = group.length === 2 ? 24 : 28;
      offsets.set(item.id, {
        x: Math.round(Math.cos(angle) * radius),
        y: Math.round(Math.sin(angle) * radius),
      });
    });
  }
  return offsets;
}

function MapViewport({
  selected,
  center,
  radius,
  points,
}: {
  selected: { lat: number; lng: number } | null;
  center: { lat: number; lng: number };
  radius: number | null;
  points: Array<[number, number]>;
}) {
  const map = useMap();

  useEffect(() => {
    if (selected) {
      map.flyTo(
        [selected.lat, selected.lng],
        Math.max(17, map.getZoom()),
        { duration: 0.55 },
      );
      return;
    }
    if (radius) {
      map.fitBounds(
        L.latLng(center.lat, center.lng).toBounds(radius * 2),
        { padding: [30, 30], maxZoom: 15 },
      );
      return;
    }
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), {
        padding: [38, 38],
        maxZoom: 15,
      });
    }
  }, [center.lat, center.lng, map, points, radius, selected]);

  return null;
}

function MapZoomControls() {
  const map = useMap();
  return (
    <div className="map-zoom-controls" aria-label="地图缩放">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        aria-label="放大地图"
        title="放大地图"
      >
        <Plus size={18} />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        aria-label="缩小地图"
        title="缩小地图"
      >
        <Minus size={18} />
      </button>
    </div>
  );
}

function ClearSelectionOnMapClick({
  onClear,
}: {
  onClear: () => void;
}) {
  useMapEvents({
    click: () => onClear(),
  });
  return null;
}

export function MapPanel({
  report,
  competitors,
  activeRadius,
  selectedId,
  onSelect,
  onClearSelection,
  onEvidence,
}: MapPanelProps) {
  const selected = competitors.find((item) => item.id === selectedId) ?? null;
  const centerPosition = useMemo(
    () =>
      gcj02ToWgs84({
        lat: report.center.lat,
        lng: report.center.lng,
      }),
    [report.center.lat, report.center.lng],
  );
  const competitorPositions = useMemo(
    () =>
      new Map(
        competitors.map((item) => [
          item.id,
          gcj02ToWgs84({ lat: item.lat, lng: item.lng }),
        ]),
      ),
    [competitors],
  );
  const selectedPosition = selected
    ? competitorPositions.get(selected.id) ?? null
    : null;
  const offsets = useMemo(() => mapOffsets(competitors), [competitors]);
  const icons = useMemo(
    () =>
      new Map(
        competitors.map((item, index) => [
          item.id,
          competitorIcon(
            index,
            item.id === selectedId,
            item.completeness >= 60,
            offsets.get(item.id) ?? { x: 0, y: 0 },
          ),
        ]),
      ),
    [competitors, offsets, selectedId],
  );

  return (
    <div className="map-shell">
      <MapContainer
        center={[centerPosition.lat, centerPosition.lng]}
        zoom={15}
        minZoom={12}
        maxZoom={18}
        scrollWheelZoom={false}
        zoomControl={false}
        className="district-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          subdomains="ab"
        />
        <MapViewport
          selected={selectedPosition}
          center={centerPosition}
          radius={activeRadius}
          points={competitors.map((item) => {
            const position = competitorPositions.get(item.id);
            return [
              position?.lat ?? item.lat,
              position?.lng ?? item.lng,
            ];
          })}
        />
        <MapZoomControls />
        <ClearSelectionOnMapClick onClear={onClearSelection} />
        {activeRadius && (
          <Circle
            center={[centerPosition.lat, centerPosition.lng]}
            radius={activeRadius}
            pathOptions={{
              color: "#216b73",
              weight: 1.5,
              opacity: 0.8,
              fillColor: "#bcd8d8",
              fillOpacity: 0.12,
            }}
          />
        )}
        <Marker
          position={[centerPosition.lat, centerPosition.lng]}
          icon={centerIcon()}
          title="市场观察点"
        >
          <Tooltip permanent direction="top" offset={[0, -12]}>
            观察点
          </Tooltip>
        </Marker>
        {competitors.map((competitor) => (
          <Marker
            key={competitor.id}
            position={[
              competitorPositions.get(competitor.id)?.lat ?? competitor.lat,
              competitorPositions.get(competitor.id)?.lng ?? competitor.lng,
            ]}
            icon={icons.get(competitor.id)}
            title={competitor.name}
            eventHandlers={{
              click: (event) => {
                L.DomEvent.stopPropagation(event.originalEvent);
                onSelect(competitor);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <strong>{competitor.name}</strong>
              <br />
              {competitor.distanceM} m · {competitor.concept}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {selected && (
        <div className="map-selection">
          <div>
            <span className="map-selection-label">
              <Navigation size={12} /> {selected.distanceM} m
            </span>
            <h4>{selected.name}</h4>
            <p>
              {selected.hours ?? "营业时间未获取"} ·{" "}
              {selected.priceBand
                ? `价格带 ${selected.priceBand}`
                : "价格未获取"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEvidence(selected.evidenceIds)}
            aria-label={`查看 ${selected.name} 的资料`}
          >
            <FileSearch size={18} />
          </button>
          <button
            type="button"
            className="map-selection-close"
            onClick={onClearSelection}
            aria-label="取消选中该门店"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
