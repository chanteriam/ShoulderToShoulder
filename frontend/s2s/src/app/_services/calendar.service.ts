import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, expand } from 'rxjs/operators';
import { EMPTY, BehaviorSubject, Observable, throwError, reduce} from 'rxjs';
import { withCache } from '@ngneat/cashew';

// services
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

// models
import { AvailabilityObj, 
          CalendarObj, 
          AvailabilityResponse, 
          CalendarResponse,
          daysOfTheWeek,
          hours,
          AvailabilitySlot
        } from '../_models/calendar';

/**
 * Service responsible for managing calendar-related functionalities, including 
 * fetching calendar data and user availability from the API, updating user 
 * availability, and converting availability data for UI display.
 * 
 * This service interacts with the API service and authentication service to 
 * perform calendar-related HTTP requests.
 * 
 * @see ApiService
 * @see AuthService
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  availabilityEndpoint = this.apiService.BASE_API_URL + '/availability/';
  calendarEndpoint = this.apiService.BASE_API_URL + '/calendar/';

  calendarSubject = new BehaviorSubject<CalendarObj[]>([]);
  calendar = this.calendarSubject.asObservable();

  availabilitySubject = new BehaviorSubject<AvailabilityObj[]>([]);
  availability = this.availabilitySubject.asObservable();

  userAvailabilityObserver = new BehaviorSubject<AvailabilitySlot[]>([]);
  userAvailability$ = this.userAvailabilityObserver.asObservable();
  userAvailability: AvailabilitySlot[] = [];

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    if (this.authService.loggedIn) {
      this.loadAllCalendar();
    }
   }

  /**
   * Loads calendar data from the API and initializes availability data.
   */
  loadAllCalendar(): void {
    this.fetchCalendar(this.calendarEndpoint).subscribe(calendar => {
      this.calendarSubject.next(calendar);
      this.calendarSubject.subscribe(calendar => this.loadAllAvailability(calendar));
    });
  }

  /**
   * Gets the calendar from the calendar API. Iterates through each
   * page in the API response to get all the calendar data.
   * 
   * @returns The calendar data as a list of Calendar objects.
   */
  fetchCalendar(url: string): Observable<CalendarObj[]> {
    return this.http.get<CalendarResponse>(url, {context: withCache()}).pipe(
      expand(response => response.next ? this.http.get<CalendarResponse>(response.next) : EMPTY),
      map(response => response.results),
      reduce<CalendarObj[], CalendarObj[]>((acc, cur) => [...acc, ...cur], []),
      catchError(error => throwError(() => new Error(`Error fetching calendar: ${error}`)))
    );
  }

  /**
   * Loads availability data from the API and converts it for UI display.
   * 
   * @param calendar The calendar data used to map availability slots.
   */
  loadAllAvailability(calendar: CalendarObj[]): void {
    this.fetchAvailability(this.availabilityEndpoint + "?user_id=" + this.authService.userValue.id).subscribe(availability => {
      this.availabilitySubject.next(availability);
      this.userAvailability = this.convertAvailability(availability, calendar);
      this.userAvailabilityObserver.next(this.userAvailability);
    });
  }

  /**
   * Fetches availability data from the calendar API.
   * 
   * @param url The URL of the API endpoint to fetch availability data from.
   * @returns An Observable of availability data as an array of Availability objects.
   */
  fetchAvailability(url: string): Observable<AvailabilityObj[]> {
    return this.http.get<AvailabilityResponse>(url).
    pipe(
      expand(response => response.next ? this.http.get<AvailabilityResponse>(response.next) : EMPTY),
      map(response => response.results),
      reduce<AvailabilityObj[], AvailabilityObj[]>((acc, cur) => [...acc, ...cur], []),
      catchError(error => throwError(() => new Error(`Error fetching availability: ${error}`)))
    );
  }

  /**
   * Converts availability data for UI display.
   * 
   * @param availability The availability data fetched from the API.
   * @param calendar The calendar data used to map availability slots.
   * @returns An array of AvailabilitySlot objects for UI display.
   */
  convertAvailability(availability: AvailabilityObj[], calendar: CalendarObj[]): AvailabilitySlot[] {
    return hours.map(hour => {
      const timeOfDay = hour >= 12 && hour < 24 ? ' PM' : ' AM';
      const timeLabel = `${hour % 12 === 0 ? 12 : hour % 12}:00` + timeOfDay;
      const time = { label: timeLabel, value: hour };
      const days = daysOfTheWeek.map(day => {
        const dayAvailability = availability.find(a => {
          const calendarObj = calendar.find(c => c.id === a.calendar_id && c.day_of_week === day && c.hour == hour);
          return calendarObj && a.available;
        });

        // converts undefined values to false and defined values to true
        // if a user is available at a given time and day, the will convert the 
        // toggle value to true
        return !!dayAvailability; 
      });
  
      return { time, days };
    });
  }


  /**
   * Updates user availability in the database.
   */
  updateAvailability(): Observable<any> {
    const user = this.authService.userValue; // assuming authService exposes user details
    const updates = this.userAvailability.map(slot =>
      slot.days.map((available, dayIndex) => ({
        email: user.email,
        day_of_week: daysOfTheWeek[dayIndex], // Ensure daysOfTheWeek is defined and accessible
        hour: slot.time.value,
        available: available
      }))
    ).flat(); // Flattening the array to pass as a single list

    return this.http.post(`${this.availabilityEndpoint}bulk_update/`, updates).pipe(
      catchError(error => {
        console.error('Error updating availability:', error);
        return EMPTY; // Returning EMPTY to avoid breaking the observable chain in case of an error
      })
    );
  }

  /**
   * Sets user's availability to the backup availability data.
   * 
   * This method is used to reset the user's availability data to the last saved state.
   * 
   * @param availability The availability data to set as the user's availability.
   */
  setAvailability(availability: AvailabilitySlot[]): void {
    this.userAvailability = availability;
    this.userAvailabilityObserver.next(this.userAvailability);
  }
}
