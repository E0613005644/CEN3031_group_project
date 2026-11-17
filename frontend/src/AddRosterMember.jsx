import { useState } from 'react';
import './AddRosterMember.css';

function AddRosterMember({user}) {
    const [isOpen, setIsOpen] = useState(false); //determines whether the form is visible
    const [formData, setFormData] = useState({
        newTeamId: '',
        newFirstName: '',
        newLastName: '',
        newRole: 'player',
        newPosition: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false); //prevents duplicate submissions
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    //input handler
    function handleInputChange(event) {
        const { name, value } = event.target;
        setFormData((currentFormData) => ({
            ...currentFormData,
            [name]: value,
        }));
        setError('');
        setSuccessMessage('');
    }

    //form submission handler
    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch('/api/roster', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamId: user.teamId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    ...formData
                })
        });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Roster member could not be added');
            }
            setSuccessMessage(`${result.firstName} ${result.lastName} has been added to the roster.`);
            setFormData({
                newTeamId: '',
                newFirstName: '',
                newLastName: '',
                newRole: 'player',
                newPosition: '',
            });
        }
        catch (submissionError) {
            if(submissionError instanceof TypeError) {
                setError('Could not connect to the server. Please try again');
            }
            else {
                setError(submissionError.message);
            }
        }
        finally {
            setIsSubmitting(false);
        }        
    }

    //now doing component display
    if(!isOpen) { //only the button is displayed if the form is not open
        return  (
            <section className="roster-management">
                <button
                    type="button"
                    className="roster-toggle-button"
                    onClick={() => setIsOpen(true)}
                >
                    Add Roster Member
                </button>
                {successMessage && (<p className="roster-success" role="status">
                    {successMessage}
                </p>)}
            </section>
        );
    }
    return (
        <section className="roster-management roster-form-panel">
            <div className="roster-form-header">
                <div>
                    <p className="roster-form-eyebrow">Roster Management</p>
                    <h2>Add a New Roster Member</h2>
                </div>
                <button
                    type="button"
                    className="roster-close-button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close roster form"
                >
                    x
                </button>
            </div>
            <form className="roster-form" onSubmit={handleSubmit}>
                <label>
                    Team ID
                    <input
                        type="text"
                        name="newTeamId"
                        value={formData.newTeamId}
                        onChange={handleInputChange}
                        placeholder={
                            formData.newRole === 'player' ? 'JAX-P080' : 'JAX-C###'
                        }
                        maxLength="8"
                        required
                    />
                </label>
                <label>
                    Role
                    <select
                        name="newRole"
                        value={formData.newRole}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="player">Player</option>
                        <option value="coach">Coach</option>
                    </select>
                </label>
                <label>
                    First Name
                    <input
                        type="text"
                        name="newFirstName"
                        value={formData.newFirstName}
                        onChange={handleInputChange}
                        maxLength="50"
                        required
                    />
                </label>
                <label>
                    Last Name
                    <input
                        type="text"
                        name="newLastName"
                        value={formData.newLastName}
                        onChange={handleInputChange}
                        maxLength="100"
                        required
                    />
                </label>
                <label>
                    Position
                    <input
                        type="text"
                        name="newPosition"
                        value={formData.newPosition}
                        onChange={handleInputChange}
                        placeholder={
                            formData.newRole === 'player' ? 'Example: RB' : 'Example: Assistant Coach'    
                        }
                        maxLength="100"
                        required
                    />
                </label>
                {error && (<p className="roster-error" role="alert">{error}</p>)}
                {successMessage && (<p className="roster-success" role="status">{successMessage}</p>)}
                <div className="roster-form-actions">
                    <button
                        type="submit"
                        className="roster-submit-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Member'}
                    </button>
                    <button
                        type="button"
                        className="roster-cancel-button"
                        disabled={isSubmitting}
                        onClick={() => {
                            setIsOpen(false);
                            setError('');
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </section>
    );
}

export default AddRosterMember;