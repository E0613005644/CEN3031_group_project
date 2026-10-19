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
}

module.exports = Calendar;
