//Calendar class
class Calendar { 
    constructor() {
        this.events = [];
    }

    addEvent(event) {
        this.events.push(event);
    }

    getEvents() {
        return this.events;
    }

    getEventById(id) {
        return this.events.find(event => event.id === id);
    }

    removeEvent(id) {
        this.events = this.events.filter(event => event.id !== id);
    }

    editEvent(id) {
        // Code to edit event, should only be able to edit certain things but not set in stone variables such as id, etc
    }    

    
}

module.exports = Calendar;
