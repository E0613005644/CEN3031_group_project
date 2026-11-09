import { useState } from 'react';
import FullCalendar from '@fullcalendar/react'; //imports the actual React calendar component
import multiMonthPlugin from '@fullcalendar/react/multimonth'; //this imports the additional feature so that i can display multiple months
import interactionPlugin from '@fullcalendar/react/interaction';
import themePlugin from '@fullcalendar/react/themes/monarch';

import '@fullcalendar/react/skeleton.css'; //this is the basic structural styling
import '@fullcalendar/react/themes/monarch/theme.css';
import '@fullcalendar/react/themes/monarch/palettes/yellow.css'; //because yellow is unfortunately the closest to gold
import './TeamCalendar.css'; //this is our (hannah and i's) custom styling



//i have defined temporary sample events to be able to test the interface before the backend endpoint exists
const sampleEvents = [
    {
        id: 'sample-1',
        title: 'Team Practice',
        start: '2026-11-10T09:00:00',
        end: '2026-11-10T12:00:00',
        description: 'Mandatory team practice',
        eventType: 'practice'
    },
    {
        id: 'sample-2',
        title: 'Team Meeting',
        start: '2026-11-18T14:00:00',
        end: '2026-11-18T15:30:00',
        description: 'Team meeting and schedule review',
        eventType: 'meeting'
    },
    {
        id: 'sample-3',
        title: 'Away Game',
        start: '2026-12-06',
        description: 'Jacksonville Jaguars away game',
        eventType: 'game'
    },
    {
        id: 'sample-4',
        title: 'Team Travel',
        start: '2027-01-08',
        description: 'Scheduled team travel',
        eventType: 'travel'
    }
];

//this function converts a JavaScript date object into a YYYY-MM-DD string used by the events
function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); //+1 because months are zero-indexed and the other part ensures the months are 2 digits
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

//receives a correctly formatted date and then searches through sample events and returns only events whose starting date matches
function getEventsForDate(dateKey) {
    return sampleEvents.filter((event) => event.start.slice(0, 10) === dateKey);
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


function TeamCalendar() {
    const [selectedDate, setSelectedDate] = useState(null);
    const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];
    function handleDateClick(info) {
        const eventsOnDate = getEventsForDate(info.dateStr);
        if(eventsOnDate.length > 0 ) {
            setSelectedDate(info.dateStr);
        }
    }
    function closeEventPopUp() {
        setSelectedDate(null);
    }

    return (
        <div className="team-calendar">
            <FullCalendar
                plugins = {[multiMonthPlugin, themePlugin, interactionPlugin]} //array of additional feature(s) stored in the prop
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
                height = "auto"
                dateClick = {handleDateClick}
                dayCellClass = {(info) => {
                    const dateKey = getDateKey(info.date);
                    const hasEvents = getEventsForDate(dateKey).length > 0;
                    return hasEvents ? 'has-team-event' : '';
                }}
            />
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
                                    <span className = "event-type">
                                        {event.eventType}
                                    </span>
                                    <h3>{event.title}</h3>
                                    <p className = "event-time"> {formatEventTime(event)}</p>
                                    <p>{event.description}</p>
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