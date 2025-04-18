// Purpose: This file contains the interface for Event model.
export interface Event {
    id?: number;
    created_by?: number;
    title: string;
    description?: string;
    hobby_type?: string;
    datetime: string;
    duration_h: number;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipcode: string;
    latitude?: number;
    longitude?: number;
    max_attendees: number;
    add_user?: boolean;
    rating?: string;
    attended?: boolean;
    price: string;
}

export interface UserEvent {
    id: number;
    user_rating: string;
    rsvp: string;
    attended: boolean;
    user_id: number;
    event_id: number;
}

export interface PastUpcomingEventResponse {
    past_events: {count: number, events: Event[]};
    upcoming_events: {count: number, events: Event[]};
}

export interface EventResponse {
    count: number;
    next: string;
    previous: string;
    results: Event[];
}

export interface UserEventResponse {
    count: number;
    next: string;
    previous: string;
    results: UserEvent[];
}