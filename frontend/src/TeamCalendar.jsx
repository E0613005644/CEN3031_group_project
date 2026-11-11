import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react'; //imports the actual React calendar component
import dayGridPlugin from '@fullcalendar/react/daygrid';
import multiMonthPlugin from '@fullcalendar/react/multimonth'; //this imports the additional feature so that i can display multiple months
import interactionPlugin from '@fullcalendar/react/interaction';
import themePlugin from '@fullcalendar/react/themes/monarch';

import '@fullcalendar/react/skeleton.css'; //this is the basic structural styling
import '@fullcalendar/react/themes/monarch/theme.css';
import '@fullcalendar/react/themes/monarch/palettes/yellow.css'; //because yellow is unfortunately the closest to gold
import './TeamCalendar.css'; //this is our (hannah and i's) custom styling



//this function converts a JavaScript date object into a YYYY-MM-DD string used by the events
function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); //+1 because months are zero-indexed and the other part ensures the months are 2 digits
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

//receives a correctly formatted date and then searches through sample events and returns only events whose starting date matches
function getEventsForDate(events, dateKey) {
    return events.filter((event) => getDateKey(new Date(event.start)) === dateKey);
    //fixes glitch because it converts the timestamp into the browser's local time and then produces the correct local calendar date
}

function getEventCategoryClass(eventType) {
    return `event-category-${eventType}`;
}

function getWeekDates(startValue) {
    const date = new Date(startValue);
    if (Number.isNaN(date.getTime())) {
        return [];
    }
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - date.getDay());
    return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(date);
        day.setDate(date.getDate() + index);
        return day;
    });
}

//this one converts YYYY-MM-DD to a readable date for the popup
function formatSelectedDate(dateKey) {
    const date = new Date(`${dateKey}T00:00:00`);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatEventTime(event) {
    if(!event.start.includes('T')) {
        return 'All day';
    }
    const timeOptions = {
        hour: 'numeric',
        minute: '2-digit'
    };
    const startTime = new Date(event.start).toLocaleTimeString('en-US', timeOptions);
    if(!event.end) {
        return startTime;
    }
    const endTime = new Date(event.end).toLocaleTimeString('en-US', timeOptions);
    return `${startTime} - ${endTime}`;
}

function formatInputDateTime(value) {
    const date = new Date(value);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
}

async function readApiResponse(response, fallbackMessage) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        if (response.status === 404) {
            throw new Error('The running backend does not include the events API. Stop and restart the backend from the project backend folder.');
        }
        throw new Error(`${fallbackMessage} Make sure the backend API is running on port 5000.`);
    }

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || fallbackMessage);
    }
    return result;
}


