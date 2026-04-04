import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { supabase } from './lib/supabase';

import gooseOneArt from './assets/Rashi-2.png';
import gooseTwoArt from './assets/Dyuthi-1.png';
import gooseThreeArt from './assets/Rajni-1.png';

import ratingOneArt from './assets/Pump.png';
import ratingTwoArt from './assets/Pump.png';
import ratingThreeArt from './assets/Pump.png';
import ratingFourArt from './assets/Pump.png';
import ratingFiveArt from './assets/Pump.png';

import placeOneArt from './assets/snack.png';
import placeTwoArt from './assets/memory.png';
import placeThreeArt from './assets/fun.png';
import placeFourArt from './assets/work.png';

import mapImage from './assets/Map.jpg';

const menuItems = ['Home', 'Places', 'Map', 'Points', 'Settings', 'Account'];

const gooseGroup = [
  {
    name: 'Goose One',
    short: 'Leader',
    emoji: '🪿',
    art: gooseOneArt,
    traits: ['Tiny backpack', 'Very curious', 'First to explore'],
  },
  {
    name: 'Goose Two',
    short: 'Scout',
    emoji: '🪿',
    art: gooseTwoArt,
    traits: ['Blue scarf', 'Fast runner', 'Spots clues quickly'],
  },
  {
    name: 'Goose Three',
    short: 'Snack Keeper',
    emoji: '🪿',
    art: gooseThreeArt,
    traits: ['Round glasses', 'Loves snacks', 'Knows the route'],
  },
];

const uiGooseNameMap = {
  Rashi: 'Goose One',
  Dyuthi: 'Goose Two',
  Rajni: 'Goose Three',
};

const ratingIcons = [
  { value: 1, label: '1 out of 5', art: ratingOneArt },
  { value: 2, label: '2 out of 5', art: ratingTwoArt },
  { value: 3, label: '3 out of 5', art: ratingThreeArt },
  { value: 4, label: '4 out of 5', art: ratingFourArt },
  { value: 5, label: '5 out of 5', art: ratingFiveArt },
];

const placeTypeOptions = [
  { value: 'cafe', label: 'Cafe', art: placeOneArt },
  { value: 'food', label: 'Food', art: placeTwoArt },
  { value: 'park', label: 'Park', art: placeThreeArt },
  { value: 'shop', label: 'Shop', art: placeFourArt },
];

function GooseIcon({ goose, className = '' }) {
  if (goose.art) {
    return <img className={className} src={goose.art} alt={goose.name} draggable="false" />;
  }
  return <span className={className}>{goose.emoji}</span>;
}

function RatingIcon({ item, className = '' }) {
  if (item.art) {
    return <img className={className} src={item.art} alt={item.label} draggable="false" />;
  }
  return <span className={className}>★</span>;
}

