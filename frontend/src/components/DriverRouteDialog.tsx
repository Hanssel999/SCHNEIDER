import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Clock3, Flag, MapPin, PackageOpen } from "lucide-react";
import { DriverRouteIntake } from "../services/driverRoute";

type DriverRouteDialogProps = {
  initialData: DriverRouteIntake | null;
  loading: boolean;
  error: string | null;
  onGenerate: (data: DriverRouteIntake) => Promise<void>;
  onCancel?: () => void;
};

const emptyData: DriverRouteIntake = {
  current_location: "",
  pickup_location: "",
  dropoff_location: "",
  current_cycle_used: 0,
  current_latitude: null,
  current_longitude: null,
  pickup_latitude: null,
  pickup_longitude: null,
  dropoff_latitude: null,
  dropoff_longitude: null,
};

type FieldErrors = Partial<Record<keyof DriverRouteIntake, string>>;

export function DriverRouteDialog({ initialData, loading, error, onGenerate, onCancel }: DriverRouteDialogProps) {
  const [form, setForm] = useState<DriverRouteIntake>(initialData ?? emptyData);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  const update = (field: keyof DriverRouteIntake, value: string | number) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "current_location") {
        next.current_latitude = null;
        next.current_longitude = null;
      }
      if (field === "pickup_location") {
        next.pickup_latitude = null;
        next.pickup_longitude = null;
      }
      if (field === "dropoff_location") {
        next.dropoff_latitude = null;
        next.dropoff_longitude = null;
      }
      return next;
    });
    setValidationErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!form.current_location.trim()) nextErrors.current_location = "Enter your current city.";
    if (!form.pickup_location.trim()) nextErrors.pickup_location = "Enter a pickup city.";
    if (!form.dropoff_location.trim()) nextErrors.dropoff_location = "Enter a dropoff city.";
    const normalizedForm = {
      ...form,
      current_cycle_used: Number.isFinite(form.current_cycle_used) ? form.current_cycle_used : 0,
    };
    if (normalizedForm.current_cycle_used < 0 || normalizedForm.current_cycle_used > 70) {
      nextErrors.current_cycle_used = "Use a value from 0 to 70 hours.";
    }
    setValidationErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onGenerate(normalizedForm);
    } catch {
      // The parent displays the API error in the dialog.
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (field: keyof DriverRouteIntake) => validationErrors[field];

  return (
    <div className="driver-route-backdrop">
      <section aria-labelledby="driver-route-title" aria-modal="true" className="driver-route-dialog" role="dialog">
        {onCancel && <button aria-label="Close route setup" className="driver-route-close" onClick={onCancel} type="button">×</button>}
        <div className="driver-route-intro">
          <span className="form-label">Route setup / driver intake</span>
          <h2 id="driver-route-title">Start your day.</h2>
          <p>Enter the route details first. We will use them to prepare your daily log.</p>
        </div>
        {loading ? (
          <p className="driver-route-loading">Retrieving your saved route...</p>
        ) : (
          <form className="driver-route-form" onSubmit={handleSubmit}>
            <CityField error={fieldError("current_location")} icon={<MapPin />} id="current-location" label="Current location" value={form.current_location} onChange={(value) => update("current_location", value)} onSelect={(location) => setForm((current) => ({ ...current, current_location: location.label, current_latitude: roundCoordinate(location.lat), current_longitude: roundCoordinate(location.lon) }))} />
            <CityField error={fieldError("pickup_location")} icon={<PackageOpen />} id="pickup-location" label="Pickup location" value={form.pickup_location} onChange={(value) => update("pickup_location", value)} onSelect={(location) => setForm((current) => ({ ...current, pickup_location: location.label, pickup_latitude: roundCoordinate(location.lat), pickup_longitude: roundCoordinate(location.lon) }))} />
            <CityField error={fieldError("dropoff_location")} icon={<Flag />} id="dropoff-location" label="Dropoff location" value={form.dropoff_location} onChange={(value) => update("dropoff_location", value)} onSelect={(location) => setForm((current) => ({ ...current, dropoff_location: location.label, dropoff_latitude: roundCoordinate(location.lat), dropoff_longitude: roundCoordinate(location.lon) }))} />
            <label className="driver-route-field" htmlFor="current-cycle-used">
              <span className="driver-route-label"><Clock3 aria-hidden="true" />Current cycle used (hrs)</span>
              <input aria-describedby={fieldError("current_cycle_used") ? "current-cycle-used-error" : undefined} aria-invalid={Boolean(fieldError("current_cycle_used"))} id="current-cycle-used" max="70" min="0" step="0.1" type="number" value={Number.isFinite(form.current_cycle_used) ? form.current_cycle_used : 0} onChange={(event) => update("current_cycle_used", event.target.value === "" ? 0 : Number(event.target.value))} />
              {fieldError("current_cycle_used") && <small className="driver-route-field-error" id="current-cycle-used-error">{fieldError("current_cycle_used")}</small>}
            </label>
            {error && <p className="driver-route-error" role="alert">{error}</p>}
            <button className="dialog-submit driver-route-submit" disabled={submitting} type="submit">
              {submitting ? "Generating..." : "Generate daily log"} <span>→</span>
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function CityField({
  error,
  icon,
  id,
  label,
  value,
  onChange,
  onSelect,
}: {
  error?: string;
  icon: ReactNode;
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: { label: string; lat: number; lon: number }) => void;
}) {
  const [suggestions, setSuggestions] = useState<Array<{ label: string; lat: number; lon: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const errorId = `${id}-error`;

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setIsSearching(true);
      fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&featuretype=city&q=${encodeURIComponent(query)}`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      })
        .then((response) => response.ok ? response.json() as Promise<Array<{ display_name: string; lat: string; lon: string; address?: { city?: string; town?: string; village?: string; state?: string; country?: string } }>> : [])
        .then((results) => {
          const names = results.map((result) => {
            const address = result.address ?? {};
            const city = address.city ?? address.town ?? address.village;
            return { label: city ? [city, address.state, address.country].filter(Boolean).join(", ") : result.display_name, lat: Number(result.lat), lon: Number(result.lon) };
          });
          setSuggestions(names.filter((result) => Number.isFinite(result.lat) && Number.isFinite(result.lon)).filter((result, index, all) => all.findIndex((item) => item.label === result.label) === index));
        })
        .catch(() => setSuggestions([]))
        .finally(() => setIsSearching(false));
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  return (
    <label className="driver-route-field city-field" htmlFor={id}>
      <span className="driver-route-label">{icon}{label}</span>
      <span className="city-input-wrap">
        <input aria-autocomplete="list" aria-controls={`${id}-suggestions`} aria-describedby={error ? errorId : undefined} aria-expanded={isFocused && suggestions.length > 0} aria-invalid={Boolean(error)} autoComplete="off" id={id} value={value} onBlur={() => window.setTimeout(() => setIsFocused(false), 120)} onChange={(event) => onChange(event.target.value)} onFocus={() => setIsFocused(true)} />
        {isFocused && (isSearching || suggestions.length > 0) && (
          <ul className="city-suggestions" id={`${id}-suggestions`} role="listbox">
            {isSearching && <li className="city-suggestion-status">Searching cities...</li>}
            {suggestions.map((suggestion) => (
              <li key={`${suggestion.label}-${suggestion.lat}`} role="option">
                <button onMouseDown={(event) => event.preventDefault()} onClick={() => { onSelect(suggestion); setSuggestions([]); setIsFocused(false); }} type="button">{suggestion.label}</button>
              </li>
            ))}
          </ul>
        )}
      </span>
      {error && <small className="driver-route-field-error" id={errorId}>{error}</small>}
    </label>
  );
}

function roundCoordinate(value: number) {
  return Number(value.toFixed(6));
}