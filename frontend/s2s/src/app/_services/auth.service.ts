import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { Router } from '@angular/router';
import { switchMap, catchError, map } from 'rxjs/operators';
import { BehaviorSubject, EMPTY, Observable, of } from 'rxjs';

// services
import { ApiService } from './api.service';

// models
import { User, UserSignUp, UserLogIn, UserResponse, UserUpdate } from '../_models/user';
import { OnboardingResp } from '../_models/onboarding';
import { PasswordChange } from '../_models/password-change';

/**
 * Service responsible for user authentication and authorization.
 * Handles user sign-up, login, logout, and provides information about the 
 * user's authentication status.
 * 
 * This service interacts with the API service to perform authentication-related 
 * HTTP requests.
 * 
 * @see ApiService
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  signupEndpoint = `${this.apiService.BASE_API_URL}/create/`;
  loginEndpoint = `${this.apiService.BASE_API_URL}/login/`;
  onboardingEndpoint = `${this.apiService.BASE_API_URL}/onboarding/`;
  changePasswordEndpoint = `${this.apiService.BASE_API_URL}/user/change_password/`;
  userUpdateEndpoint = `${this.apiService.BASE_API_URL}/user/${this.userValue.id}/`;
  endpoint = `${this.apiService.BASE_API_URL}/user/`;
  
  signingUp = new BehaviorSubject<boolean>(false);
  user = new BehaviorSubject<User>(this.userValue);
  userSubject = this.user.asObservable();

  constructor(
    private apiService: ApiService,
    private http: HttpClient,
    private router: Router
  ) { }

  /**
   * Signs a user up for the application.
   * 
   * @param user A UserSignUp object containing the user's information.
   * @returns An Observable of the signed-up user.
   */
  signup(user: UserSignUp): Observable<User> {
    return this.http.post<UserResponse>(this.signupEndpoint, user).pipe(
      switchMap(response => {
        this.signingUp.next(true);
        sessionStorage.setItem('access_token', response.access_token);
        sessionStorage.setItem('refresh_token', response.refresh_token);
        sessionStorage.setItem('user', JSON.stringify(response.user));
        this.signingUp.next(false);
        return of(response.user);

      })
    );
  }

  /**
   * Logs a user into the application.
   * 
   * @param user A UserLogIn object containing the user's login information.
   * @returns An Observable of the logged in user.
   */
  login(user: UserLogIn): Observable<any> {
    return this.http.post<any>(this.loginEndpoint, user).pipe(
      switchMap(response => {
        sessionStorage.setItem('access_token', response.access_token);
        sessionStorage.setItem('refresh_token', response.refresh_token);
        sessionStorage.setItem('user', JSON.stringify(response.user));
        this.user.next(response.user);
        return of(response.user);
      })
    );
  }

  /**
   * Returns whether a user is logged in.
   */
  get loggedIn(): boolean {
    return !!sessionStorage.getItem('user');
  }

  /**
   * Determines the user's onboarding status.
   * 
   * If a user is not onboarded, then when they log in, they are 
   * automatically redirected to the onboarding page. If a user is onboarded,
   * they are taken to their profile page.
   * 
   * @returns An Observable<boolean> representing the user's onboarding status.
   */
  getOnboardingStatus(): Observable<boolean> {
    let userValue = this.userValue;
    return this.http.get<OnboardingResp>(`${this.onboardingEndpoint}?user_id=${userValue.id}`).pipe(
      catchError(error => {
        console.error('Error fetching onboarding:', error);
        return EMPTY;
      }),
      map(onboardingResp => {
        let onboarding = onboardingResp.results[0];
        if (onboarding) {
          return onboarding.onboarded;
        } else {
          return false;
        }
      })
    );
  }

  /**
   * Extracts the user's information.
   * 
   * @returns The user object containing user information.
   */
  get userValue(): User {
    let userStr = sessionStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return {id: -1, username: '', email: '', first_name: '', last_name: ''};
  }

  /**
   * Logs a user out of the application.
   */
  logout(): void {
    console.log("logging out");
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    this.router.navigate(['/log-in']);
  }

  /**
   * Changes a user's password.
   * Implement this method once the password change endpoint is available.
   * 
   * @param passwordChange A PasswordChange object containing the user's current
   *                       password, new password, and confirmation of the new
   *                       password.
   * @returns An Observable of the password change response.
   */
  changePassword(passwordChange: PasswordChange): Observable<any> {
    return this.http.patch<any>(this.changePasswordEndpoint, passwordChange);
  }

  /**
   * Updates a user's information.
   * Implement this method once the user update endpoint is available.
   * 
   * @param userUpdate A UserUpdate object containing the user's updated information.
   * @returns An Observable of the updated user.
   */
  updateUser(userUpdate: UserUpdate): Observable<any> {
    return this.http.put<any>(this.userUpdateEndpoint, userUpdate);
  }

  /**
   * Deletes a user's account.
   * This function should trigger an endpoint in the backend that deletes the
   * user's account and erases all instances of that user from the database,
   * including their availability, events attended, upcoming events, etc.
   * 
   * Implement this method once the user delete endpoint is available.
   * 
   * @param user The user to delete.
   * @returns An Observable of the delete response.
   */
  deleteAccount(user: User): Observable<any> {
    return this.http.delete<any>(`${this.endpoint}${user.id}/`).pipe(
      catchError(error => {
        console.error('Error deleting account:', error);
        return EMPTY;
      })
    )
  }
}
