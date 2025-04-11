import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

import Select from 'react-select';
import './App.css';


<head>
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
    rel="stylesheet"
  />
</head>


const defaultUniversities = [
  {
    name: 'Harvard University',
    gpa: 3.9, ap: 8, sat: 1500, volunteer: 100, extras: 3, awards: 3,
    majors: ['Computer Science', 'Business', 'Biology'],
    state: 'MA',
    acceptanceRate: 0.04,
    info: 'Elite private university in Cambridge, MA.'
  },
  {
    name: 'UCLA',
    gpa: 3.7, ap: 5, sat: 1350, volunteer: 50, extras: 2, awards: 2,
    majors: ['Engineering', 'Arts', 'Psychology'],
    state: 'CA',
    acceptanceRate: 0.11,
    info: 'Public university known for research and diverse programs.'
  },
  {
    name: 'University of Florida',
    gpa: 3.3, ap: 2, sat: 1200, volunteer: 20, extras: 1, awards: 1,
    majors: ['Business', 'Nursing', 'Engineering'],
    state: 'FL',
    acceptanceRate: 0.30,
    info: 'Top public school in Gainesville, FL with strong academics.'
  },
];

const majors = [...new Set(defaultUniversities.flatMap(u => u.majors))];
const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
  "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const stateAbbreviations = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
  "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
  "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
  "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA",
  "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI",
  "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT",
  "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA",
  "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
  "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
  "Wisconsin": "WI", "Wyoming": "WY"
};


const tiers = ['Reach', 'Match', 'Safety', 'Good Fit'];