function PlaceTypeIcon({ placeType, className = '', size = 100 }) {
  const match = placeTypeOptions.find((item) => item.value === placeType) || placeTypeOptions[0];

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <img
        src={match.art}
        alt={match.label}
        draggable="false"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </span>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [geeseRows, setGeeseRows] = useState([]);
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [dbMessage, setDbMessage] = useState('');
  const [deletingPlaceId, setDeletingPlaceId] = useState(null);

  const gooseIdByUiName = useMemo(() => {
    const lookup = {};
    geeseRows.forEach((goose) => {
      const uiName = uiGooseNameMap[goose.name];
      if (uiName) lookup[uiName] = goose.id;
    });
    return lookup;
  }, [geeseRows]);

  const handleMenuItemClick = (item) => {
    setActiveTab(item);
    setMenuOpen(false);
  };

  const fetchGeese = async () => {
    const { data, error } = await supabase.from('geese').select('*').order('name');
    if (error) {
      setDbMessage(error.message);
      return;
    }
    setGeeseRows(data || []);
  };

  const fetchSavedPlaces = async () => {
    setPlacesLoading(true);

    const { data: placesData, error: placesError } = await supabase
      .from('places')
      .select('*')
      .order('id', { ascending: false });

    if (placesError) {
      setDbMessage(placesError.message);
      setPlacesLoading(false);
      return;
    }

    const { data: taggedPeopleRows, error: taggedPeopleError } = await supabase
      .from('place_people')
      .select('place_id, goose_id');

    if (taggedPeopleError) {
      setDbMessage(taggedPeopleError.message);
      setPlacesLoading(false);
      return;
    }

    const gooseNameById = {};
    geeseRows.forEach((goose) => {
      const uiName = uiGooseNameMap[goose.name];
      if (uiName) gooseNameById[goose.id] = uiName;
    });

    const peopleByPlaceId = {};
    (taggedPeopleRows || []).forEach((row) => {
      if (!peopleByPlaceId[row.place_id]) peopleByPlaceId[row.place_id] = [];
      const uiName = gooseNameById[row.goose_id];
      if (uiName) peopleByPlaceId[row.place_id].push(uiName);
    });

    const normalizedPlaces = (placesData || []).map((place) => ({
      id: `db-${place.id}`,
      dbId: place.id,
      name: place.name || '',
      review: place.review || '',
      rating: place.rating || 0,
      relX: place.rel_x,
      relY: place.rel_y,
      pixelX: null,
      pixelY: null,
      relXPercent: place.rel_x != null ? `${(place.rel_x * 100).toFixed(1)}%` : '',
      relYPercent: place.rel_y != null ? `${(place.rel_y * 100).toFixed(1)}%` : '',
      people: peopleByPlaceId[place.id] || [],
      photos: [],
      fileName: '',
      placeType: place.place_type || 'cafe',
    }));

    setSavedPlaces(normalizedPlaces);
    setPlacesLoading(false);
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    const { data, error } = await supabase
      .from('goose_leaderboard')
      .select('*')
      .order('total_points', { ascending: false })
      .order('places_visited', { ascending: false });

    if (error) {
      setDbMessage(error.message);
      setLeaderboardLoading(false);
      return;
    }

    setLeaderboardRows(data || []);
    setLeaderboardLoading(false);
  };

  useEffect(() => {
    fetchGeese();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (geeseRows.length > 0) {
      fetchSavedPlaces();
    }
  }, [geeseRows]);

  const handleSavePlace = async (placeData) => {
    try {
      setDbMessage('');
      const creatorUiName = placeData.people?.[0] || null;
      const creatorGooseId = creatorUiName ? gooseIdByUiName[creatorUiName] || null : null;

      const { data: insertedPlace, error: placeError } = await supabase
        .from('places')
        .insert({
          name: placeData.name || 'Untitled place',
          review: placeData.review || '',
          rating: placeData.rating || 0,
          rel_x: placeData.relX,
          rel_y: placeData.relY,
          photo_count: placeData.photos?.length || 0,
          created_by_goose_id: creatorGooseId,
          place_type: placeData.placeType || 'cafe',
        })
        .select()
        .single();

      if (placeError) throw placeError;

      const taggedRows = (placeData.people || [])
        .map((uiName) => gooseIdByUiName[uiName])
        .filter(Boolean)
        .map((gooseId) => ({ place_id: insertedPlace.id, goose_id: gooseId }));

      if (taggedRows.length > 0) {
        const { error: peopleError } = await supabase.from('place_people').insert(taggedRows);
        if (peopleError) throw peopleError;
      }

      const savedPlaceWithDbId = {
        ...placeData,
        dbId: insertedPlace.id,
        placeType: placeData.placeType || 'cafe',
      };

      setSavedPlaces((prev) => [savedPlaceWithDbId, ...prev]);
      setSelectedPlace(savedPlaceWithDbId);
      setActiveTab('Places');
      await fetchLeaderboard();
    } catch (error) {
      setDbMessage(error.message || 'Failed to save place.');
    }
  };

  const handleDeletePlace = async (place, event) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${place.name || 'Untitled place'}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDbMessage('');
      setDeletingPlaceId(place.dbId || place.id);

      if (place.dbId) {
        const { error: junctionError } = await supabase
          .from('place_people')
          .delete()
          .eq('place_id', place.dbId);

        if (junctionError) throw junctionError;

        const { error: placeDeleteError } = await supabase
          .from('places')
          .delete()
          .eq('id', place.dbId);

        if (placeDeleteError) throw placeDeleteError;
      }

      setSavedPlaces((prev) =>
        prev.filter((item) => (item.dbId || item.id) !== (place.dbId || place.id))
      );

      setSelectedPlace((prev) => {
        if (!prev) return prev;
        return (prev.dbId || prev.id) === (place.dbId || place.id) ? null : prev;
      });

      await fetchLeaderboard();
    } catch (error) {
      setDbMessage(error.message || 'Failed to delete place.');
    } finally {
      setDeletingPlaceId(null);
    }
  };

  const handlePlacardClick = (place) => {
    setSelectedPlace(place);
    setActiveTab('Map');
    setMenuOpen(false);
  };

  const handleOpenMap = () => {
    setSelectedPlace(null);
    setActiveTab('Map');
    setMenuOpen(false);
  };

  const handleFocusPlace = (place) => {
    setSelectedPlace(place);
  };

  const handleSearchPlace = (e) => {
    e.preventDefault();

    const query = searchText.trim().toLowerCase();
    if (!query) return;

    const matchedPlace = savedPlaces.find((place) => {
      const name = (place.name || '').toLowerCase();
      const review = (place.review || '').toLowerCase();
      const people = (place.people || []).join(' ').toLowerCase();
      return name.includes(query) || review.includes(query) || people.includes(query);
    });

    if (!matchedPlace) {
      setDbMessage(`No saved place found for "${searchText}".`);
      return;
    }

    setDbMessage('');
    setSelectedPlace(matchedPlace);
    setActiveTab('Map');
    setMenuOpen(false);
    setSearchText('');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="gaggle-hover-card">
          <div className="avatar-row" aria-label="Gaggle members">
            {gooseGroup.map((goose) => (
              <div key={goose.name} className="avatar-chip" title={goose.name}>
                <div className="avatar-icon-box">
                  <GooseIcon goose={goose} className="avatar-icon-art" />
                </div>
              </div>
            ))}
          </div>

          <div className="gaggle-dropdown">
            <p className="gaggle-title">The gaggle</p>
            {gooseGroup.map((goose) => (
              <article key={goose.name} className="goose-card">
                <div className="goose-header">
                  <div className="goose-avatar" aria-hidden="true">
                    <div className="goose-avatar-box">
                      <GooseIcon goose={goose} className="goose-avatar-art" />
                    </div>
                  </div>
                  <div className="goose-copy">
                    <h3>{goose.name}</h3>
                    <p>{goose.short}</p>
                  </div>
                </div>
                <ul className="goose-traits">
                  {goose.traits.map((trait) => (
                    <li key={trait}>{trait}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className="menu-wrapper">
          <button
            type="button"
            className={`menu-toggle ${menuOpen ? 'open' : ''}`}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span /><span /><span />
          </button>

          {menuOpen && (
            <nav className="dropdown-menu" aria-label="Main navigation">
              {menuItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`dropdown-item ${activeTab === item ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick(item)}
                >
                  {item}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="main-stage">
        {activeTab === 'Home' ? (
          <section className="home-panel">
            <div className="home-hero">
              <p className="places-kicker">Welcome</p>
              <h2 className="places-title">Home</h2>
              <p className="home-copy">
                Save places from the map, browse them in the Places tab, open any saved placard back on the map, and view the live leaderboard in Points.
              </p>
            </div>

            <div className="home-grid">
              <article className="home-card">
                <p className="home-card-label">Saved places</p>
                <h3>{savedPlaces.length}</h3>
                <p>Your recorded entries are kept here while you switch tabs.</p>
              </article>

              <article className="home-card">
                <p className="home-card-label">Map</p>
                <button type="button" className="back-to-map-button" onClick={handleOpenMap}>
                  Open Map
                </button>
              </article>

              <article className="home-card">
                <p className="home-card-label">Points</p>
                <button
                  type="button"
                  className="back-to-map-button"
                  onClick={() => {
                    setActiveTab('Points');
                    setMenuOpen(false);
                  }}
                >
                  Open Points
                </button>
              </article>
            </div>
          </section>
        ) : activeTab === 'Places' ? (
          <section className="places-panel">
            <div className="places-header">
              <div>
                <p className="places-kicker">Saved entries</p>
                <h2 className="places-title">Places</h2>
              </div>
              <button type="button" className="back-to-map-button" onClick={handleOpenMap}>
                Back to map
              </button>
            </div>

            {dbMessage ? (
              <div className="places-empty">
                <h3>Database message</h3>
                <p>{dbMessage}</p>
              </div>
            ) : placesLoading ? (
              <div className="places-empty">
                <h3>Loading places...</h3>
                <p>Pulling saved locations from Supabase.</p>
              </div>
            ) : savedPlaces.length === 0 ? (
              <div className="places-empty">
                <h3>No places saved yet</h3>
                <p>Drop a pin on the map, fill in the form, and save it to see it here.</p>
              </div>
            ) : (
              <div className="place-cards-grid">
                {savedPlaces.map((place) => {
                  const placeKey = place.dbId || place.id;
                  const isDeleting = deletingPlaceId === placeKey;

                  return (
                    <article
                      key={placeKey}
                      className="place-placard"
                      style={{ position: 'relative', cursor: 'pointer' }}
                      onClick={() => handlePlacardClick(place)}
                    >
                      <button
                        type="button"
                        className="place-delete-button"
                        aria-label={`Delete ${place.name || 'place'}`}
                        title="Delete place"
                        onClick={(e) => handleDeletePlace(place, e)}
                        onMouseDown={(e) => e.stopPropagation()}
                        disabled={isDeleting}
                      >
                        {isDeleting ? '…' : '×'}
                      </button>

                      <div className="place-placard-top">
                        <div>
                          <p className="place-placard-kicker">Place</p>
                          <h3 className="place-placard-title">{place.name || 'Untitled place'}</h3>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <PlaceTypeIcon placeType={place.placeType} size={72} />
                          <div className="place-placard-rating">
                            {place.rating ? `${place.rating}/5` : '—'}
                          </div>
                        </div>
                      </div>

                      <p className="place-placard-review">{place.review || 'No review added yet.'}</p>

                      <div className="place-placard-meta">
                        <span>{place.people?.length ? place.people.join(', ') : 'No one tagged'}</span>
                        <span>{place.photos?.length || 0} photos</span>
                      </div>

                      {place.photos?.length ? (
                        <div className="place-placard-gallery">
                          {place.photos.slice(0, 3).map((photo) => (
                            <img
                              key={photo.id}
                              src={photo.url}
                              alt={photo.name}
                              className="place-placard-thumb"
                              draggable="false"
                            />
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : activeTab === 'Map' ? (
          <section className="map-panel">
            <div className="map-frame">
              <ZoomableMap
                src={mapImage}
                alt="Map"
                onSavePlace={handleSavePlace}
                focusedPlace={selectedPlace}
                onFocusPlace={handleFocusPlace}
                savedPlaces={savedPlaces}
              />

              <form className="map-search-form" onSubmit={handleSearchPlace}>
                <input
                  type="text"
                  className="map-search-input"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <button type="submit" className="map-search-button" aria-label="Search">
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0a7 7 0 0 1 14 0Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </section>
        ) : activeTab === 'Points' ? (
          <section className="places-panel">
            <div className="places-header">
              <div>
                <p className="places-kicker">Leaderboard</p>
                <h2 className="places-title">Points</h2>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" className="back-to-map-button" onClick={fetchLeaderboard}>
                  Refresh points
                </button>
                <button type="button" className="back-to-map-button" onClick={handleOpenMap}>
                  Open map
                </button>
              </div>
            </div>

            {dbMessage ? (
              <div className="places-empty">
                <h3>Database message</h3>
                <p>{dbMessage}</p>
              </div>
            ) : leaderboardLoading ? (
              <div className="places-empty">
                <h3>Loading points...</h3>
                <p>Pulling scores from Supabase.</p>
              </div>
            ) : leaderboardRows.length === 0 ? (
              <div className="places-empty">
                <h3>No leaderboard data yet</h3>
                <p>Save a place from the map to push points into the database.</p>
              </div>
            ) : (
              <div className="place-cards-grid">
                {leaderboardRows.map((entry, index) => {
                  const uiName = uiGooseNameMap[entry.name] || entry.name;
                  const goose = gooseGroup.find((item) => item.name === uiName) || gooseGroup[0];

                  return (
                    <article key={entry.id || entry.name} className="place-placard" style={{ cursor: 'default' }}>
                      <div className="place-placard-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar-chip" style={{ marginLeft: 0 }}>
                            <div className="avatar-icon-box">
                              <GooseIcon goose={goose} className="avatar-icon-art" />
                            </div>
                          </div>
                          <div>
                            <p className="place-placard-kicker">Rank #{index + 1}</p>
                            <h3 className="place-placard-title">{uiName}</h3>
                          </div>
                        </div>
                        <div className="place-placard-rating">{entry.total_points} pts</div>
                      </div>

                      <p className="place-placard-review">
                        {uiName} has visited {entry.places_visited} place{entry.places_visited === 1 ? '' : 's'} so far.
                      </p>

                      <div className="place-placard-meta">
                        <span>Total points: {entry.total_points}</span>
                        <span>Places visited: {entry.places_visited}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : activeTab === 'Settings' ? (
          <section className="placeholder-panel">
            <p className="places-kicker">Section</p>
            <h2 className="places-title">Settings</h2>
            <p className="placeholder-copy">This tab is ready for content next.</p>
          </section>
        ) : (
          <section className="placeholder-panel">
            <p className="places-kicker">Section</p>
            <h2 className="places-title">Account</h2>
            <p className="placeholder-copy">This tab is ready for content next.</p>
          </section>
        )}
      </main>
    </div>
  );
}

function ZoomableMap({ src, alt, onSavePlace, focusedPlace, onFocusPlace, savedPlaces = [] }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const NATURAL_W = 2009;
  const NATURAL_H = 1390;

  const emptyFormState = {
    name: '',
    review: '',
    files: [],
    photos: [],
    people: [],
    rating: 0,
    placeType: 'cafe',
  };

  const [pin, setPin] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [formState, setFormState] = useState(emptyFormState);

  const panelOpen = Boolean(pin);
  const displayPlace = focusedPlace || null;

  useEffect(() => {
    setGalleryIndex(0);
  }, [focusedPlace?.id, focusedPlace?.dbId, pin?.relX, pin?.relY]);

  const revokePhotoUrls = (photos = []) => {
    photos.forEach((photo) => {
      if (photo?.url?.startsWith('blob:')) URL.revokeObjectURL(photo.url);
    });
  };

  useEffect(() => {
    return () => {
      revokePhotoUrls(formState.photos);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetDraftForm = () => {
    setFormState(emptyFormState);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clampOffset = (rawX, rawY, s) => {
    const container = containerRef.current;
    if (!container) return { x: rawX, y: rawY };

    const { width: cw, height: ch } = container.getBoundingClientRect();
    const baseW = cw;
    const baseH = (NATURAL_H / NATURAL_W) * baseW;
    const w = baseW * s;
    const h = baseH * s;

    const x = w <= cw ? (cw - w) / 2 : Math.min(0, Math.max(cw - w, rawX));
    const y = h <= ch ? (ch - h) / 2 : Math.min(0, Math.max(ch - h, rawY));

    return { x, y };
  };

  const handleWheel = (e) => {
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const delta = e.deltaY > 0 ? -0.12 : 0.12;

    setScale((prevScale) => {
      const nextScale = Math.min(2.5, Math.max(0.9, prevScale + delta));
      if (nextScale === prevScale) return prevScale;

      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      setOffset((prevOffset) => {
        const ratio = nextScale / prevScale;
        const rawX = cursorX - (cursorX - prevOffset.x) * ratio;
        const rawY = cursorY - (cursorY - prevOffset.y) * ratio;
        return clampOffset(rawX, rawY, nextScale);
      });

      return nextScale;
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) setHasMoved(true);

    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy, scale));
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setHasMoved(false);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const stopDragging = () => {
    setDragging(false);
  };

  const applyZoom = (delta) => {
    const container = containerRef.current;
    if (!container) return;

    const { width: cw, height: ch } = container.getBoundingClientRect();

    setScale((prevScale) => {
      const nextScale = Math.min(2.5, Math.max(0.9, prevScale + delta));
      if (nextScale === prevScale) return prevScale;

      setOffset((prevOffset) => {
        const ratio = nextScale / prevScale;
        const rawX = cw / 2 - (cw / 2 - prevOffset.x) * ratio;
        const rawY = ch / 2 - (ch / 2 - prevOffset.y) * ratio;
        return clampOffset(rawX, rawY, nextScale);
      });

      return nextScale;
    });
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const focusPlaceInView = (targetPlace) => {
    const container = containerRef.current;
    if (!container || !targetPlace) return;

    const rect = container.getBoundingClientRect();
    const baseW = rect.width;
    const baseH = (NATURAL_H / NATURAL_W) * baseW;

    const targetScale = 1.8;
    const pointX = targetPlace.relX * baseW * targetScale;
    const pointY = targetPlace.relY * baseH * targetScale;

    const desiredX = rect.width * 0.5;
    const desiredY = rect.height * 0.42;

    const rawOffsetX = desiredX - pointX;
    const rawOffsetY = desiredY - pointY;

    setScale(targetScale);
    setOffset(clampOffset(rawOffsetX, rawOffsetY, targetScale));
  };

  useEffect(() => {
    const frame1 = requestAnimationFrame(() => {
      const frame2 = requestAnimationFrame(() => {
        setPin(null);
        setGalleryIndex(0);

        if (focusedPlace) {
          focusPlaceInView(focusedPlace);
        } else {
          resetView();
        }
      });

      return () => cancelAnimationFrame(frame2);
    });

    return () => cancelAnimationFrame(frame1);
  }, [focusedPlace]);

  const getScreenPoint = (targetPin) => {
    if (!targetPin || !containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const baseW = rect.width;
    const baseH = (NATURAL_H / NATURAL_W) * baseW;
    const w = baseW * scale;
    const h = baseH * scale;

    const imgX = w <= rect.width ? (rect.width - w) / 2 : offset.x;
    const imgY = h <= rect.height ? (rect.height - h) / 2 : offset.y;

    return {
      x: imgX + targetPin.relX * baseW * scale,
      y: imgY + targetPin.relY * baseH * scale,
    };
  };

  const handleClick = (e) => {
    if (dragging || hasMoved) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const baseW = rect.width;
    const baseH = (NATURAL_H / NATURAL_W) * baseW;
    const w = baseW * scale;
    const h = baseH * scale;

    const imgX = w <= rect.width ? (rect.width - w) / 2 : offset.x;
    const imgY = h <= rect.height ? (rect.height - h) / 2 : offset.y;

    const relX = Math.min(1, Math.max(0, (localX - imgX) / (baseW * scale)));
    const relY = Math.min(1, Math.max(0, (localY - imgY) / (baseH * scale)));

    if (onFocusPlace) onFocusPlace(null);
    revokePhotoUrls(formState.photos);

    setPin({
      relX,
      relY,
      pixelX: Math.round(relX * baseW),
      pixelY: Math.round(relY * baseH),
      name: '',
      review: '',
      people: [],
      rating: 0,
      photos: [],
      placeType: formState.placeType || 'cafe',
    });

    resetDraftForm();
  };

  const handleFormChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilesChange = (e) => {
    const incomingFiles = Array.from(e.target.files || []);
    if (!incomingFiles.length) return;

    const nextPhotos = incomingFiles.map((file, index) => ({
      id: `${file.name}-${file.size}-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      file,
      url: URL.createObjectURL(file),
    }));

    setFormState((prev) => ({
      ...prev,
      files: [...prev.files, ...incomingFiles],
      photos: [...prev.photos, ...nextPhotos],
    }));

    e.target.value = '';
  };

  const togglePerson = (personName) => {
    setFormState((prev) => ({
      ...prev,
      people: prev.people.includes(personName)
        ? prev.people.filter((n) => n !== personName)
        : [...prev.people, personName],
    }));
  };

  const handleRatingSelect = (value) => {
    setFormState((prev) => ({ ...prev, rating: prev.rating === value ? 0 : value }));
  };

  const handlePlaceTypeSelect = (value) => {
    setFormState((prev) => ({ ...prev, placeType: value }));
  };

  const handleSavePin = () => {
    if (!pin) return;

    const savedPlace = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      relX: pin.relX,
      relY: pin.relY,
      pixelX: pin.pixelX,
      pixelY: pin.pixelY,
      relXPercent: `${(pin.relX * 100).toFixed(1)}%`,
      relYPercent: `${(pin.relY * 100).toFixed(1)}%`,
      name: formState.name,
      review: formState.review,
      people: formState.people,
      rating: formState.rating,
      photos: formState.photos,
      fileName: formState.photos.length > 0
        ? formState.photos.map((p) => p.name).join(', ')
        : '',
      placeType: formState.placeType || 'cafe',
    };

    onSavePlace(savedPlace);
    setPin(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormState(emptyFormState);
  };

  const handleClosePin = () => {
    revokePhotoUrls(formState.photos);
    setPin(null);
    resetDraftForm();
  };

  const handleCloseFocusedPlace = () => {
    if (onFocusPlace) onFocusPlace(null);
  };

  const getPinStyle = (targetPin) => {
    const point = getScreenPoint(targetPin);
    if (!point) return {};
    return {
      left: `${point.x}px`,
      top: `${point.y}px`,
    };
  };

  const getPopupStyle = (targetPin) => {
    const point = getScreenPoint(targetPin);
    if (!point || !containerRef.current) return {};

    const container = containerRef.current.getBoundingClientRect();
    const popupWidth = Math.min(240, container.width * 0.62);
    const gap = 12;

    let left = point.x + gap;
    if (left + popupWidth > container.width - 12) left = point.x - popupWidth - gap;
    left = Math.max(12, Math.min(left, container.width - popupWidth - 12));

    let top = point.y - 140;
    top = Math.max(12, Math.min(top, container.height - 180));

    return { left: `${left}px`, top: `${top}px`, width: `${popupWidth}px` };
  };

  const savedPopupStyle = useMemo(() => getPopupStyle(displayPlace), [displayPlace, scale, offset]);
  const draftPinStyle = useMemo(() => getPinStyle(pin), [pin, scale, offset]);

  const activePhoto = displayPlace?.photos?.length > 0
    ? displayPlace.photos[Math.min(galleryIndex, displayPlace.photos.length - 1)]
    : null;

  return (
    <div className={`map-layout ${panelOpen ? 'panel-open' : ''}`}>
      <aside
        className={`map-entry-sidebar ${panelOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="entry-panel-inner">
          <div className="entry-panel-header">
            <div>
              <p className="entry-kicker">New place</p>
              <h3 className="entry-title">{formState.name || pin?.name || 'Add location details'}</h3>
            </div>
            <button type="button" className="entry-close" onClick={handleClosePin} aria-label="Close">
              ×
            </button>
          </div>

          <div className="entry-scroll-body">
            <label className="entry-field">
              <span>Name of place</span>
              <input
                type="text"
                value={formState.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Add place name"
              />
            </label>

            <div className="entry-field">
              <span>Type of Place</span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: '10px',
                }}
              >
                {placeTypeOptions.map((item) => {
                  const selected = formState.placeType === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handlePlaceTypeSelect(item.value)}
                      aria-pressed={selected}
                      title={item.label}
                      style={{
                        borderRadius: '16px',
                        border: selected
                          ? '2px solid rgba(126, 92, 255, 0.55)'
                          : '1px solid rgba(255,255,255,0.18)',
                        background: selected
                          ? 'rgba(255,255,255,0.20)'
                          : 'rgba(255,255,255,0.08)',
                        padding: '12px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        minHeight: '96px',
                      }}
                    >
                      <img
                        src={item.art}
                        alt={item.label}
                        draggable="false"
                        style={{
                          width: '48px',
                          height: '48px',
                          objectFit: 'contain',
                          display: 'block',
                        }}
                      />
                      <span style={{ fontSize: '12px' }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="entry-field">
              <span>Who was there</span>
              <div className="entry-gaggle-picker" aria-label="Select gaggle members">
                {gooseGroup.map((goose) => {
                  const selected = formState.people.includes(goose.name);
                  return (
                    <button
                      key={goose.name}
                      type="button"
                      className={`gaggle-select-chip ${selected ? 'selected' : ''}`}
                      onClick={() => togglePerson(goose.name)}
                      aria-pressed={selected}
                      title={goose.name}
                    >
                      <span className="gaggle-select-icon-box">
                        <GooseIcon goose={goose} className="gaggle-select-art" />
                      </span>
                      <span className="gaggle-select-check" aria-hidden="true">✓</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="entry-field">
              <span>Rating</span>
              <div className="rating-picker" aria-label="Place rating">
                {ratingIcons.map((item) => {
                  const active = item.value <= formState.rating;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`rating-chip ${active ? 'active' : ''}`}
                      onClick={() => handleRatingSelect(item.value)}
                      aria-pressed={active}
                      title={item.label}
                    >
                      <span className="rating-icon-box">
                        <RatingIcon item={item} className="rating-art" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="entry-field">
              <span>Upload pictures</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesChange}
              />
              {formState.photos.length > 0 && (
                <div className="entry-photo-strip">
                  {formState.photos.map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt={photo.name}
                      className="entry-photo-thumb"
                      draggable="false"
                    />
                  ))}
                </div>
              )}
            </label>

            <label className="entry-field">
              <span>Review</span>
              <textarea
                rows={4}
                value={formState.review}
                onChange={(e) => handleFormChange('review', e.target.value)}
                placeholder="Write your review"
              />
            </label>
          </div>

          <button type="button" className="entry-save" onClick={handleSavePin}>
            Save place
          </button>
        </div>
      </aside>

      <div className={`map-stage ${panelOpen ? 'shifted' : ''}`}>
        <div
          className="zoomable-map"
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onClick={handleClick}
        >
          <img
            className="zoomable-map-image"
            src={src}
            alt={alt}
            draggable="false"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'top left',
              cursor: dragging ? 'grabbing' : 'grab',
            }}
          />

          {savedPlaces.map((place) => {
            const pointStyle = getPinStyle(place);
            const isSelected = (displayPlace?.dbId || displayPlace?.id) === (place.dbId || place.id);

            if (!pointStyle?.left || !pointStyle?.top) return null;

            return (
              <button
                key={place.dbId || place.id}
                type="button"
                style={{
                  ...pointStyle,
                  position: 'absolute',
                  transform: 'translate(-50%, -100%)',
                  width: '64px',
                  height: '64px',
                  borderRadius: '999px',
                  border: isSelected
                    ? '2px solid rgba(126, 92, 255, 0.7)'
                    : '1px solid rgba(255,255,255,0.18)',
                  background: isSelected
                    ? 'rgba(255,255,255,0.92)'
                    : 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  boxShadow: isSelected
                    ? '0 12px 24px rgba(0,0,0,0.16)'
                    : '0 8px 18px rgba(0,0,0,0.12)',
                  display: 'grid',
                  placeItems: 'center',
                  zIndex: isSelected ? 4 : 2,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onFocusPlace) onFocusPlace(place);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label={`Open ${place.name || 'saved place'}`}
                title={place.name || 'Saved place'}
              >
                <PlaceTypeIcon placeType={place.placeType} size={56} />
              </button>
            );
          })}

          {displayPlace && savedPopupStyle?.left && savedPopupStyle?.top && (
            <div
              className="map-place-popup"
              style={savedPopupStyle}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="map-place-popup-head">
                <div>
                  <p className="map-place-popup-kicker">Saved place</p>
                  <h4>{displayPlace.name || 'Untitled place'}</h4>
                </div>
                <button
                  type="button"
                  className="map-place-popup-close"
                  onClick={handleCloseFocusedPlace}
                  aria-label="Close saved place popup"
                >
                  ×
                </button>
              </div>

              {activePhoto ? (
                <div className="map-popup-gallery">
                  <img
                    src={activePhoto.url}
                    alt={activePhoto.name}
                    className="map-popup-main-image"
                    draggable="false"
                  />
                  {displayPlace.photos.length > 1 && (
                    <div className="map-popup-thumb-row">
                      {displayPlace.photos.map((photo, index) => (
                        <button
                          key={photo.id}
                          type="button"
                          className={`map-popup-thumb-button ${index === galleryIndex ? 'active' : ''}`}
                          onClick={() => setGalleryIndex(index)}
                        >
                          <img
                            src={photo.url}
                            alt={photo.name}
                            className="map-popup-thumb-image"
                            draggable="false"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="map-place-popup-meta">
                <span>{displayPlace.rating ? `${displayPlace.rating}/5` : 'No rating'}</span>
                <span>{displayPlace.people?.length ? displayPlace.people.join(', ') : 'No people tagged'}</span>
              </div>
              <p className="map-place-popup-review">{displayPlace.review || 'No review added yet.'}</p>
            </div>
          )}

          {pin && draftPinStyle?.left && draftPinStyle?.top && (
            <div
              style={{
                ...draftPinStyle,
                position: 'absolute',
                transform: 'translate(-50%, -100%)',
                width: '64px',
                height: '64px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                boxShadow: '0 8px 18px rgba(0,0,0,0.12)',
                display: 'grid',
                placeItems: 'center',
                zIndex: 5,
              }}
            >
              <PlaceTypeIcon placeType={formState.placeType} size={56} />
            </div>
          )}

          <div className="compass-wrap" aria-hidden="true">
            <img
              className="compass-image"
              src="/compass-placeholder.png"
              alt="Compass decoration"
              draggable="false"
            />
          </div>

          <div className="zoom-controls">
            <button type="button" className="zoom-button" onClick={() => applyZoom(0.2)}>+</button>
            <button type="button" className="zoom-button" onClick={() => applyZoom(-0.2)}>−</button>
            <button type="button" className="zoom-button zoom-reset-small" onClick={resetView}>R</button>
          </div>
        </div>
      </div>
    </div>
  );
}