function TeamCalendar({ user }) {
    const calendarRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [calendarError, setCalendarError] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [editingEventId, setEditingEventId] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);
    const [editError, setEditError] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [calendarView, setCalendarView] = useState('threeMonthSeason');
    const [endTimeEdited, setEndTimeEdited] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        eventType: 'practice',
        start: '',
        end: '',
        description: ''
    });

    function getEndTimeFourHoursLater(startValue) {
        const startDate = new Date(startValue);
        if (Number.isNaN(startDate.getTime())) {
            return '';
        }
        startDate.setHours(startDate.getHours() + 4);
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const hours = String(startDate.getHours()).padStart(2, '0');
        const minutes = String(startDate.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    useEffect(() => {
        let isMounted = true;
        fetch('/api/events')
            .then((response) => readApiResponse(response, 'Could not load team events.'))
            .then((result) => {
                if (isMounted) {
                    setEvents(result);
                    setCalendarError('');
                }
            })
            .catch((error) => {
                if (isMounted) {
                    setCalendarError(error instanceof TypeError
                        ? 'Could not connect to the server. Make sure the backend is running.'
                        : error.message);
                }
            });
        return () => {
            isMounted = false;
        };
    }, []);

    const selectedEvents = selectedDate ? getEventsForDate(events, selectedDate) : [];
    const previewWeek = getWeekDates(newEvent.start);
    const previewEvents = newEvent.start && newEvent.end
        ? [...events, {
            id: 'new-event-preview',
            title: newEvent.title || 'New event',
            start: newEvent.start,
            end: newEvent.end,
            description: newEvent.description,
            eventType: newEvent.eventType
        }]
        : events;
    function handleDateClick(info) {
        const eventsOnDate = getEventsForDate(events, info.dateStr);
        if(eventsOnDate.length > 0 ) {
            setSelectedDate(info.dateStr);
        }
    }
    function closeEventPopUp() {
        setSelectedDate(null);
        setEditingEventId(null);
        setEditingEvent(null);
        setEditError('');
    }

    function startEditingEvent(event) {
        setEditingEventId(event.id);
        setEditingEvent({
            title: event.title,
            eventType: event.eventType,
            start: formatInputDateTime(event.start),
            end: formatInputDateTime(event.end),
            description: event.description
        });
        setEditError('');
    }

    function handleEditChange(event) {
        const { name, value } = event.target;
        setEditingEvent((current) => ({ ...current, [name]: value }));
        setEditError('');
    }

    async function handleSaveEdit(event) {
        event.preventDefault();
        setIsSavingEdit(true);
        setEditError('');
        try {
            const response = await fetch(`/api/events/${editingEventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editingEvent,
                    start: new Date(editingEvent.start).toISOString(), /* converts the local datetime to UTC for PostgreSQL */
                    end: new Date(editingEvent.end).toISOString(),
                    teamId: user.teamId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                })
            });
            const result = await readApiResponse(response, 'The event could not be updated.');
            setEvents((current) => current.map((item) => item.id === result.id ? result : item).sort((a, b) => a.start.localeCompare(b.start)));
            setEditingEventId(null);
            setEditingEvent(null);
        } catch (error) {
            setEditError(error instanceof TypeError ? 'Could not connect to the server.' : error.message);
        } finally {
            setIsSavingEdit(false);
        }
    }

    async function handleDeleteEvent(eventId) {
        if (!window.confirm('Delete this team event?')) {
            return;
        }
        setEditError('');
        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: user.teamId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                })
            });
            if (!response.ok) {
                await readApiResponse(response, 'The event could not be deleted.');
            }
            setEvents((current) => current.filter((item) => item.id !== eventId));
            setEditingEventId(null);
            setEditingEvent(null);
        } catch (error) {
            setEditError(error instanceof TypeError ? 'Could not connect to the server.' : error.message);
        }
    }

    function handleFormChange(event) {
        const { name, value } = event.target;
        setNewEvent((current) => ({
            ...current,
            [name]: value,
            ...(name === 'start' && !endTimeEdited ? { end: getEndTimeFourHoursLater(value) } : {})
        }));
        if (name === 'end') {
            setEndTimeEdited(true);
        }
        setFormError('');
    }

    async function handleCreateEvent(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setFormError('');
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newEvent,
                    start: new Date(newEvent.start).toISOString(), /* converts the local datetime to UTC for PostgreSQL */
                    end: new Date(newEvent.end).toISOString(),
                    teamId: user.teamId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                })
            });
            const result = await readApiResponse(response, 'The event could not be created.');
            setEvents((current) => [...current, result].sort((a, b) => a.start.localeCompare(b.start)));
            setNewEvent({ title: '', eventType: 'practice', start: '', end: '', description: '' });
            setEndTimeEdited(false);
            setIsCreateFormOpen(false);
        } catch (error) {
            setFormError(error instanceof TypeError
                ? 'Could not connect to the server. Make sure the backend is running.'
                : error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    function changeCalendarView(viewName) {
        if (calendarRef.current) {
            calendarRef.current.getApi().changeView(viewName);
        }
        setCalendarView(viewName);
    }

    return (
        <div className="team-calendar">
            {calendarError && <p className="calendar-error" role="alert">{calendarError}</p>}
            <div className="calendar-controls">
                {user.role === 'coach' && (
                    <button className="create-event-button" type="button" onClick={() => setIsCreateFormOpen(true)}>
                        Create new event
                    </button>
                )}
                <div className="calendar-view-toggle" role="group" aria-label="Calendar view">
                    <button type="button" className={calendarView === 'dayGridWeek' ? 'active' : ''} aria-pressed={calendarView === 'dayGridWeek'} onClick={() => changeCalendarView('dayGridWeek')}>1 week</button>
                    <button type="button" className={calendarView === 'dayGridMonth' ? 'active' : ''} aria-pressed={calendarView === 'dayGridMonth'} onClick={() => changeCalendarView('dayGridMonth')}>1 month</button>
                    <button type="button" className={calendarView === 'threeMonthSeason' ? 'active' : ''} aria-pressed={calendarView === 'threeMonthSeason'} onClick={() => changeCalendarView('threeMonthSeason')}>3 months</button>
                </div>
            </div>
            <FullCalendar
                ref = {calendarRef}
                plugins = {[dayGridPlugin, multiMonthPlugin, themePlugin, interactionPlugin]} //array of additional feature(s) stored in the prop
                initialView = "threeMonthSeason"
                views = {{ //this is the custom view
                    threeMonthSeason: {
                        type: 'multiMonth',
                        duration: { months: 3 }
                    }
                }}
                headerToolbar = {{ //this is the toolbar above the calendar SUBJECT TO CHANGE
                    left: 'prev,next',
                    center: 'title',
                    right: ''
                }}
                buttonClass = "calendar-navigation-button"
                buttonGroupClass = "calendar-navigation-group"
                multiMonthMaxColumns = {3}
                singleMonthMinWidth = {280}
                height = {calendarView === 'dayGridWeek' ? 620 : 'auto'}
                dateClick = {handleDateClick}
                /*events = {events} */
                events = {calendarView === 'threeMonthSeason' ? [] : events} /*If three-month view, then no bullets inside the small boxes. If not, then FullCalendar receives the real events and displays the bullet points*/
                eventClassNames = {(info) => [getEventCategoryClass(info.event.extendedProps.eventType)]}
                dayCellClass = {(info) => {
                    const dateKey = getDateKey(info.date);
                    const hasEvents = getEventsForDate(events, dateKey).length > 0;
                    return hasEvents ? 'has-team-event' : '';
                }}
            />
            {isCreateFormOpen && (
                <div className="event-popup-overlay">
                    <section className="event-popup create-event-popup" role="dialog" aria-modal="true" aria-labelledby="create-event-heading">
                        <button type="button" className="event-popup-close" onClick={() => setIsCreateFormOpen(false)} aria-label="Close create event form">x</button>
                        <p className="event-popup-label">COACH TOOLS</p>
                        <h2 id="create-event-heading">Create new event</h2>
                        <form className="create-event-form" onSubmit={handleCreateEvent}>
                            <label>Event title<input name="title" value={newEvent.title} onChange={handleFormChange} maxLength="355" required /></label>
                            <label>Event type<select name="eventType" value={newEvent.eventType} onChange={handleFormChange}><option value="practice">Practice</option><option value="game">Game</option><option value="meeting">Meeting</option><option value="travel">Travel</option><option value="other">Other</option></select></label>
                            {previewWeek.length > 0 && (
                                <div className="event-week-preview" aria-label="Events during the selected week">
                                    <p className="event-week-preview-heading">Events this week</p>
                                    {previewWeek.map((day) => {
                                        const dateKey = getDateKey(day);
                                        const dayEvents = getEventsForDate(previewEvents, dateKey);
                                        return (
                                            <div className="event-week-day" key={dateKey}>
                                                <strong>{day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                                                <div>
                                                    {dayEvents.length > 0
                                                        ? dayEvents.map((event) => (
                                                            <span className={`${event.id === 'new-event-preview' ? 'event-week-item preview' : 'event-week-item'} ${getEventCategoryClass(event.eventType)}`} key={event.id}>
                                                                {event.title} · {formatEventTime(event)}
                                                            </span>
                                                        ))
                                                        : <span className="event-week-empty">No events</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="create-event-dates">
                                <label>Starts<input name="start" type="datetime-local" value={newEvent.start} onChange={handleFormChange} required /></label>
                                <label>Ends<input name="end" type="datetime-local" value={newEvent.end} onChange={handleFormChange} required /></label>
                            </div>
                            <label>Description<textarea name="description" value={newEvent.description} onChange={handleFormChange} maxLength="255" rows="3" /></label>
                            {formError && <p className="calendar-error" role="alert">{formError}</p>}
                            <button className="submit-event-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create event'}</button>
                        </form>
                    </section>
                </div>
            )}
            {selectedDate && (
                <div className = "event-popup-overlay">
                    <section 
                        className = "event-popup"
                        role = "dialog"
                        aria-modal = "true"
                        aria-labelledby = "event-popup-heading"
                    >
                        <button
                            type = "button"
                            className = "event-popup-close"
                            onClick = {closeEventPopUp}
                            aria-label = "Close event details"
                        >
                            x
                        </button>
                        <p className = "event-popup-label">TEAM SCHEDULE</p>
                        <h2 id = "event-popup-heading">
                            {formatSelectedDate(selectedDate)}
                        </h2>
                        <div className = "event-popup-list">
                            {selectedEvents.map((event) => (
                                <article className = "event-popup-item" key = {event.id}>
                                    <div className="event-item-heading">
                                        <span className = {`event-type ${getEventCategoryClass(event.eventType)}`}>
                                            {event.eventType}
                                        </span>
                                        {user.role === 'coach' && editingEventId !== event.id && (
                                            <div className="event-icon-actions">
                                                <button className="event-icon-button" type="button" onClick={() => startEditingEvent(event)} aria-label={`Edit ${event.title}`} title="Edit event">✎</button>
                                                <button className="event-icon-button delete" type="button" onClick={() => handleDeleteEvent(event.id)} aria-label={`Delete ${event.title}`} title="Delete event">⌫</button>
                                            </div>
                                        )}
                                    </div>
                                    {editingEventId === event.id ? (
                                        <form className="event-edit-form" onSubmit={handleSaveEdit}>
                                            <label>Event title<input name="title" value={editingEvent.title} onChange={handleEditChange} maxLength="355" required /></label>
                                            <label>Event type<select name="eventType" value={editingEvent.eventType} onChange={handleEditChange}><option value="practice">Practice</option><option value="game">Game</option><option value="meeting">Meeting</option><option value="travel">Travel</option><option value="other">Other</option></select></label>
                                            <div className="create-event-dates">
                                                <label>Starts<input name="start" type="datetime-local" value={editingEvent.start} onChange={handleEditChange} required /></label>
                                                <label>Ends<input name="end" type="datetime-local" value={editingEvent.end} onChange={handleEditChange} required /></label>
                                            </div>
                                            <label>Description<textarea name="description" value={editingEvent.description} onChange={handleEditChange} maxLength="255" rows="3" /></label>
                                            {editError && <p className="calendar-error" role="alert">{editError}</p>}
                                            <div className="event-actions"><button className="submit-event-button" type="submit" disabled={isSavingEdit}>{isSavingEdit ? 'Saving...' : 'Save changes'}</button><button className="event-secondary-button" type="button" onClick={() => setEditingEventId(null)}>Cancel</button></div>
                                        </form>
                                    ) : (
                                        <>
                                            <h3>{event.title}</h3>
                                            <p className = "event-time"> {formatEventTime(event)}</p>
                                            <p>{event.description}</p>
                                        </>
                                    )}
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

export default TeamCalendar;