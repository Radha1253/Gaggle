import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import './App.css';
import { supabase } from './lib/supabase';

import gooseOneArt from './assets/Rashi-2.png';
import gooseTwoArt from './assets/Dyuthi-1.png';
import gooseThreeArt from './assets/Rajni-1.png';
import gooseFourArt from './assets/Goose4.png';
import gooseFiveArt from './assets/Goose5.png';
import gooseSixArt from './assets/Goose6.png';
import gooseSevenArt from './assets/Goose7.png';
import gooseEightArt from './assets/Goose8.png';
import gooseNineArt from './assets/Goose9.png';
import gooseTenArt from './assets/Goose10.png';
import gooseElevenArt from './assets/Goose11.png';
import gooseTwelveArt from './assets/Goose12.png';
import compassArt from './assets/compass.png';

import ratingOneArt from './assets/goosefoot.png';
import ratingTwoArt from './assets/goosefoot.png';
import ratingThreeArt from './assets/goosefoot.png';
import ratingFourArt from './assets/goosefoot.png';
import ratingFiveArt from './assets/goosefoot.png';

import placeOneArt from './assets/snack.png';
import placeTwoArt from './assets/memory.png';
import placeThreeArt from './assets/fun.png';
import placeFourArt from './assets/work.png';

import mapImage from './assets/Map.jpg';
import breadcrumbArt from './assets/breadcrumb.png'; // swap filename to match your image

const menuItems = ['Home', 'Places', 'Map', 'Points', 'Wrapped'];

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
  { value: 'shop', label: 'Work', art: placeFourArt },
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

function PlaceTypeIcon({ placeType, className = '', size }) {
  const match = placeTypeOptions.find((item) => item.value === placeType) || placeTypeOptions[0];

  const dim = size ? (typeof size === 'number' ? `${size}px` : size) : '100%';

  return (
    <span
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...(size ? { width: dim, height: dim } : {}),
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

// ─── LoadingScreen ────────────────────────────────────────────────────────────
// Add/remove entries here to control how many geese run across.
// These are independent of gooseGroup — just use any imported image.
const loadingGeese = [
  { key: 'g1',  art: gooseOneArt },
  { key: 'g2',  art: gooseTwoArt },
  { key: 'g3',  art: gooseThreeArt },
  { key: 'g4',  art: gooseFourArt },
  { key: 'g5',  art: gooseFiveArt },
  { key: 'g6',  art: gooseSixArt },
  { key: 'g7',  art: gooseSevenArt },
  { key: 'g8',  art: gooseEightArt },
  { key: 'g9',  art: gooseNineArt },
  { key: 'g10', art: gooseTenArt },
  { key: 'g11', art: gooseElevenArt },
  { key: 'g12', art: gooseTwelveArt },
];

const STAGGER   = 0.28;  // seconds between each goose
const WALK_DUR  = 2.0;   // seconds for a single goose to cross
const lastStart = (loadingGeese.length - 1) * STAGGER;
const HONK_AT   = lastStart + WALK_DUR * 0.85; // just before last one exits
const DONE_AT   = lastStart + WALK_DUR + 0.4;

function LoadingScreen({ onDone }) {
  const [honk, setHonk] = useState(false);

  useEffect(() => {
    const audio = new Audio('/sounds/HONK.mp3');
    audio.volume = 0.8;

    const honkTimer = setTimeout(() => {
      setHonk(true);
      audio.play().catch(() => {});
    }, HONK_AT * 1000);

    const doneTimer = setTimeout(() => onDone(), DONE_AT * 1000);

    return () => {
      clearTimeout(honkTimer);
      clearTimeout(doneTimer);
      audio.pause();
    };
  }, [onDone]);

  return (
    <div className="loading-screen">
      <div className="loading-track">
        {loadingGeese.map((g, i) => (
          <div
            key={g.key}
            className="loading-goose"
            style={{ animationDelay: `${i * STAGGER}s` }}
          >
            <img src={g.art} alt="goose" className="loading-goose-art" draggable="false" />
          </div>
        ))}
      </div>
      <p className={`loading-honk ${honk ? 'visible' : ''}`}>HONK!</p>
    </div>
  );
}

// ─── Avatar options for sign-up ───────────────────────────────────────────────────
// Add more entries freely — these are independent of gooseGroup
const avatarOptions = [
  { id: 'a1',  art: gooseOneArt,    label: 'Goose 1' },
  { id: 'a2',  art: gooseTwoArt,    label: 'Goose 2' },
  { id: 'a3',  art: gooseThreeArt,  label: 'Goose 3' },
  { id: 'a4',  art: gooseFourArt,   label: 'Goose 4' },
  { id: 'a5',  art: gooseFiveArt,   label: 'Goose 5' },
  { id: 'a6',  art: gooseSixArt,    label: 'Goose 6' },
  { id: 'a7',  art: gooseSevenArt,  label: 'Goose 7' },
  { id: 'a8',  art: gooseEightArt,  label: 'Goose 8' },
  { id: 'a9',  art: gooseNineArt,   label: 'Goose 9' },
  { id: 'a10', art: gooseTenArt,    label: 'Goose 10' },
  { id: 'a11', art: gooseElevenArt, label: 'Goose 11' },
  { id: 'a12', art: gooseTwelveArt, label: 'Goose 12' },
];

const roleOptions = [
  { id: 'leader',       label: 'Leader',       emoji: '👑', desc: 'First to explore, leads the way' },
  { id: 'scout',        label: 'Scout',         emoji: '🔍', desc: 'Spots clues, runs ahead' },
  { id: 'snack_keeper', label: 'Snack Keeper',  emoji: '🥐', desc: 'Knows the best spots to eat' },
  { id: 'waddler',      label: 'Waddler',       emoji: '🪷', desc: 'Takes it slow, enjoys the view' },
];

// Placeholder flocks — replace with real Supabase data when ready
const flockOptions = [
  { id: 'flock_a', name: 'The Wanderers',   emoji: '🌍', desc: 'Exploring far and wide' },
  { id: 'flock_b', name: 'The Nest',         emoji: '🪹', desc: 'Home base crew' },
  { id: 'flock_c', name: 'The Honkers',      emoji: '📣', desc: 'Loud and proud' },
  { id: 'flock_d', name: 'The Snack Squad',  emoji: '🍔', desc: 'Always hungry, always happy' },
];

// ─── Auth helpers ────────────────────────────────────────────────────────────
// ─── Photo storage ───────────────────────────────────────────────────────────
const PHOTO_BUCKET = 'place-photos';
const SIGNED_URL_SECONDS = 60 * 60 * 24; // links stay valid for a day

const safeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);

// Uploads new photos for a place and records them in place_photos.
// Returns the photo objects with their storage path attached.
async function uploadPlacePhotos({ photos, flockId, placeId, userId }) {
  const uploaded = await Promise.all(
    photos.map(async (photo) => {
      const path = `${flockId}/${placeId}/${crypto.randomUUID()}-${safeFileName(photo.name)}`;
      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, photo.file, { contentType: photo.file.type });
      if (error) throw error;
      return { ...photo, path };
    })
  );

  if (uploaded.length > 0) {
    const { error } = await supabase.from('place_photos').insert(
      uploaded.map((p) => ({
        place_id: placeId,
        path: p.path,
        file_name: p.name,
        uploaded_by: userId,
      }))
    );
    if (error) throw error;
  }
  return uploaded;
}