function App() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState({ name: '', year: '', states: [] });
  const [form, setForm] = useState({
    major: '', gpa: '', ap: '', sat: '', volunteer: '', extras: '', awards: ''
  });
  const [weights, setWeights] = useState({
    gpa: 1, ap: 1, sat: 1, volunteer: 1, extras: 1, awards: 1
  });
  const [matches, setMatches] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [customUnis, setCustomUnis] = useState([]);
  const [memeMode, setMemeMode] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState([]);
  const [selectedMajors, setSelectedMajors] = useState([]);
  const [profileStrength, setProfileStrength] = useState(0);
  const majorOptions = majors.map(m => ({ value: m, label: m }));

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    calculateStrength();
  }, [form]);

  useEffect(() => {
    fetch('/api/universities')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch universities');
        return res.json();
      })

      
      .then(data => {
        const formatted = data.map(u => ({
          name: u.name,
          state: u.state,
          city: u.city,
          gpa: u.gpa,
          ap: u.ap,
          sat: u.sat,
          volunteer: u.volunteer,
          extras: u.extras,
          awards: u.awards,
          majors: u.majors,
          acceptanceRate: u.acceptanceRate,
          info: u.info
        }));
        setCustomUnis(formatted);
      })
      
  }, []);

  const handleWelcomeChange = e => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const toggleState = state => {
    setUser(prev => ({
      ...prev,
      states: prev.states.includes(state)
        ? prev.states.filter(s => s !== state)
        : [...prev.states, state]
    }));
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleWeightChange = e => {
    const { name, value } = e.target;
    setWeights(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed = result.data.map(u => ({
          ...u,
          gpa: parseFloat(u.gpa),
          ap: parseInt(u.ap),
          sat: parseInt(u.sat),
          volunteer: parseInt(u.volunteer),
          extras: parseInt(u.extras),
          awards: parseInt(u.awards),
          acceptanceRate: parseFloat(u.acceptanceRate),
          majors: u.majors.split(',').map(m => m.trim()),
        }));
        setCustomUnis(parsed);
      }
    });
  };

  const handleTierChange = (tier) => {
    setSelectedTiers(prev =>
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    );
  };

  const calculateStrength = () => {
    const gpa = parseFloat(form.gpa) || 0;
    const sat = parseInt(form.sat) || 0;
    const ap = parseInt(form.ap) || 0;
    const volunteer = parseInt(form.volunteer) || 0;
    const extras = parseInt(form.extras) || 0;
    const awards = parseInt(form.awards) || 0;

    const maxScore = 100 + 1600 + 10 + 200 + 5 + 5;
    const score = gpa * 25 + sat + ap * 10 + volunteer + extras * 10 + awards * 10;

    setProfileStrength(Math.min((score / maxScore) * 100, 100));
  };

  const handleSearch = () => {
    const student = {
      gpa: parseFloat(form.gpa),
      ap: parseInt(form.ap),
      sat: parseInt(form.sat),
      volunteer: parseInt(form.volunteer),
      extras: parseInt(form.extras),
      awards: parseInt(form.awards),
    };

    const allUnis = customUnis.length > 0 ? customUnis : defaultUniversities;

    console.log("Selected states:", user.states);
console.log("Mapped to abbreviations:", user.states.map(s => stateAbbreviations[s]));
console.log("University state:", allUnis.map(u => u.name + ' - ' + u.state));

    

    const results = allUnis
    


    .filter(u =>
      (selectedMajors.length === 0 || selectedMajors.some(m => u.majors.includes(m.value))) &&
      user.states.map(s => stateAbbreviations[s]).includes(u.state)

    )
    
      .map((uni, i) => {
        const scores = {
          gpa: Math.min(student.gpa / uni.gpa, 1),
          ap: Math.min(student.ap / uni.ap, 1),
          sat: Math.min(student.sat / uni.sat, 1),
          volunteer: Math.min(student.volunteer / uni.volunteer, 1),
          extras: Math.min(student.extras / uni.extras, 1),
          awards: Math.min(student.awards / uni.awards, 1),
        };

        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        const weightedScore =
          (scores.gpa * weights.gpa +
            scores.ap * weights.ap +
            scores.sat * weights.sat +
            scores.volunteer * weights.volunteer +
            scores.extras * weights.extras +
            scores.awards * weights.awards) / totalWeight;

        const percentile = weightedScore * 100;
        const acceptanceRate = uni.acceptanceRate;
        const admissionChance = Math.min(
          ((percentile / 100) * 70 + acceptanceRate * 100 * 30) / 100,
          100
        );

        let tier = 'Reach';
        if (percentile > 90) tier = 'Good Fit';
        else if (percentile > 75) tier = 'Match';
        else if (percentile > 50) tier = 'Safety';

        return {
          ...uni,
          id: i,
          percentile: percentile.toFixed(1),
          admissionChance: admissionChance.toFixed(1),
          tier
        };
      });

    setMatches(results);
  };

  const toggleFavorite = name => {
    setFavorites(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
  };

  if (step === 1) {
    return (
      <div className="app">
        <h1>🎓 Welcome to UniMatch</h1>
        <div className="form">
          <label>Name:
            <input name="name" value={user.name} onChange={handleWelcomeChange} />
          </label>

          <label>Year in High School:
            <select name="year" value={user.year} onChange={handleWelcomeChange}>
              <option value="">-- Select --</option>
              <option value="Freshman">Freshman</option>
              <option value="Sophomore">Sophomore</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
            </select>
          </label>

          <label>Preferred College States:</label>
          <div className="checkbox-list">
            {states.map(s => (
              <label key={s}>
                <input type="checkbox" checked={user.states.includes(s)} onChange={() => toggleState(s)} />
                {s}
              </label>
            ))}
          </div>

          <button onClick={() => setStep(2)}>Continue →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>🎯 Welcome, {user.name}!</h1>

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button onClick={() => setMemeMode(prev => !prev)}>
          {memeMode ? '🧠 Back to Serious Mode' : '🤣 Meme Mode'}
        </button>
      </div>

      <div className="form">
        <label>Select Majors:
          <Select isMulti options={majorOptions} value={selectedMajors} onChange={setSelectedMajors} />
        </label>

        <label>GPA: <input type="number" name="gpa" step="0.01" value={form.gpa} onChange={handleFormChange} /></label>
        <label>AP Classes: <input type="number" name="ap" value={form.ap} onChange={handleFormChange} /></label>
        <label>SAT Score: <input type="number" name="sat" value={form.sat} onChange={handleFormChange} /></label>
        <label>Volunteer Hours: <input type="number" name="volunteer" value={form.volunteer} onChange={handleFormChange} /></label>
        <label>Extracurriculars (0-5): <input type="number" name="extras" max="5" value={form.extras} onChange={handleFormChange} /></label>
        <label>Honors/Awards: <input type="number" name="awards" value={form.awards} onChange={handleFormChange} /></label>

        <div>
          <label>📊 Profile Strength:</label>
          <progress value={profileStrength} max="100" />
          <span> {profileStrength.toFixed(0)}%</span>
        </div>

        <h3>🎚️ Set Importance (1 = low, 5 = high)</h3>
        {Object.keys(weights).map(key => (
          <label key={key}>
            {key.toUpperCase()} Weight:
            <input
              type="range"
              name={key}
              min="1"
              max="5"
              value={weights[key]}
              onChange={handleWeightChange}
            />
            {weights[key]}
          </label>
        ))}

        <label>📂 Upload Universities (CSV):
          <input type="file" accept=".csv" onChange={handleFileUpload} />
        </label>

        <div>
          <h4>Filter by Tier:</h4>
          {tiers.map(tier => (
            <label key={tier}>
              <input type="checkbox" checked={selectedTiers.includes(tier)} onChange={() => handleTierChange(tier)} />
              {tier}
            </label>
          ))}
        </div>

        <button onClick={handleSearch}>🔍 Match Me</button>
      </div>

      <div className="results">
        <h2>Results for {user.name} ({user.year})</h2>
        {matches.length === 0 ? (
          <div>
            <p>No matches found. Try adjusting your filters or selecting alternative majors.</p>
            {majors.slice(0, 3).map((alt, i) => (
              <p key={i}>🎓 Suggestion: Try "{alt}" major</p>
            ))}
          </div>
        ) : (
          <ul>
  {matches
    .filter(u => selectedTiers.length === 0 || selectedTiers.includes(u.tier))
    .map((u, i) => (
      <li key={i}>
        <strong>{memeMode ? `🏫 Meme University #${i + 1}` : u.name}</strong><br />
        <em>{memeMode
          ? ['Certified Clown College', 'Ultra-Reach School', 'Gigachad Fit', 'Bozo Safety'][i % 4]
          : `${u.tier} (${u.percentile}% match)`}</em><br />

        <small>{memeMode ? '😎 Legendary vibes and zero homework.' : u.info}</small><br />

        {!memeMode && (
          <>
            <strong>📍 Location:</strong> {u.location || 'N/A'}<br />
            <strong>🏅 Rank:</strong> {u.rank || 'N/A'}<br />
            <strong>🎓 Avg. GPA:</strong> {u.averageGPA || (u.gpa ? u.gpa.toFixed(2) : 'N/A')}<br />
            <strong>📈 Acceptance Rate:</strong> {(u.acceptanceRate * 100).toFixed(1)}%<br />
            <strong>🎯 Admission Chance:</strong> {u.admissionChance}%<br />
          </>
        )}

        {!memeMode && (
          <button onClick={() => toggleFavorite(u.name)}>
            {favorites.includes(u.name) ? '★ Remove Favorite' : '☆ Add to Favorites'}
          </button>
        )}
      </li>
    ))}
</ul>

        )}
      </div>

      {!memeMode && (
        <div className="favorites">
          <h2>⭐ Favorites</h2>
          {favorites.length === 0 ? <p>No favorites yet</p> : (
            <ul>
              {favorites.map((name, i) => <li key={i}>{name}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
