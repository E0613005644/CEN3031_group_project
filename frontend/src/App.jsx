import { useState } from 'react';
import './App.css';

function App() {
  /*This is to store the information a user enters */
  const [formData, setFormData] = useState({
    teamId: '',
    firstName: '',
    lastName: '',
    role: ''
  });

  /*This is to store the submission message after the form is submitted */
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Identity verification failed. Please try again.');
      }

      if (!result.valid || !result.user) {
        setErrorMessage('We could not verify those details. Check your information and try again.');
        return;
      }

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

          <section className="calendar-panel" aria-labelledby="calendar-heading">
            <div className="calendar-panel-header">
              <div>
                <p className="dashboard-eyebrow">YOUR TEAM</p>
                <h2 id="calendar-heading">Team calendar</h2>
                <p>Team events and schedule will be available here.</p>
              </div>
              <span className="calendar-status">Coming soon</span>
            </div>

            <div className="calendar-placeholder" aria-hidden="true">
              <div className="calendar-placeholder-toolbar">
                <span className="placeholder-control" />
                <span className="placeholder-month" />
                <span className="placeholder-control" />
              </div>
              <div className="calendar-weekdays">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="calendar-grid">
                {Array.from({ length: 35 }, (_, index) => (
                  <div className="calendar-day" key={index}>
                    <span />
                    {index % 8 === 2 && <i />}
                    {index % 11 === 5 && <i />}
                  </div>
                ))}
              </div>
            </div>
            <p className="calendar-note">
              This space is ready for your team’s practices, games, and events.
            </p>
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
