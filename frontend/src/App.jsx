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
  const[submissionMessage, setSubmissionMessage] = useState('');

  function handleInputChange(event) {
    const { name, value } = event.target; /*Input that the user changed and its new value*/
    /*handles updating all the fields, without by accidentally deleting any already inputted information*/
    setFormData({
      ...formData,
      [name]: value
    });
    /*clears any previous submission message when the user changes input*/
    setSubmissionMessage('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    console.log('Submitted registration information:', formData);
    setSubmissionMessage('Form submitted successfully! Backend verification will be connected next.');
  }

  return (
    <main className = "registration-page">
      <section className = "registration-card">
        <header className = "registration-header">
          <p className = "team-label">Jacksonville Jaguars</p>
          <h1>Welcome to JagsSync</h1>
          <p>Enter your organization information to verify your identity</p>
        </header>
        <form className = "registration-form" onSubmit={handleSubmit}>
          <div className = "form-field">
            <label htmlFor = "teamId">Team ID</label>
            <input 
              id = "teamId"
              name = "teamId"
              type = "text"
              value={formData.teamId}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className = "name-fields">
            <div className = "form-field">
              <label htmlFor = "firstName">First name</label>
              <input 
                id = "firstName"
                name = "firstName"
                type = "text"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className = "form-field">
              <label htmlFor = "lastName">Last name</label>
              <input 
                id = "lastName"
                name = "lastName"
                type = "text"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            </div>
            <div className = "form-field">
              <label htmlFor="role">Role</label>
              <select id="role" name="role" value={formData.role} onChange={handleInputChange} required>
                <option value="" disabled>Select your role</option>
                <option value = "player">Player</option>
                <option value = "coach">Coach</option>
              </select>
            </div>
            <button type = "submit">Verify Identity</button>
            {submissionMessage && (<p className="submission-message" role="status">{submissionMessage}</p>)}
        </form>
        <p className = "privacy-note">
          Access is limited to the authorized members of the Jacksonville Jaguars organization.
        </p>
      </section>
    </main>
  )
}

export default App