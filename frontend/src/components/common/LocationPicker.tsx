import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// BUG CONNU Leaflet + bundlers (Vite/Webpack) : les icônes de marqueur par
// défaut pointent vers des chemins relatifs cassés par le bundler, sans ce
// correctif explicite (icônes invisibles ou 404 sinon).
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const SEARCH_DEBOUNCE_MS = 500;
// Centre par défaut de la carte si la géolocalisation est indisponible/refusée.
const DEFAULT_CENTER: [number, number] = [33.5731, -7.5898];

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
  );
  if (!response.ok) throw new Error("Géocodage inverse impossible");
  const data = (await response.json()) as { display_name?: string };
  if (!data.display_name) throw new Error("Adresse introuvable");
  return data.display_name;
}

/** Capte les clics sur la carte (bibliothèque react-leaflet : hook dédié, pas de prop onClick sur MapContainer). */
function MapClickHandler({ onSelect }: { onSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

/**
 * BUG CONNU react-leaflet : la prop `center` de `MapContainer` ne définit
 * la vue qu'au premier rendu — changer `mapPosition` ensuite (ex. bouton
 * "Me localiser") déplacerait le marqueur mais pas la caméra sans ce
 * correctif explicite (`map.setView`).
 */
function MapViewSync({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

/**
 * BUG CONNU Leaflet dans une modale : la carte peut se rendre grisée/mal
 * dimensionnée si son conteneur avait une taille nulle au moment du premier
 * rendu (cas d'une modale qui s'anime à l'ouverture). `invalidateSize()`
 * après un court délai force Leaflet à recalculer ses dimensions.
 */
function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const timeoutId = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(timeoutId);
  }, [map]);
  return null;
}

/**
 * Champ "Localisation" combinant 3 façons de renseigner une adresse :
 * saisie libre avec autocomplétion (recherche Nominatim/OpenStreetMap),
 * sélection directe sur une carte interactive, ou détection de la position
 * actuelle du navigateur (géolocalisation + géocodage inverse).
 *
 * Ne stocke que le texte de l'adresse (`value: string`), pas de coordonnées
 * — cohérent avec le schéma Zod existant (`location: z.string()...`), les
 * coordonnées ne servent qu'en interne pour retrouver le texte via Nominatim.
 *
 * Utilise Nominatim (service de recherche/géocodage gratuit d'OpenStreetMap,
 * aucune clé API requise). Politique d'usage raisonnable côté OSM — largement
 * suffisant en développement et pour un lancement normal, à reconsidérer
 * seulement en cas de très fort trafic plus tard.
 */
export function LocationPicker({
  label,
  value,
  onChange,
  error,
  placeholder = "Ex. Paris",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // État propre à la modale carte, distinct de `value` tant que
  // l'utilisateur n'a pas cliqué "Confirmer cet emplacement".
  const [mapPosition, setMapPosition] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapAddress, setMapAddress] = useState("");
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchIdRef = useRef(0);

  // Garde le champ synchronisé si `value` change depuis l'extérieur (ex.
  // réinitialisation du formulaire).
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recherche d'adresse en direct pendant la saisie (debounce 500ms, comme
  // la vérification du nom d'agence à l'inscription).
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || trimmed === value) {
      setSuggestions([]);
      return;
    }
    const requestId = (searchIdRef.current += 1);
    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(trimmed)}&limit=5`,
      )
        .then((response) => (response.ok ? response.json() : Promise.reject(response)))
        .then((data: NominatimResult[]) => {
          if (searchIdRef.current === requestId) {
            setSuggestions(data);
            setShowSuggestions(true);
          }
        })
        .catch(() => {
          if (searchIdRef.current === requestId) setSuggestions([]);
        })
        .finally(() => {
          if (searchIdRef.current === requestId) setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [query, value]);

  function selectSuggestion(result: NominatimResult) {
    onChange(result.display_name);
    setQuery(result.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  // AJOUT : la géolocalisation vit maintenant dans la modale carte (centre +
  // marqueur + géocodage inverse dans mapAddress), pas de commit direct sur
  // le champ — l'utilisateur confirme toujours via "Confirmer cet emplacement",
  // cohérent avec le flux "clic sur la carte".
  function locateMeOnMap() {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setMapPosition([lat, lon]);
        setIsLocating(false);
        setIsReverseGeocoding(true);
        reverseGeocode(lat, lon)
          .then((address) => setMapAddress(address))
          .catch(() => {
            setMapAddress("");
            toast.error("Impossible de déterminer votre adresse à partir de votre position.");
          })
          .finally(() => setIsReverseGeocoding(false));
      },
      () => {
        toast.error("Localisation refusée ou indisponible.");
        setIsLocating(false);
      },
      { timeout: 10_000 },
    );
  }

  function openMap() {
    setMapAddress("");
    setMapPosition(DEFAULT_CENTER);
    setIsMapOpen(true);
  }

  function handleMapClick(lat: number, lon: number) {
    setMapPosition([lat, lon]);
    setIsReverseGeocoding(true);
    reverseGeocode(lat, lon)
      .then((address) => setMapAddress(address))
      .catch(() => {
        setMapAddress("");
        toast.error("Adresse introuvable à cet emplacement, essayez un point voisin.");
      })
      .finally(() => setIsReverseGeocoding(false));
  }

  function confirmMapSelection() {
    if (!mapAddress) return;
    onChange(mapAddress);
    setQuery(mapAddress);
    setIsMapOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-1.5 block text-[13.5px] font-semibold">{label}</label>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              onChange(event.target.value);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            className={
              "w-full rounded-md border bg-background px-3 py-2.5 text-[14px] outline-none transition-colors focus:border-primary " +
              (error ? "border-destructive" : "border-border")
            }
          />
          {isSearching ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}

          {showSuggestions && suggestions.length > 0 ? (
            <ul className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-background py-1 shadow-lg">
              {suggestions.map((result, index) => (
                <li key={`${result.lat}-${result.lon}-${index}`}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(result)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-accent"
                  >
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      strokeWidth={1.8}
                    />
                    <span className="min-w-0">{result.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <button
          type="button"
          onClick={openMap}
          title="Choisir sur la carte"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground/70 transition-colors hover:bg-accent"
        >
          <MapPin className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>

      {error ? <p className="mt-1 text-[12.5px] text-destructive">{error}</p> : null}

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold">Choisir sur la carte</DialogTitle>
            <DialogDescription className="text-[13.5px]">
              Cliquez sur la carte pour placer un repère à l'emplacement de votre agence.
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={locateMeOnMap}
            disabled={isLocating}
            className="flex w-fit items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-[13px] font-semibold text-foreground/80 transition-colors hover:bg-accent disabled:opacity-50"
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Crosshair className="h-3.5 w-3.5" strokeWidth={1.8} />
            )}
            Utiliser ma position actuelle
          </button>

          <div className="overflow-hidden rounded-md border border-border">
            {isMapOpen ? (
              <MapContainer
                center={mapPosition}
                zoom={13}
                style={{ height: "360px", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={mapPosition} />
                <MapClickHandler onSelect={handleMapClick} />
                <MapViewSync position={mapPosition} />
                <MapResizeFix />
              </MapContainer>
            ) : null}
          </div>

          <div className="rounded-md border border-border bg-accent/20 px-3 py-2.5 text-[13px]">
            {isReverseGeocoding ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Recherche de l'adresse...
              </span>
            ) : mapAddress ? (
              <span>{mapAddress}</span>
            ) : (
              <span className="text-muted-foreground">
                Cliquez sur la carte pour sélectionner un point.
              </span>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsMapOpen(false)}
              className="rounded-md border border-border px-4 py-2 text-[13.5px] font-semibold transition-colors hover:bg-accent"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmMapSelection}
              disabled={!mapAddress || isReverseGeocoding}
              className="rounded-md bg-primary px-4 py-2 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirmer cet emplacement
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
