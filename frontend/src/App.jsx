import { useEffect , useState } from 'react';
import './App.css';
import TeamCalendar from './TeamCalendar';
import AddRosterMember from './AddRosterMember';

function getWeekBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

function formatEventTime(startValue, endValue) {
  const start = new Date(startValue);
  const timeOptions = { hour: 'numeric', minute: '2-digit' };
  const startTime = start.toLocaleTimeString('en-US', timeOptions);

  if (!endValue) {
    return startTime;
  }

  const endTime = new Date(endValue).toLocaleTimeString('en-US', timeOptions);
  return `${startTime} - ${endTime}`;
}

function WeeklyEvents({ refreshSignal }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    fetch('/api/events')
      .then(async (response) => {
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Could not load this week’s events. Make sure the backend API is running on port 5000.');
        }
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Could not load this week’s events.');
        }
        if (!Array.isArray(result)) {
          throw new Error('The events response was not in the expected format.');
        }
        return result;
      })
      .then((result) => {
        if (isMounted) {
          setEvents(result);
          setError('');
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError instanceof TypeError
            ? 'Could not connect to the server. Make sure the backend is running.'
            : loadError.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshSignal]);

  const { start: weekStart, end: weekEnd } = getWeekBounds();
  const weekEndInclusive = new Date(weekEnd);
  weekEndInclusive.setDate(weekEndInclusive.getDate() - 1);
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEndInclusive.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const weeklyEvents = events.filter((event) => {
    const startsAt = new Date(event.start);
    const endsAt = new Date(event.end || event.start);
    return !Number.isNaN(startsAt.getTime()) &&
      !Number.isNaN(endsAt.getTime()) &&
      startsAt < weekEnd &&
      endsAt > weekStart;
  });

  return (
    <section className="weekly-events" aria-labelledby="weekly-events-heading">
      <div className="weekly-events-header">
        <div>
          <p className="dashboard-eyebrow">THIS WEEK</p>
          <h2 id="weekly-events-heading">Team events</h2>
        </div>
        <span className="weekly-events-date-range">{weekLabel}</span>
      </div>

      {isLoading && <p className="weekly-events-message" role="status">Loading this week’s events…</p>}
      {!isLoading && error && <p className="weekly-events-error" role="alert">{error}</p>}
      {!isLoading && !error && weeklyEvents.length === 0 && (
        <p className="weekly-events-empty">No events scheduled this week.</p>
      )}
      {!isLoading && !error && weeklyEvents.length > 0 && (
        <ul className="weekly-events-list">
          {weeklyEvents.map((event) => (
            <li className="weekly-event-card" key={event.id}>
              <time className="weekly-event-date" dateTime={event.start}>
                {new Date(event.start).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </time>
              <div className="weekly-event-details">
                <h3>{event.title}</h3>
                <p>{formatEventTime(event.start, event.end)}</p>
                {event.description && <p className="weekly-event-description">{event.description}</p>}
              </div>
              <span className="weekly-event-type">
                {event.eventType || 'Team event'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/*checks whether the tab has a saved user*/
function getSavedUser() {
  const savedUser = sessionStorage.getItem('jagsSyncUser');
  if (!savedUser) {
    return null;
  }
  try {
    return JSON.parse(savedUser);
  } catch {
    sessionStorage.removeItem('jagsSyncUser');
    return null;
  }
}

function App() {
  /*This is to store the information a user enters */
  const [formData, setFormData] = useState({
    teamId: '',
    firstName: '',
    lastName: '',
    role: ''
  });

  /*This is to store the submission message after the form is submitted */
  const [user, setUser] = useState(getSavedUser); /*React will now not logout user after page refresh */
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weeklyEventsRefreshSignal, setWeeklyEventsRefreshSignal] = useState(0);

  function handleInputChange(event) {
    const { name, value } = event.target; /*Input that the user changed and its new value*/
    /*handles updating all the fields, without by accidentally deleting any already inputted information*/
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value
    }));
    /*clears any previous submission message when the user changes input*/
    setErrorMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/roster/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('The identity API is unavailable. Make sure the backend is running on port 5000.');
      }
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Identity verification failed. Please try again.');
      }

      if (!result.valid || !result.user) {
        setErrorMessage('We could not verify those details. Check your information and try again.');
        return;
      }

      sessionStorage.setItem('jagsSyncUser', JSON.stringify(result.user));
      setUser(result.user);
    } catch (error) {
      setErrorMessage(
        error instanceof TypeError
          ? 'Could not connect to the server. Make sure the backend is running and try again.'
          : error.message
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('jagsSyncUser');
    setUser(null);
    setFormData({ teamId: '', firstName: '', lastName: '', role: '' });
    setErrorMessage('');
  }

  if (user) {
    const roleLabel = user.role === 'coach' ? 'Coach' : 'Player';

    return (
      <main className="dashboard-page">
        <header className="dashboard-topbar">
          <a className="dashboard-brand" href="/" aria-label="JagsSync home">
            <img 
              src="https://thumb.wikimedia.org/wikipedia/en/thumb/7/74/Jacksonville_Jaguars_logo.svg/1280px-Jacksonville_Jaguars_logo.svg.png?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail" 
              alt="" className="brand-mark" 
            />
            <span>JagsSync</span>
          </a>
          <div className="dashboard-account">
            <div className="account-avatar" aria-hidden="true">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="account-details">
              <strong>{user.firstName} {user.lastName}</strong>
              <span>{roleLabel}{user.position ? ` · ${user.position}` : ''}</span>
            </div>
            <button className="logout-button" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <p className="dashboard-eyebrow">JACKSONVILLE JAGUARS · TEAM PORTAL</p>
            <h1>Good to see you, {user.firstName}.</h1>
            <p>Your team home base for schedules and updates.</p>
          </section>

          <section className = "calendar-panel" aria-labelledby = "calendar-heading"> 
            <div className = "calendar-panel-header">
              <div>
                <p className = "dashboard-eyebrow">YOUR TEAM</p>
                {/* <h1 id = "calendar-heading">Team calendar</h1>
                <p>View the current and upcoming team schedule.</p> */}
              </div>
              <span className = "calendar-status">{roleLabel}{user.position ? ` · ${user.position}` : ''}</span>
            </div>
            <WeeklyEvents refreshSignal={weeklyEventsRefreshSignal} />
            {user.role === 'coach' && (<AddRosterMember user={user} />)}
            <TeamCalendar user={user} onEventsUpdated={() => setWeeklyEventsRefreshSignal((current) => current + 1)}/>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="registration-page">
      <section className="registration-card">
        <header className="registration-header">
          <p className="team-label">Jacksonville Jaguars</p>
          <h1>Welcome to JagsSync</h1>
          <p>Enter your organization information to verify your identity</p>
        </header>
        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="teamId">Team ID</label>
            <input
              id="teamId"
              name="teamId"
              type="text"
              autoComplete="username"
              value={formData.teamId}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="name-fields">
            <div className="form-field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
            >
              <option value="" disabled>Select your role</option>
              <option value="player">Player</option>
              <option value="coach">Coach</option>
            </select>
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Verify Identity'}
          </button>
          {errorMessage && (
            <p className="error-message" role="alert">{errorMessage}</p>
          )}
        </form>
        <p className="privacy-note">
          Access is limited to the authorized members of the Jacksonville Jaguars organization.
        </p>
      </section>
    </main>
  );
}

export default App;
