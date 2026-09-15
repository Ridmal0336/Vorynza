import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import HallCard from '../../components/HallCard';
import { CardSkeletons, EmptyState, ErrorState } from '../../components/States';
import * as hallsApi from '../../api/halls';
import * as hotelsApi from '../../api/hotels';
import { formatCurrency, todayIso } from '../../utils/format';

const THEMES = ['Garden', 'Indoor', 'Ballroom'];

/** Buckets a free-text decoration theme into the three filter categories. */
function themeCategory(hall) {
  const text = `${hall.decorationTheme || ''} ${hall.name || ''}`.toLowerCase();
  if (/garden|outdoor|pavilion|lawn|beach|floral/.test(text)) return 'Garden';
  if (/ballroom|crystal|grand/.test(text)) return 'Ballroom';
  return 'Indoor';
}

const emptyApplied = { location: '', date: '', guests: '' };

export default function HallSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [halls, setHalls] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [draft, setDraft] = useState({
    location: searchParams.get('location') || '',
    date: searchParams.get('date') || '',
    guests: searchParams.get('guests') || '',
  });
  const [applied, setApplied] = useState({
    location: searchParams.get('location') || '',
    date: searchParams.get('date') || '',
    guests: searchParams.get('guests') || '',
  });

  const [sidebar, setSidebar] = useState({
    minPrice: '',
    maxPrice: '',
    minCapacity: '',
    themes: [],
    minRating: '',
  });

  // Hall ids known to be booked on the applied date (null = no date filter applied).
  const [bookedIds, setBookedIds] = useState(null);
  const [checkingDate, setCheckingDate] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [hallRes, hotelRes] = await Promise.all([
        hallsApi.getHalls(),
        hotelsApi.getHotels().catch(() => ({ data: [] })),
      ]);
      setHalls(hallRes.data || []);
      setHotels(hotelRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const hotelById = useMemo(() => {
    const map = new Map();
    hotels.forEach((hotel) => map.set(hotel.id, hotel));
    return map;
  }, [hotels]);

  const locations = useMemo(() => {
    const set = new Set();
    hotels.forEach((hotel) => hotel.location && set.add(hotel.location));
    return [...set].sort();
  }, [hotels]);

  // A date filter needs a per-hall availability call, so it only runs on Search.
  useEffect(() => {
    if (!applied.date || halls.length === 0) {
      setBookedIds(null);
      return undefined;
    }

    let cancelled = false;
    setCheckingDate(true);

    Promise.all(
      halls.map((hall) =>
        hallsApi
          .checkHallAvailability(hall.id, applied.date)
          .then((res) => ({ id: hall.id, available: res.data?.available !== false }))
          .catch(() => ({ id: hall.id, available: true }))
      )
    )
      .then((results) => {
        if (cancelled) return;
        setBookedIds(new Set(results.filter((r) => !r.available).map((r) => r.id)));
      })
      .finally(() => {
        if (!cancelled) setCheckingDate(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applied.date, halls]);

  const results = useMemo(() => {
    const guests = Number(applied.guests) || 0;
    const minCapacity = Number(sidebar.minCapacity) || 0;
    const minPrice = sidebar.minPrice === '' ? null : Number(sidebar.minPrice);
    const maxPrice = sidebar.maxPrice === '' ? null : Number(sidebar.maxPrice);
    const minRating = sidebar.minRating === '' ? null : Number(sidebar.minRating);

    return halls.filter((hall) => {
      const hotel = hotelById.get(hall.hotelId);

      if (applied.location && hotel?.location !== applied.location) return false;
      if (guests && Number(hall.capacity) < guests) return false;
      if (minCapacity && Number(hall.capacity) < minCapacity) return false;
      if (minPrice != null && Number(hall.price) < minPrice) return false;
      if (maxPrice != null && Number(hall.price) > maxPrice) return false;
      if (minRating != null && Number(hall.averageRating || 0) < minRating) return false;
      if (sidebar.themes.length > 0 && !sidebar.themes.includes(themeCategory(hall))) return false;
      if (bookedIds && bookedIds.has(hall.id)) return false;

      return true;
    });
  }, [halls, hotelById, applied, sidebar, bookedIds]);

  const onSearch = (e) => {
    e.preventDefault();
    setApplied(draft);
    const next = {};
    Object.entries(draft).forEach(([key, value]) => {
      if (value) next[key] = value;
    });
    setSearchParams(next, { replace: true });
  };

  const toggleTheme = (theme) => {
    setSidebar((prev) => ({
      ...prev,
      themes: prev.themes.includes(theme)
        ? prev.themes.filter((t) => t !== theme)
        : [...prev.themes, theme],
    }));
  };

  const resetAll = () => {
    setDraft(emptyApplied);
    setApplied(emptyApplied);
    setSidebar({ minPrice: '', maxPrice: '', minCapacity: '', themes: [], minRating: '' });
    setSearchParams({}, { replace: true });
  };

  const priceRange = useMemo(() => {
    if (halls.length === 0) return null;
    const prices = halls.map((h) => Number(h.price) || 0);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [halls]);

  return (
    <>
      <form className="filter-bar" onSubmit={onSearch}>
        <div className="filter-bar__inner">
          <label className="field">
            <span>Location</span>
            <select
              value={draft.location}
              onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
            >
              <option value="">All locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Event date</span>
            <input
              type="date"
              min={todayIso()}
              value={draft.date}
              onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
            />
          </label>

          <label className="field">
            <span>Guests</span>
            <input
              type="number"
              min="1"
              placeholder="e.g. 200"
              value={draft.guests}
              onChange={(e) => setDraft((prev) => ({ ...prev, guests: e.target.value }))}
            />
          </label>

          <button type="submit" className="btn btn--primary">
            Search
          </button>
        </div>
      </form>

      <div className="container page">
        <div className="page-head">
          <div className="page-head__text">
            <p className="eyebrow">Venues</p>
            <h1>Wedding halls across Sri Lanka</h1>
            <p className="lead">
              Every hall below is bookable through Vorynza. Filter by budget, capacity, and style.
            </p>
          </div>
        </div>

        <div className="search-layout">
          <aside className="sidebar-filters" aria-label="Refine results">
            <div className="filter-group">
              <p className="filter-group__title">Price range</p>
              <div className="range-row">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  aria-label="Minimum price"
                  value={sidebar.minPrice}
                  onChange={(e) => setSidebar((prev) => ({ ...prev, minPrice: e.target.value }))}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  aria-label="Maximum price"
                  value={sidebar.maxPrice}
                  onChange={(e) => setSidebar((prev) => ({ ...prev, maxPrice: e.target.value }))}
                />
              </div>
              {priceRange && (
                <p className="muted" style={{ fontSize: 13 }}>
                  {formatCurrency(priceRange.min)} – {formatCurrency(priceRange.max)}
                </p>
              )}
            </div>

            <div className="filter-group">
              <p className="filter-group__title">Capacity</p>
              <select
                aria-label="Minimum capacity"
                value={sidebar.minCapacity}
                onChange={(e) => setSidebar((prev) => ({ ...prev, minCapacity: e.target.value }))}
              >
                <option value="">Any capacity</option>
                <option value="50">50+ guests</option>
                <option value="100">100+ guests</option>
                <option value="200">200+ guests</option>
                <option value="300">300+ guests</option>
                <option value="500">500+ guests</option>
              </select>
            </div>

            <div className="filter-group">
              <p className="filter-group__title">Theme</p>
              {THEMES.map((theme) => (
                <label className="check" key={theme}>
                  <input
                    type="checkbox"
                    checked={sidebar.themes.includes(theme)}
                    onChange={() => toggleTheme(theme)}
                  />
                  {theme}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <p className="filter-group__title">Rating</p>
              <select
                aria-label="Minimum rating"
                value={sidebar.minRating}
                onChange={(e) => setSidebar((prev) => ({ ...prev, minRating: e.target.value }))}
              >
                <option value="">Any rating</option>
                <option value="3">3.0+</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
              </select>
            </div>

            <button type="button" className="btn-link" onClick={resetAll}>
              Clear all filters
            </button>
          </aside>

          <div>
            {loading ? (
              <CardSkeletons count={4} />
            ) : error ? (
              <ErrorState message={error} onRetry={load} />
            ) : (
              <>
                <p className="result-count">
                  {results.length} {results.length === 1 ? 'venue' : 'venues'}
                  {applied.date ? ` available on ${applied.date}` : ''}
                  {checkingDate ? ' · checking availability…' : ''}
                </p>

                {results.length === 0 ? (
                  <EmptyState
                    title="No venues match those filters"
                    message="Try widening your budget, lowering the guest count, or clearing the event date."
                    actionLabel="Clear all filters"
                    onAction={resetAll}
                  />
                ) : (
                  <div className="results-grid">
                    {results.map((hall) => (
                      <HallCard
                        key={hall.id}
                        hall={hall}
                        location={hotelById.get(hall.hotelId)?.location}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