// Supabase Auth needs an email, so usernames map to a fake one.
// "Confirm email" must be OFF in Supabase → Authentication → Providers → Email.
const EMAIL_DOMAIN = 'gaggle.local';
const usernameToEmail = (u) => `${u.trim().toLowerCase()}@${EMAIL_DOMAIN}`;

function validateUsername(u) {
  if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(u.trim()))
    return 'Username must be 3–20 characters: letters, numbers, _ . -';
  return null;
}

// Loads the signed-in person's profile row + flock (RLS only returns their own flock).
async function loadProfile(authId) {
  const { data: user, error } = await supabase
    .from('users').select('*').eq('auth_id', authId).single();
  if (error || !user) return null;

  let flock = null;
  if (user.flock_id) {
    const { data } = await supabase
      .from('flocks').select('*').eq('id', user.flock_id).single();
    flock = data;
  }

  return {
    user,
    avatar: avatarOptions.find((a) => a.id === user.avatar_id) || avatarOptions[0],
    role:   roleOptions.find((r) => r.id === user.role)        || roleOptions[0],
    flock,
  };
}

function validatePassword(pw) {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pw))
    return 'Password must include at least 1 special character.';
  return null;
}

// ─── SignInScreen ────────────────────────────────────────────────────────────
// step: 'signin' | 'signup_creds' | 'signup_avatar' | 'signup_role' | 'signup_flock'
function SignInScreen({ onSignIn }) {
  const [step, setStep]           = useState('signin');
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [pwError, setPwError]     = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading]     = useState(false);
  const [avatar, setAvatar]       = useState(null);
  const [role, setRole]           = useState(null);
  const [flocks, setFlocks]       = useState([]);
  const [flockLoading, setFlockLoading] = useState(false);

  // Fetch flock previews (name + member count + up to 4 avatars) via RPC,
  // since anonymous visitors can no longer read the users table directly.
  useEffect(() => {
    if (step !== 'signup_flock') return;
    setFlockLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc('flock_previews');
      if (error) setAuthError(error.message);
      setFlocks(data || []);
      setFlockLoading(false);
    })();
  }, [step]);

  // ── Sign in: Supabase Auth
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true); setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
      });
      if (error) {
        setAuthError('Wrong username or password.');
        setLoading(false); return;
      }
      const profile = await loadProfile(data.user.id);
      if (!profile) {
        setAuthError('Signed in, but no Gaggle profile is linked to this account.');
        await supabase.auth.signOut();
        setLoading(false); return;
      }
      onSignIn(profile);
    } catch (err) {
      setAuthError('Something went wrong. Try again.');
    }
    setLoading(false);
  };

  // ── Sign-up step 1: validate credentials
  const handleCredentialsNext = async (e) => {
    e.preventDefault();
    const uErr = validateUsername(username);
    if (uErr) { setPwError(uErr); return; }
    const err = validatePassword(password);
    if (err) { setPwError(err); return; }

    // Check username availability before going any further
    setLoading(true);
    const { data: available, error } = await supabase
      .rpc('username_available', { p_username: username.trim() });
    setLoading(false);

    if (error) { setPwError(error.message); return; }
    if (!available) {
      setPwError('That username is already taken — try a different one.');
      return;
    }

    setPwError('');
    setStep('signup_avatar');
  };

  // ── Sign-up step 4: create auth account + profile row, then enter app
  const handleFlockPick = async (flock) => {
    setLoading(true); setAuthError('');
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: usernameToEmail(username),
        password,
      });
      if (signUpError) {
        if (/registered/i.test(signUpError.message)) {
          throw new Error('That username is already taken. Go back and choose another.');
        }
        throw signUpError;
      }
      if (!authData.session) {
        throw new Error('Account created but not signed in — turn off "Confirm email" in Supabase Auth settings.');
      }

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          auth_id:   authData.user.id,
          username:  username.trim(),
          avatar_id: avatar?.id || 'a1',
          role:      role?.id   || 'waddler',
          flock_id:  flock.id,
        })
        .select().single();
      if (insertError) throw insertError;
      onSignIn({ user: newUser, avatar, role, flock });
    } catch (err) {
      setAuthError(err.message || 'Failed to create account.');
    }
    setLoading(false);
  };

  // ── Shared header geese
  const HeaderGeese = () => (
    <div className="signin-geese">
      {gooseGroup.map((goose) => (
        <div key={goose.name} className="signin-goose-wrap">
          <div className="signin-goose-avatar">
            <GooseIcon goose={goose} className="signin-goose-art" />
          </div>
        </div>
      ))}
    </div>
  );

  // ———————————————————————— SIGN IN
  if (step === 'signin') return (
    <div className="signin-screen">
      <div className="signin-card">
        <HeaderGeese />
        <h1 className="signin-title">The Gaggle</h1>
        <p className="signin-sub">Sign in to start your adventure</p>

        <form className="signin-form" onSubmit={handleSignIn}>
          <label className="signin-field">
            <span>Username</span>
            <input
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </label>

          <label className="signin-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {authError && <p className="signup-field-error">{authError}</p>}

          <button type="submit" className="signin-button" disabled={!username.trim() || !password || loading}>
            {loading ? 'Checking…' : "Let’s go 🪷"}
          </button>
        </form>

        <p className="signin-switch">
          Don’t have an account?{' '}
          <button
            type="button"
            className="signin-switch-btn"
            onClick={() => { setStep('signup_creds'); setPassword(''); setPwError(''); setAuthError(''); }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );

  // ———————————————————————— SIGN UP — STEP 1: credentials
  if (step === 'signup_creds') return (
    <div className="signin-screen">
      <div className="signin-card">
        <HeaderGeese />
        <p className="signup-step-label">Step 1 of 4</p>
        <h1 className="signin-title">Create account</h1>
        <p className="signin-sub">Pick a username and a strong password</p>

        <form className="signin-form" onSubmit={handleCredentialsNext}>
          <label className="signin-field">
            <span>Username</span>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </label>

          <label className="signin-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="At least 8 chars + 1 special character"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwError(''); }}
            />
            {pwError && <p className="signup-field-error">{pwError}</p>}
          </label>

          <button
            type="submit"
            className="signin-button"
            disabled={!username.trim() || password.length < 1 || loading}
          >
            {loading ? 'Checking…' : 'Next →'}
          </button>
        </form>

        <p className="signin-switch">
          Already have an account?{' '}
          <button type="button" className="signin-switch-btn" onClick={() => setStep('signin')}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );

  // ———————————————————————— SIGN UP — STEP 2: avatar
  if (step === 'signup_avatar') return (
    <div className="signin-screen">
      <div className="signin-card signin-card--wide">
        <HeaderGeese />
        <p className="signup-step-label">Step 2 of 4</p>
        <h1 className="signin-title">Pick your avatar</h1>
        <p className="signin-sub">Choose the goose that feels like you</p>

        <div className="avatar-picker">
          {avatarOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`avatar-option ${avatar?.id === opt.id ? 'selected' : ''}`}
              onClick={() => setAvatar(opt)}
            >
              <img src={opt.art} alt={opt.label} draggable="false" className="avatar-option-img" />
              <span className="avatar-option-label">{opt.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="signin-button"
          style={{ marginTop: '20px' }}
          disabled={!avatar}
          onClick={() => setStep('signup_role')}
        >
          Next →
        </button>
      </div>
    </div>
  );

  // ———————————————————————— SIGN UP — STEP 3: role
  if (step === 'signup_role') return (
    <div className="signin-screen">
      <div className="signin-card">
        <HeaderGeese />
        <p className="signup-step-label">Step 3 of 4</p>
        <h1 className="signin-title">Pick your role</h1>
        <p className="signin-sub">What kind of goose are you?</p>

        <div className="role-picker">
          {roleOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`role-option ${role?.id === opt.id ? 'selected' : ''}`}
              onClick={() => setRole(opt)}
            >
              <span className="role-option-emoji">{opt.emoji}</span>
              <div className="role-option-copy">
                <span className="role-option-label">{opt.label}</span>
                <span className="role-option-desc">{opt.desc}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="signin-button"
          style={{ marginTop: '16px' }}
          disabled={!role}
          onClick={() => setStep('signup_flock')}
        >
          Next →
        </button>
      </div>
    </div>
  );

  // ———————————————————————— SIGN UP — STEP 4: flock (live from DB)
  return (
    <div className="signin-screen">
      <div className="signin-card">
        <HeaderGeese />
        <p className="signup-step-label">Step 4 of 4</p>
        <h1 className="signin-title">Join a flock</h1>
        <p className="signin-sub">Pick the crew you’re flying with</p>

        {authError && <p className="signup-field-error" style={{ marginBottom: 8 }}>{authError}</p>}

        {flockLoading ? (
          <p className="signin-sub" style={{ marginTop: 16 }}>Loading flocks…</p>
        ) : (
          <div className="flock-picker">
            {flocks.map((flock) => {
              const memberCount = flock.member_count || 0;
              const avatarIds   = flock.avatar_ids || [];
              return (
                <button
                  key={flock.id}
                  type="button"
                  className="flock-option"
                  disabled={loading}
                  onClick={() => handleFlockPick(flock)}
                >
                  <span className="flock-option-emoji">{flock.emoji}</span>
                  <div className="flock-option-copy">
                    <span className="flock-option-name">{flock.name}</span>
                    <span className="flock-option-desc">{flock.description}</span>
                    <span className="flock-option-members">
                      {memberCount === 0 ? 'No members yet'
                        : `${memberCount} member${memberCount === 1 ? '' : 's'}`}
                    </span>
                  </div>
                  {memberCount > 0 && (
                    <div className="flock-option-avatars">
                      {avatarIds.map((avatarId, i) => {
                        const av = avatarOptions.find((a) => a.id === avatarId) || avatarOptions[0];
                        return (
                          <div key={`${avatarId}-${i}`} className="flock-option-avatar">
                            <img src={av.art} alt="flock member" draggable="false" />
                          </div>
                        );
                      })}
                      {memberCount > 4 && (
                        <div className="flock-option-avatar flock-option-avatar--overflow">
                          +{memberCount - 4}
                        </div>
                      )}
                    </div>
                  )}
                  <span className="flock-option-arrow">›</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  // 'loading' → 'signin' → 'app'
  // Order: signin → loading → app
  // Loading plays AFTER sign-in so the browser autoplay policy is satisfied
  // 'checking' = looking for an existing Supabase session on page load
  const [appScreen, setAppScreen] = useState('checking');
  const [currentUser, setCurrentUser] = useState(null);
  const handleLoadingDone = useCallback(() => setAppScreen('app'), []);
  const handleSignIn = useCallback((userData) => {
    setCurrentUser(userData);
    setAppScreen('loading'); // play loading screen after sign-in click
  }, []);

  // Restore session on refresh so people stay signed in
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const profile = await loadProfile(data.session.user.id);
          if (profile) {
            setCurrentUser(profile);
            setAppScreen('app');
            return;
          }
        }
      } catch (err) {
        console.error('Session check failed:', err);
      }
      setAppScreen('signin');
    })();
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [dbMessage, setDbMessage] = useState('');
  const [deletingPlaceId, setDeletingPlaceId] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [flockMembers, setFlockMembers] = useState([]);

  // Build a display-ready flock list from DB users in the same flock.
  // Shape matches what the header dropdown expects: name, short, art, traits.
  const displayFlock = useMemo(() => {
    if (!currentUser) return [];

    // Build a points lookup from leaderboardRows (user_id -> total_points)
    const pointsById = {};
    leaderboardRows.forEach((entry) => {
      if (entry.user_id) pointsById[entry.user_id] = entry.total_points;
    });

    const fromDB = flockMembers.map((member) => {
      const av    = avatarOptions.find((a) => a.id === member.avatar_id) || avatarOptions[0];
      const ro    = roleOptions.find((r) => r.id === member.role) || roleOptions[0];
      const isMe  = member.id === currentUser.user?.id;
      const pts   = pointsById[member.id] ?? 0;
      return {
        name:  member.username,
        short: ro.label,
        emoji: '🪿',
        art:   av.art,
        traits: [
          `Role: ${ro.label}`,
          `${pts} point${pts === 1 ? '' : 's'}`,
          ...(isMe ? ['You'] : []),
        ],
        dbId: member.id,
      };
    });

    if (fromDB.length === 0 && currentUser.user) {
      const av  = currentUser.avatar || avatarOptions[0];
      const ro  = currentUser.role   || roleOptions[0];
      const pts = pointsById[currentUser.user.id] ?? 0;
      return [{
        name:  currentUser.user.username,
        short: ro.label,
        emoji: '🪿',
        art:   av.art,
        traits: [`Role: ${ro.label}`, `${pts} point${pts === 1 ? '' : 's'}`, 'You'],
        dbId:  currentUser.user.id,
      }];
    }

    return fromDB;
  }, [flockMembers, currentUser, leaderboardRows]);

  // Fetch all members of the current user's flock
  const fetchFlockMembers = useCallback(async () => {
    if (!currentUser?.flock?.id) return;
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_id, role')
      .eq('flock_id', currentUser.flock.id);
    if (!error && data) setFlockMembers(data);
  }, [currentUser]);

  // New users lookup: username -> user.id (for flock members)
  const userIdByName = useMemo(() => {
    const lookup = {};
    flockMembers.forEach((member) => {
      lookup[member.username] = member.id;
    });
    return lookup;
  }, [flockMembers]);

  // Reverse lookup: user.id -> username
  const usernameById = useMemo(() => {
    const lookup = {};
    flockMembers.forEach((member) => {
      lookup[member.id] = member.username;
    });
    return lookup;
  }, [flockMembers]);

  const handleMenuItemClick = (item) => {
    setActiveTab(item);
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setFlockMembers([]);
    setSavedPlaces([]);
    setLeaderboardRows([]);
    setSelectedPlace(null);
    setActiveTab('Home');
    setMenuOpen(false);
    setAppScreen('signin');
  };

  // All places for the current flock, with tagged people embedded.
  // RLS also enforces the flock scope server-side.
  const fetchSavedPlaces = async () => {
    if (!currentUser?.flock?.id) return;
    setPlacesLoading(true);

    const { data, error } = await supabase
      .from('places')
      .select('*, place_people(goose_id), place_photos(id, path, file_name)')
      .eq('flock_id', currentUser.flock.id)
      .order('created_at', { ascending: false });

    if (error) {
      setDbMessage(error.message);
      setPlacesLoading(false);
      return;
    }

    // One batch request for every photo's temporary link
    const allPaths = (data || []).flatMap((place) =>
      (place.place_photos || []).map((photo) => photo.path)
    );
    const urlByPath = {};
    if (allPaths.length > 0) {
      const { data: signed, error: signError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrls(allPaths, SIGNED_URL_SECONDS);
      if (signError) setDbMessage(signError.message);
      (signed || []).forEach((item) => {
        if (item.signedUrl) urlByPath[item.path] = item.signedUrl;
      });
    }

    const normalizedPlaces = (data || []).map((place) => ({
      id: `db-${place.id}`,
      dbId: place.id,
      createdAt: place.created_at,
      name: place.name || '',
      review: place.review || '',
      rating: place.rating || 0,
      relX: place.rel_x,
      relY: place.rel_y,
      pixelX: null,
      pixelY: null,
      relXPercent: place.rel_x != null ? `${(place.rel_x * 100).toFixed(1)}%` : '',
      relYPercent: place.rel_y != null ? `${(place.rel_y * 100).toFixed(1)}%` : '',
      people: (place.place_people || [])
        .map((row) => usernameById[row.goose_id])
        .filter(Boolean),
      photos: (place.place_photos || [])
        .sort((a, b) => a.id - b.id)
        .filter((photo) => urlByPath[photo.path])
        .map((photo) => ({
          id: `photo-${photo.id}`,
          name: photo.file_name || 'photo',
          path: photo.path,
          url: urlByPath[photo.path],
        })),
      fileName: '',
      placeType: place.place_type || 'cafe',
    }));

    setSavedPlaces(normalizedPlaces);
    setPlacesLoading(false);
  };

  const fetchLeaderboard = async () => {
    if (!currentUser?.flock?.id) return;
    setLeaderboardLoading(true);

    const { data, error } = await supabase
      .from('flock_leaderboard')
      .select('*')
      .eq('flock_id', currentUser.flock.id)
      .order('total_points', { ascending: false })
      .order('places_visited', { ascending: false });

    if (error) setDbMessage(error.message);
    else setLeaderboardRows(data || []);

    setLeaderboardLoading(false);
  };

  // Runs whenever currentUser is set (sign-in or restored session)
  useEffect(() => {
    fetchFlockMembers();
    fetchLeaderboard();
  }, [fetchFlockMembers]);

  // Load places once flock members are known so names resolve
  useEffect(() => {
    if (flockMembers.length > 0) fetchSavedPlaces();
  }, [flockMembers]);

  const handleSavePlace = async (placeData) => {
    try {
      setDbMessage('');
      const creatorId = currentUser?.user?.id;
      const flockId   = currentUser?.flock?.id;
      if (!creatorId || !flockId) throw new Error('You need to be signed in to a flock to save places.');

      const { data: insertedPlace, error: placeError } = await supabase
        .from('places')
        .insert({
          name: placeData.name || 'Untitled place',
          review: placeData.review || '',
          rating: placeData.rating || 0,
          rel_x: placeData.relX,
          rel_y: placeData.relY,
          photo_count: placeData.photos?.length || 0,
          place_type: placeData.placeType || 'cafe',
          created_by_goose_id: creatorId,
          flock_id: flockId,
        })
        .select()
        .single();

      if (placeError) throw placeError;

      // Tagged flockmates + always the creator (so they get points)
      const taggedIds = new Set(
        (placeData.people || []).map((name) => userIdByName[name]).filter(Boolean)
      );
      taggedIds.add(creatorId);

      const taggedRows = Array.from(taggedIds)
        .map((id) => ({ place_id: insertedPlace.id, goose_id: id }));

      const { error: peopleError } = await supabase.from('place_people').insert(taggedRows);
      if (peopleError) throw peopleError;

      // Upload photos. If this fails the place is still saved — just warn.
      let savedPhotos = placeData.photos || [];
      try {
        savedPhotos = await uploadPlacePhotos({
          photos: savedPhotos,
          flockId,
          placeId: insertedPlace.id,
          userId: creatorId,
        });
      } catch (photoError) {
        setDbMessage(`Place saved, but photos failed to upload: ${photoError.message}`);
      }

      const creatorName = currentUser.user.username;
      const savedPlaceWithDbId = {
        ...placeData,
        id: `db-${insertedPlace.id}`,
        dbId: insertedPlace.id,
        createdAt: insertedPlace.created_at,
        photos: savedPhotos,
        people: placeData.people?.includes(creatorName)
          ? placeData.people
          : [...(placeData.people || []), creatorName],
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

  // Called from PlaceDetailPanel when the user edits and saves a review
  const handleUpdatePlace = async (updatedPlace) => {
    try {
      if (updatedPlace.dbId) {
        const { error } = await supabase
          .from('places')
          .update({ review: updatedPlace.review })
          .eq('id', updatedPlace.dbId);
        if (error) throw error;
      }

      setSavedPlaces((prev) =>
        prev.map((p) =>
          (p.dbId || p.id) === (updatedPlace.dbId || updatedPlace.id) ? updatedPlace : p
        )
      );

      setSelectedPlace(updatedPlace);
    } catch (error) {
      setDbMessage(error.message || 'Failed to update review.');
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
        // Storage files aren't removed by the DB cascade — delete them first
        const paths = (place.photos || []).map((p) => p.path).filter(Boolean);
        if (paths.length > 0) {
          const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
          if (storageError) throw storageError;
        }

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

    // Check if the query matches a place type label or value
    const typeMatch = placeTypeOptions.find(
      (opt) => opt.label.toLowerCase().includes(query) || opt.value.toLowerCase().includes(query)
    );

    if (typeMatch) {
      // Filter the map to only show that type
      setTypeFilter(typeMatch.value);
      setSelectedPlace(null);
      setDbMessage('');
      setActiveTab('Map');
      setMenuOpen(false);
      setSearchText('');
      return;
    }

    // Otherwise find the first matching place by name / review / people
    setTypeFilter(null);
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

  if (appScreen === 'checking') return null;
  if (appScreen === 'loading') return <LoadingScreen onDone={handleLoadingDone} />;
  if (appScreen === 'signin') return <SignInScreen onSignIn={handleSignIn} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="gaggle-hover-card">
          <div className="avatar-row" aria-label="Gaggle members">
            {displayFlock.map((goose) => (
              <div key={goose.name} className="avatar-chip" title={goose.name}>
                <div className="avatar-icon-box">
                  <GooseIcon goose={goose} className="avatar-icon-art" />
                </div>
              </div>
            ))}
          </div>

          <div className="gaggle-dropdown">
            <p className="gaggle-title">
              {currentUser?.flock ? currentUser.flock.name : 'The gaggle'}
            </p>
            {displayFlock.map((goose) => (
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
                  {goose.traits.filter(Boolean).map((trait) => (
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
              <button type="button" className="dropdown-item" onClick={handleSignOut}>
                Sign out
              </button>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <PlaceTypeIcon placeType={place.placeType} size={50} />
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
                onUpdatePlace={handleUpdatePlace}
                focusedPlace={selectedPlace}
                onFocusPlace={handleFocusPlace}
                savedPlaces={typeFilter ? savedPlaces.filter((p) => p.placeType === typeFilter) : savedPlaces}
                typeFilter={typeFilter}
                onClearFilter={() => setTypeFilter(null)}
                flockMembers={displayFlock}
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
                  // entry may come from flock_leaderboard (has username + user_id)
                  // or old goose_leaderboard (has name)
                  const displayName = entry.username || uiGooseNameMap[entry.name] || entry.name;

                  // Try to match by dbId first, then by name
                  const member = displayFlock.find((m) => m.dbId === entry.user_id)
                    || displayFlock.find((m) => m.name === displayName);

                  // Build a minimal goose-shaped object for GooseIcon
                  const gooseShape = member || {
                    name: displayName,
                    art: (avatarOptions.find((a) => a.id === entry.avatar_id) || avatarOptions[0]).art,
                    emoji: '🪿',
                  };

                  return (
                    <article key={entry.user_id || entry.id || entry.name} className="place-placard" style={{ cursor: 'default' }}>
                      <div className="place-placard-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar-chip" style={{ marginLeft: 0 }}>
                            <div className="avatar-icon-box">
                              <GooseIcon goose={gooseShape} className="avatar-icon-art" />
                            </div>
                          </div>
                          <div>
                            <p className="place-placard-kicker">Rank #{index + 1}</p>
                            <h3 className="place-placard-title">{displayName}</h3>
                          </div>
                        </div>
                        <div className="place-placard-rating">{entry.total_points} pts</div>
                      </div>

                      <p className="place-placard-review">
                        {displayName} has visited {entry.places_visited} place{entry.places_visited === 1 ? '' : 's'} so far.
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
        ) : activeTab === 'Wrapped' ? (
          <section className="places-panel">
            <div className="places-header">
              <div>
                <p className="places-kicker">Your journey</p>
                <h2 className="places-title">Map Wrapped</h2>
              </div>
            </div>
            <MapWrapped savedPlaces={savedPlaces} />
          </section>
        ) : null}
      </main>
    </div>
  );
}

// ─── MapWrapped ────────────────────────────────────────────────────────────
function MapWrapped({ savedPlaces = [] }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 600, height: 480 });

  // Oldest → newest, so "Start" is the first place and "Latest" the newest
  const places = useMemo(
    () => savedPlaces
      .filter((p) => p.relX != null && p.relY != null)
      .sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''))),
    [savedPlaces]
  );

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const n = places.length;
        // Give more vertical room the more places there are
        const minH = Math.max(420, width * 0.62, n * 90);
        setDims({ width, height: minH });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [places.length]);

  if (places.length === 0) {
    return (
      <div className="wrapped-empty">
        <span className="wrapped-empty-icon">🗺️</span>
        <p className="wrapped-empty-text">No places saved yet — start exploring and your journey will appear here.</p>
      </div>
    );
  }

  const PAD  = 56;
  const LEG  = 28; // legend strip height
  const W    = dims.width  - PAD * 2;
  const H    = dims.height - PAD * 2;
  const TOTAL_H = dims.height + LEG;

  const cx = (relX) => PAD + relX * W;
  const cy = (relY) => PAD + relY * H;

  // Raw positions
  const rawPts = places.map((p) => ({ x: cx(p.relX), y: cy(p.relY) }));

  // Force-spread: push every pair of points apart until MIN_DIST is satisfied.
  // Use a strong repulsion multiplier so clusters really separate.
  const MIN_DIST = 110; // px — increase this to spread more
  const ITER     = 200;
  const pts      = rawPts.map((p) => ({ ...p }));

  for (let iter = 0; iter < ITER; iter++) {
    let moved = false;
    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        const dx   = pts[b].x - pts[a].x;
        const dy   = pts[b].y - pts[a].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        if (dist < MIN_DIST) {
          // Push each point the full gap — stronger than splitting half/half
          const gap = MIN_DIST - dist;
          const nx  = dx / dist;
          const ny  = dy / dist;
          pts[a].x -= nx * gap * 0.6;
          pts[a].y -= ny * gap * 0.6;
          pts[b].x += nx * gap * 0.6;
          pts[b].y += ny * gap * 0.6;
          moved = true;
        }
      }
    }
    // Soft clamp — bounce off edges so points don't pile at the border
    pts.forEach((p) => {
      if (p.x < PAD)        { p.x = PAD        + (PAD - p.x)        * 0.3; }
      if (p.x > PAD + W)    { p.x = PAD + W    - (p.x - PAD - W)   * 0.3; }
      if (p.y < PAD)        { p.y = PAD        + (PAD - p.y)        * 0.3; }
      if (p.y > PAD + H)    { p.y = PAD + H    - (p.y - PAD - H)   * 0.3; }
      // Hard clamp last
      p.x = Math.max(PAD, Math.min(PAD + W, p.x));
      p.y = Math.max(PAD, Math.min(PAD + H, p.y));
    });
    if (!moved) break;
  }

  // Smooth cubic bezier path
  const pathD = pts.length === 1 ? '' : pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cp1x = (prev.x + (p.x - prev.x) * 0.45).toFixed(1);
    const cp2x = (prev.x + (p.x - prev.x) * 0.55).toFixed(1);
    return `${acc} C ${cp1x} ${prev.y.toFixed(1)}, ${cp2x} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, '');

  // Breadcrumb positions along segments
  const CRUMB_SPACING = 32;
  const CRUMB_SIZE    = 100;
  const crumbs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i].x, ay = pts[i].y;
    const bx = pts[i+1].x, by = pts[i+1].y;
    const dist = Math.sqrt((bx-ax)**2 + (by-ay)**2);
    const steps = Math.floor(dist / CRUMB_SPACING);
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      crumbs.push({ x: ax + (bx-ax)*t, y: ay + (by-ay)*t });
    }
  }

  const getDot = (i, total) => {
    if (i === 0)         return { color: '#c89a7d', r: 12 };
    if (i === total - 1) return { color: '#f47a5c', r: 12 };
    return                      { color: '#9b8ec4', r: 8  };
  };

  return (
    <div className="wrapped-canvas" ref={containerRef} style={{ height: TOTAL_H }}>
      <svg width={dims.width} height={TOTAL_H} className="wrapped-svg">
        <defs>
          <linearGradient id="wtrail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#c89a7d" stopOpacity="1" />
            <stop offset="50%"  stopColor="#b07bc4" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f47a5c" stopOpacity="1" />
          </linearGradient>
          <filter id="wdrop">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(0,0,0,0.13)" />
          </filter>
          <filter id="wglow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Dot grid background */}
        {Array.from({ length: Math.ceil(dims.height / 30) + 1 }).map((_, row) =>
          Array.from({ length: Math.ceil(dims.width / 30) + 1 }).map((_, col) => (
            <circle key={`g${row}-${col}`} cx={col*30} cy={row*30} r={1.3} fill="rgba(176,123,100,0.09)" />
          ))
        )}

        {/* Glow halo behind trail */}
        {pathD && (
          <path d={pathD} fill="none" stroke="url(#wtrail)"
            strokeWidth="14" strokeLinecap="round" opacity="0.13" />
        )}

        {/* Main dashed trail */}
        {pathD && (
          <path d={pathD} fill="none" stroke="url(#wtrail)"
            strokeWidth="2.5" strokeLinecap="round" strokeDasharray="9 6" opacity="0.9" />
        )}

        {/* Breadcrumb images */}
        {crumbs.map((c, i) => (
          <image key={i} href={breadcrumbArt}
            x={c.x - CRUMB_SIZE/2} y={c.y - CRUMB_SIZE/2}
            width={CRUMB_SIZE} height={CRUMB_SIZE} opacity="0.72" />
        ))}

        {/* Stops */}
        {places.map((place, i) => {
          // Use the spread-out position so dots line up with the trail
          const x   = pts[i].x;
          const y   = pts[i].y;
          const dt  = getDot(i, places.length);
          const art = (placeTypeOptions.find((o) => o.value === place.placeType) || placeTypeOptions[0]).art;
          const raw = place.name || 'Untitled';
          const lbl = raw.length > 16 ? raw.slice(0, 15) + '…' : raw;
          const lblW = Math.max(lbl.length * 6.6 + 16, 40);

          return (
            <g key={place.dbId || place.id} filter="url(#wdrop)">
              {/* Animated pulse on latest */}
              {i === places.length - 1 && (
                <circle cx={x} cy={y} r={dt.r + 8} fill={dt.color} opacity="0.14">
                  <animate attributeName="r" values={`${dt.r+4};${dt.r+18};${dt.r+4}`} dur="2.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.2;0.04;0.2" dur="2.6s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Halo */}
              <circle cx={x} cy={y} r={dt.r + 7} fill={dt.color} opacity="0.14" />
              {/* White ring */}
              <circle cx={x} cy={y} r={dt.r + 3} fill="white" />
              {/* Filled dot */}
              <circle cx={x} cy={y} r={dt.r} fill={dt.color} />
              {/* Stop number */}
              <text x={x} y={y + 4} textAnchor="middle"
                fontSize="9" fontWeight="800" fill="white" fontFamily="Inter, sans-serif">
                {i + 1}
              </text>

              {/* Type icon */}
              <image href={art} x={x-12} y={y - dt.r - 32} width={24} height={24} />

              {/* Label pill */}
              <rect x={x - lblW/2} y={y + dt.r + 5} width={lblW} height={17}
                rx={8.5} fill="rgba(255,252,250,0.95)"
                stroke="rgba(200,154,125,0.28)" strokeWidth="1" />
              <text x={x} y={y + dt.r + 16} textAnchor="middle"
                fontSize="10" fontWeight="600" fill="#6d5347" fontFamily="Inter, sans-serif">
                {lbl}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${PAD}, ${dims.height + 10})`}>
          <circle cx={6} cy={6} r={6} fill="#c89a7d" />
          <text x={16} y={10} fontSize="10" fill="#9b7d70" fontFamily="Inter, sans-serif" fontWeight="600">Start</text>
          <circle cx={68} cy={6} r={6} fill="#f47a5c" />
          <text x={78} y={10} fontSize="10" fill="#9b7d70" fontFamily="Inter, sans-serif" fontWeight="600">Latest</text>
          <circle cx={134} cy={6} r={6} fill="#9b8ec4" />
          <text x={144} y={10} fontSize="10" fill="#9b7d70" fontFamily="Inter, sans-serif" fontWeight="600">Stop</text>
          <text x={W} y={10} fontSize="10" fill="#b08979" fontFamily="Inter, sans-serif" textAnchor="end">
            {places.length} place{places.length === 1 ? '' : 's'} visited
          </text>
        </g>
      </svg>
    </div>
  );
}
// ─── Place detail left-panel ──────────────────────────────────────────────────
function PlaceDetailPanel({ place, onClose, onUpdatePlace, flockMembers = [] }) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [editingReview, setEditingReview] = useState(false);
  const [reviewDraft, setReviewDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGalleryIndex(0);
    setEditingReview(false);
    setReviewDraft('');
  }, [place?.dbId, place?.id]);

  if (!place) return null;

  const match = placeTypeOptions.find((item) => item.value === place.placeType) || placeTypeOptions[0];
  const activePhoto = place.photos?.length > 0
    ? place.photos[Math.min(galleryIndex, place.photos.length - 1)]
    : null;

  const handleStartEdit = () => {
    setReviewDraft('');
    setEditingReview(true);
  };

  const handleSaveReview = async () => {
    if (!reviewDraft.trim()) return;
    setSaving(true);
    const existing = place.review || '';
    const appended = existing
      ? `${existing}\n---\n${reviewDraft.trim()}`
      : reviewDraft.trim();
    await onUpdatePlace({ ...place, review: appended });
    setSaving(false);
    setEditingReview(false);
    setReviewDraft('');
  };

  return (
    <aside
      className="place-detail-sidebar open"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="entry-panel-inner">
        <div className="entry-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlaceTypeIcon placeType={place.placeType} size={40} />
            <div>
              <p className="entry-kicker">{match.label}</p>
              <h3 className="entry-title">{place.name || 'Untitled place'}</h3>
            </div>
          </div>
          <button type="button" className="entry-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="entry-scroll-body">
          {activePhoto && (
            <div className="detail-gallery">
              <img
                src={activePhoto.url}
                alt={activePhoto.name}
                className="detail-gallery-main"
                draggable="false"
              />
              {place.photos.length > 1 && (
                <div className="map-popup-thumb-row" style={{ padding: '6px 0 0' }}>
                  {place.photos.map((photo, index) => (
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
          )}

          <div className="detail-meta-row">
            <div className="detail-meta-chip detail-meta-chip--rating">
              {place.rating ? `${place.rating} / 5` : 'No rating'}
            </div>
            {place.people?.length > 0 && (
              <div className="detail-people-row">
                {place.people.map((personName) => {
                  const member = flockMembers.find((g) => g.name === personName);
                  if (!member) return null;
                  return (
                    <div key={personName} className="map-popup-person-chip" title={personName}>
                      <div className="map-popup-person-avatar">
                        <img src={member.art} alt={member.name} draggable="false" className="map-popup-person-art" />
                      </div>
                      <span className="map-popup-person-name">{personName}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Review section — append new entries */}
          <div className="detail-review-block">
            <div className="detail-review-header">
              <p className="detail-review-label">Reviews</p>
              {!editingReview && (
                <button
                  type="button"
                  className="detail-review-edit-btn"
                  onClick={handleStartEdit}
                >
                  + Add review
                </button>
              )}
            </div>

            {/* Existing review entries displayed as a list */}
            {place.review ? (
              <div className="detail-review-entries">
                {place.review.split('\n---\n').map((entry, i) => (
                  <p key={i} className="detail-review-text detail-review-entry">
                    {entry}
                  </p>
                ))}
              </div>
            ) : (
              !editingReview && (
                <p className="detail-review-text" style={{ color: '#b09a90' }}>No reviews yet.</p>
              )
            )}

            {/* New review textarea — shown below existing entries */}
            {editingReview && (
              <>
                <textarea
                  className="detail-review-textarea"
                  rows={4}
                  value={reviewDraft}
                  onChange={(e) => setReviewDraft(e.target.value)}
                  placeholder="Write your review…"
                  autoFocus
                />
                <div className="detail-review-actions">
                  <button
                    type="button"
                    className="detail-review-cancel-btn"
                    onClick={() => { setEditingReview(false); setReviewDraft(''); }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="detail-review-save-btn"
                    onClick={handleSaveReview}
                    disabled={saving || !reviewDraft.trim()}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}


// ─── ZoomableMap ──────────────────────────────────────────────────────────────
function ZoomableMap({ src, alt, onSavePlace, onUpdatePlace, focusedPlace, onFocusPlace, savedPlaces = [], typeFilter, onClearFilter, flockMembers = [] }) {
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
    return () => { revokePhotoUrls(formState.photos); };
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

  const stopDragging = () => { setDragging(false); };

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
    const rawOffsetX = rect.width * 0.5 - pointX;
    const rawOffsetY = rect.height * 0.42 - pointY;
    setScale(targetScale);
    setOffset(clampOffset(rawOffsetX, rawOffsetY, targetScale));
  };

  useEffect(() => {
    const frame1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPin(null);
        setGalleryIndex(0);
        if (focusedPlace) {
          focusPlaceInView(focusedPlace);
        } else {
          resetView();
        }
      });
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
      relX, relY,
      pixelX: Math.round(relX * baseW),
      pixelY: Math.round(relY * baseH),
      name: '', review: '', people: [], rating: 0, photos: [],
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
      name: file.name, file, url: URL.createObjectURL(file),
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
      relX: pin.relX, relY: pin.relY,
      pixelX: pin.pixelX, pixelY: pin.pixelY,
      relXPercent: `${(pin.relX * 100).toFixed(1)}%`,
      relYPercent: `${(pin.relY * 100).toFixed(1)}%`,
      name: formState.name,
      review: formState.review,
      people: formState.people,
      rating: formState.rating,
      photos: formState.photos,
      fileName: formState.photos.length > 0 ? formState.photos.map((p) => p.name).join(', ') : '',
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
    return { left: `${point.x}px`, top: `${point.y}px` };
  };

  const getPopupStyle = (targetPin) => {
    const point = getScreenPoint(targetPin);
    if (!point || !containerRef.current) return {};
    const container = containerRef.current.getBoundingClientRect();
    const popupWidth = Math.min(220, container.width * 0.55);
    const gap = 14;
    let left = point.x + gap;
    if (left + popupWidth > container.width - 12) left = point.x - popupWidth - gap;
    left = Math.max(12, Math.min(left, container.width - popupWidth - 12));
    let top = point.y - 110;
    top = Math.max(12, Math.min(top, container.height - 140));
    return { left: `${left}px`, top: `${top}px`, width: `${popupWidth}px` };
  };

  const draftPinStyle   = useMemo(() => getPinStyle(pin),          [pin, scale, offset]);
  const savedPopupStyle = useMemo(() => getPopupStyle(displayPlace),[displayPlace, scale, offset]);

  const detailOpen = Boolean(displayPlace);

  return (
    <div className={`map-layout ${panelOpen || detailOpen ? 'panel-open' : ''}`}>
      {detailOpen && !panelOpen && (
        <PlaceDetailPanel
          place={displayPlace}
          onClose={handleCloseFocusedPlace}
          onUpdatePlace={onUpdatePlace}
          flockMembers={flockMembers}
        />
      )}

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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
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
                        border: selected ? '2px solid rgba(126, 92, 255, 0.55)' : '1px solid rgba(255,255,255,0.18)',
                        background: selected ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.08)',
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
                        style={{ width: '48px', height: '48px', objectFit: 'contain', display: 'block' }}
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
                {flockMembers.map((goose) => {
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
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesChange} />
              {formState.photos.length > 0 && (
                <div className="entry-photo-strip">
                  {formState.photos.map((photo) => (
                    <img key={photo.id} src={photo.url} alt={photo.name} className="entry-photo-thumb" draggable="false" />
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

          {/* All saved place icons */}
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
                  transform: isSelected ? 'translate(-50%, -100%) scale(1.08)' : 'translate(-50%, -100%)',
                  padding: 0, border: 'none', background: 'transparent', boxShadow: 'none',
                  display: 'grid', placeItems: 'center',
                  zIndex: isSelected ? 4 : 2,
                }}
                onClick={(e) => { e.stopPropagation(); if (onFocusPlace) onFocusPlace(place); }}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label={`Open ${place.name || 'saved place'}`}
                title={place.name || 'Saved place'}
              >
                <PlaceTypeIcon placeType={place.placeType} className="map-place-icon" />
              </button>
            );
          })}

          {/* Small popup bubble anchored to the selected icon */}
          {displayPlace && savedPopupStyle?.left && savedPopupStyle?.top && (
            <div
              className="map-place-popup"
              style={savedPopupStyle}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="map-place-popup-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PlaceTypeIcon placeType={displayPlace.placeType} size={28} />
                  <div>
                    <p className="map-place-popup-kicker">
                      {placeTypeOptions.find((o) => o.value === displayPlace.placeType)?.label ?? 'Place'}
                    </p>
                    <h4>{displayPlace.name || 'Untitled place'}</h4>
                  </div>
                </div>
                <button
                  type="button"
                  className="map-place-popup-close"
                  onClick={handleCloseFocusedPlace}
                  aria-label="Close popup"
                >
                  ×
                </button>
              </div>

              <div className="map-place-popup-meta">
                <span>{displayPlace.rating ? `${displayPlace.rating}/5` : 'No rating'}</span>
              </div>

              {displayPlace.people?.length > 0 && (
                <div className="map-popup-people-row">
                  {displayPlace.people.map((personUiName) => {
                    const goose = flockMembers.find((g) => g.name === personUiName);
                    if (!goose) return null;
                    return (
                      <div key={personUiName} className="map-popup-person-chip" title={personUiName}>
                        <div className="map-popup-person-avatar">
                          <GooseIcon goose={goose} className="map-popup-person-art" />
                        </div>
                        <span className="map-popup-person-name">{personUiName}</span>
                      </div>
                    );
                  })}
                </div>
              )}


            </div>
          )}

          {/* Draft pin icon */}
          {pin && draftPinStyle?.left && draftPinStyle?.top && (
            <div
              style={{
                ...draftPinStyle,
                position: 'absolute',
                transform: 'translate(-50%, -100%)',
                padding: 0, border: 'none', background: 'transparent', boxShadow: 'none',
                display: 'grid', placeItems: 'center', zIndex: 5,
              }}
            >
              <PlaceTypeIcon placeType={formState.placeType} className="map-place-icon" />
            </div>
          )}

          {typeFilter && (
            <div className="map-filter-badge">
              <PlaceTypeIcon placeType={typeFilter} size={20} />
              <span>{placeTypeOptions.find((o) => o.value === typeFilter)?.label}</span>
              <button
                type="button"
                className="map-filter-clear"
                onClick={(e) => { e.stopPropagation(); onClearFilter(); }}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Clear filter"
              >
                ×
              </button>
            </div>
          )}

          

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