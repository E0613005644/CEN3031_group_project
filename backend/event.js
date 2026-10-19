class Event {
    constructor(id, title, start, end, event_type, descr) {
        this.id = id;
        this.title = title;
        this.start = start;
        this.end = end;
        this.event_type = event_type;
        this.descr = descr;
    }
}

module.exports = Event;
