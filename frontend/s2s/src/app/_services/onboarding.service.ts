import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { EMPTY, Observable, switchMap, finalize, of } from 'rxjs';

// services
import { AvailabilityService } from './availability.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { HobbyService } from './hobbies.service';

// helpers
import { NumberRegx } from '../_helpers/patterns';
import { ScenarioObj, maxScenarios } from '../_models/scenarios';
import { Scenario } from '../_helpers/scenario';
import { Onboarding, OnboardingResp } from '../_models/onboarding';
import { User } from '../_models/user';
import { getState } from '../_helpers/utils';
import { Hobby } from '../_models/hobby';

/**
 * Service responsible for managing the onboarding process for users, including handling onboarding data,
 * submitting forms, and fetching existing onboarding data.
 * 
 * This service interacts with other services and the API service to perform onboarding-related tasks.
 * 
 * @see ApiService
 * @see AvailabilityService
 * @see AuthService
 * @see HobbyService
 */
@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  onboardingEndpoint = this.apiService.BASE_API_URL + '/onboarding/';
  onboardingSubmitEndpoint = this.apiService.BASE_API_URL + '/submit_onboarding/';
  onboardingUpdateEndpoint = this.apiService.BASE_API_URL + '/onboarding/update/';
  maxDescLen: number = 50;
  maxAddrLen: number = 100;
  onboarding: Onboarding;

  // onboarding form
  public demographicsForm: FormGroup = this.fb.group({
    groupSimilarity: new FormControl('', Validators.required),
    groupSimilarityAttrs: new FormControl([], Validators.required),
    ageRange: new FormControl(''),
    race: new FormControl(''),
    raceDesc: new FormControl('', Validators.maxLength(this.maxDescLen)),
    pronouns: new FormControl('', Validators.maxLength(this.maxDescLen)),
    gender: new FormControl(''),
    genderDesc: new FormControl('', Validators.maxLength(this.maxDescLen)),
    sexualOrientation: new FormControl(''),
    sexualOrientationDesc: new FormControl('', Validators.maxLength(this.maxDescLen)),
    religiousAffiliation: new FormControl(''),
    religiousAffiliationDesc: new FormControl('', Validators.maxLength(this.maxDescLen)),
    politicalLeaning: new FormControl(''),
    politicalLeaningDesc: new FormControl('', Validators.maxLength(this.maxDescLen)),
  });

  public preferencesForm: FormGroup = this.fb.group({
    zipCode: new FormControl('', [
      Validators.minLength(5),
      Validators.maxLength(5),
      Validators.required,
      Validators.pattern(NumberRegx)
    ]),
    city: new FormControl('', Validators.maxLength(this.maxDescLen)),
    state: new FormControl(''),
    addressLine1: new FormControl('', Validators.maxLength(this.maxAddrLen)),
    mostInterestedHobbyTypes: new FormControl([], Validators.required),
    mostInterestedHobbies: new FormControl([], Validators.required),
    leastInterestedHobbies: new FormControl([]),
    groupSizes: new FormControl([], Validators.required),
    eventFrequency: new FormControl(''),
    eventNotifications: new FormControl('', Validators.required),
    distances: new FormControl('', Validators.required),
  });

  public scenariosForm: FormGroup = this.fb.group({
    scenario1: new FormControl(undefined, Validators.required),
    scenario1Choice: new FormControl(undefined, Validators.required),
    scenario2: new FormControl(undefined, Validators.required),
    scenario2Choice: new FormControl(undefined, Validators.required),
    scenario3: new FormControl(undefined, Validators.required),
    scenario3Choice: new FormControl(undefined, Validators.required),
    scenario4: new FormControl(undefined, Validators.required),
    scenario4Choice: new FormControl(undefined, Validators.required),
    scenario5: new FormControl(undefined, Validators.required),
    scenario5Choice: new FormControl(undefined, Validators.required),
    scenario6: new FormControl(undefined, Validators.required),
    scenario6Choice: new FormControl(undefined, Validators.required),
    scenario7: new FormControl(undefined, Validators.required),
    scenario7Choice: new FormControl(undefined, Validators.required),
    scenario8: new FormControl(undefined, Validators.required),
    scenario8Choice: new FormControl(undefined, Validators.required),
    scenario9: new FormControl(undefined, Validators.required),
    scenario9Choice: new FormControl(undefined, Validators.required),
    scenario10: new FormControl(undefined, Validators.required),
    scenario10Choice: new FormControl(undefined, Validators.required),
  });
  onboarded: boolean = false;

  constructor(
    private fb: FormBuilder,
    public availabilityService: AvailabilityService,
    public authService: AuthService,
    private http: HttpClient,
    private apiService: ApiService,
    private hobbyService: HobbyService,

  ) { 
    this.onboarding = this.getDefaultOnboarding();
    this.authService.user.subscribe(user => {
      if (user && user.id > -1) {
        this.fetchOnboarding();
      }
    });
  }

  /**
   * Retrieves the default onboarding data structure.
   * 
   * @returns Default onboarding data structure.
   */
  getDefaultOnboarding(): Onboarding {
    let defaultOnboarding: Onboarding = {
      user_id: -1,
      onboarded: false,
      most_interested_hobby_types: [],
      most_interested_hobbies: [],
      least_interested_hobbies: [],
      num_participants: [],
      distance: '',
      zip_code: '',
      city: '',
      state: '',
      address_line1: '',
      event_frequency: '',
      event_notification: '',
      similarity_to_group: '',
      similarity_metrics: [],
      pronouns: '',
      gender: [],
      gender_description: '',
      race: [],
      race_description: '',
      age: '',
      sexual_orientation: '',
      sexual_orientation_description: '',
      religion: '',
      religion_description: '',
      political_leaning: '',
      political_description: '',
    }
    return defaultOnboarding;
  }

  /**
   * Fetches any existing onboarding data for the user. 
   * 
   * This function allows a user to start the onboarding process, exit it, 
   * and return later without losing their progress.
   * 
   */
  fetchOnboarding(): void {
    let user = this.authService.userValue;
    if (user.id < 0) {
      return;
    }
    this.http.get<OnboardingResp>(`${this.onboardingEndpoint}?user_id=${user.id}`).pipe(
      catchError(error => {
        console.error('Error fetching onboarding:', error);
        return EMPTY;
      })
    ).subscribe(onboardingResp => {
      if (onboardingResp) {
        this.onboarding = onboardingResp.results[0];
        console.log('Onboarding fetched successfully!')
        this.onboarded = this.onboarding.onboarded;
        this.setDemographicsForm(this.onboarding);
        this.setPreferencesForm(this.onboarding);
        this.availabilityService.loadAllAvailability();
      }
    });
  }

  /**
   * Sets the demographics form with the user's existing onboarding data.
   * 
   * @param onboarding 
   */
  setDemographicsForm(onboarding: Onboarding): void {
    this.demographicsForm.setValue({
      groupSimilarity: this.onboarding.similarity_to_group,
      groupSimilarityAttrs: this.onboarding.similarity_metrics,
      ageRange: this.onboarding.age,
      race: this.onboarding.race,
      raceDesc: this.onboarding.race_description,
      pronouns: this.onboarding.pronouns,
      gender: this.onboarding.gender,
      genderDesc: this.onboarding.gender_description,
      sexualOrientation: this.onboarding.sexual_orientation,
      sexualOrientationDesc: this.onboarding.sexual_orientation_description,
      religiousAffiliation: this.onboarding.religion,
      religiousAffiliationDesc: this.onboarding.religion_description,
      politicalLeaning: this.onboarding.political_leaning,
      politicalLeaningDesc: this.onboarding.political_description,
    });
  }

  /**
   * Sets the preferences form with the user's existing onboarding data.
   * 
   * @param onboarding 
   */
  setPreferencesForm(onboarding: Onboarding): void {
    this.preferencesForm.patchValue({
      zipCode: this.onboarding.zip_code,
      city: this.onboarding.city,
      state: getState(this.onboarding.state),
      addressLine1: this.onboarding.address_line1,
      groupSizes: this.onboarding.num_participants,
      eventFrequency: this.onboarding.event_frequency,
      eventNotifications: this.onboarding.event_notification,
      distances: this.onboarding.distance,
    });

    this.getMostInterestedHobbies(this.onboarding.most_interested_hobbies);
    this.getLeastInterestedHobbies(this.onboarding.least_interested_hobbies);
    this.getMostInterestedHobbyTypes(this.onboarding.most_interested_hobby_types);
  }

  /**
   * Retrieves the most interested hobbies from the current list of hobbies.
   * 
   * @param ids - IDs of the most interested hobbies.
   */
  getMostInterestedHobbies(ids: number[]) {
    this.hobbyService.hobbies.subscribe(hobbies => {
      this.preferencesForm.patchValue({
        mostInterestedHobbies: hobbies.filter(hobby => ids.includes(hobby.id))
      });
    });
  }

  /**
   * Retrieves the least interested hobbies from the current list of hobbies.
   * 
   * @param ids - IDs of the least interested hobbies.
   */
  getLeastInterestedHobbies(ids: number[]) {
    this.hobbyService.hobbies.subscribe(hobbies => {
      this.preferencesForm.patchValue({
        leastInterestedHobbies: hobbies.filter(hobby => ids.includes(hobby.id))
      });
    });
  }

 /**
   * Retrieves the most interested hobby types from the current list of hobby types.
   * 
   * @param ids - IDs of the most interested hobby types.
   */
  getMostInterestedHobbyTypes(ids: number[]) {
    // clear most interested hobby types if no ids
    if (!ids || ids.length == 0) {
      this.preferencesForm.patchValue({
        mostInterestedHobbyTypes: []
      });
    } 
    
    // fetch most interested hobby types
    else {
      this.hobbyService.getFilteredHobbyTypes(undefined, ids).subscribe(hobbyTypes => {
        this.preferencesForm.patchValue({
          mostInterestedHobbyTypes: hobbyTypes
        });
      });      
    }
  }

  /**
   * Exits the onboarding process by submitting current data to the backend and 
   * signing the user out.
   * 
   * @param onboarded - Flag indicating if the user has completed onboarding.
   */
  exitOnboarding(onboarded: boolean = false): void {
    let user = this.authService.userValue;
    console.log('User:', user);
    console.log('User has been logged out.');
    this.submitOnboardingForms(onboarded).subscribe(() => {
      this.authService.logout();
    });;
  }

  /**
   * Updates onboarding information for the preferences survey
   * and demographics survey.
   * 
   * This function is primarily used to update onboarding information on the 
   * user profile settings page once the user has already completed the 
   * initial onboarding process.
   */
  updateOnboarding(): void {
    let user = this.authService.userValue;
    this.submitOnboarding(user, this.onboarded);
  }

  /**
   * Cancels the onboarding process by clearing the onboarding data.
   */
  cancelOnboarding(): void {
    this.fetchOnboarding();
  }

  /**
   * Submits the onboarding forms to the backend. These are the forms a user
   * fills out during the initial onboarding process.
   * 
   * @param onboarded - Flag indicating if the user has completed onboarding.
   */
  submitOnboardingForms(onboarded: boolean = false): Observable<any> {
    let user = this.authService.userValue;

    // get availability and scenario data to update
    let availData = this.availabilityService.getUpdateAvailabilityData();

    // get scenario data if user has completed onboarding
    let scenarioData: ScenarioObj[] = [];
    if (onboarded) {
      scenarioData = this.getScenarioData();
    }

    // get onboarding data
    let onboardingData = this.getOnboardingData(user, onboarded);
    let fullOnboardingData = {
      "user_data": {"user_id": user.id},
      "onboarding": onboardingData,
      "availability": availData,
      "scenarios": scenarioData
    }

    return this.submitFullOnboarding(fullOnboardingData);
  }

  /**
   * Gets the onboarding data.
   */
  getOnboardingData(user: User, onboarded: boolean = true): Onboarding {
    this.onboarding = {
      user_id: user.id,
      onboarded: onboarded,

      // preferences form
      most_interested_hobby_types: this.getHobbyList("mostInterestedHobbyTypes", this.preferencesForm),
      most_interested_hobbies: this.getHobbyList("mostInterestedHobbies", this.preferencesForm),
      least_interested_hobbies: this.getHobbyList("leastInterestedHobbies", this.preferencesForm),
      num_participants: this.getStringToListChar("groupSizes", this.preferencesForm), 
      distance: this.preferencesForm.get('distances')?.value,
      zip_code: this.preferencesForm.get('zipCode')?.value,
      city: this.preferencesForm.get('city')?.value,
      state: (this.preferencesForm.get('state')?.value as {label: string, value: string}).value,
      address_line1: this.preferencesForm.get('addressLine1') ? this.preferencesForm.get('addressLine1')?.value : "",
      event_frequency: this.preferencesForm.get('eventFrequency') ? this.preferencesForm.get('eventFrequency')?.value : "",
      event_notification: this.preferencesForm.get('eventNotifications') ? this.preferencesForm.get('eventNotifications')?.value : "",

      // demographics form
      similarity_to_group: this.demographicsForm.get('groupSimilarity') ? this.demographicsForm.get('groupSimilarity')?.value : "",
      similarity_metrics: this.getStringToListChar("groupSimilarityAttrs", this.demographicsForm), 
      pronouns: this.demographicsForm.get('pronouns') ? this.demographicsForm.get('pronouns')?.value : "",
      gender: this.getStringToListChar("gender", this.demographicsForm), 
      gender_description: this.demographicsForm.get('genderDesc') ? this.demographicsForm.get('genderDesc')?.value : "",
      race: this.getStringToListChar("race", this.demographicsForm), 
      race_description: this.demographicsForm.get('raceDesc') ? this.demographicsForm.get('raceDesc')?.value : "",
      age: this.demographicsForm.get('ageRange') ? this.demographicsForm.get('ageRange')?.value : "",
      sexual_orientation: this.demographicsForm.get('sexualOrientation') ? this.demographicsForm.get('sexualOrientation')?.value : "",
      sexual_orientation_description: this.demographicsForm.get('sexualOrientationDesc') ? this.demographicsForm.get('sexualOrientationDesc')?.value : "",
      religion: this.demographicsForm.get('religiousAffiliation') ? this.demographicsForm.get('religiousAffiliation')?.value : "",
      religion_description: this.demographicsForm.get('religiousAffiliationDesc') ? this.demographicsForm.get('religiousAffiliationDesc')?.value : "",
      political_leaning: this.demographicsForm.get('politicalLeaning') ? this.demographicsForm.get('politicalLeaning')?.value : "",
      political_description: this.demographicsForm.get('politicalLeaningDesc') ? this.demographicsForm.get('politicalLeaningDesc')?.value : "",
    }
    return this.onboarding;
  }

  /**
   * Submits the full onboarding data to the backend.
   * @param onboardingData A user's onboarding data, including their user ID,
   *                       availability, scenarios, and event preferences.
   */
  submitFullOnboarding(onboardingData: any): Observable<any> {
    // send onboarding data to the backend
    return this.http.post(this.onboardingSubmitEndpoint, onboardingData).pipe(
      catchError(error => {
        console.error('Error submitting onboarding:', error);
        return EMPTY;
      })
    )
  }

  /**
   * Submits the onboarding/preferences data to the backend.
   * 
   * @param user - The user object.
   * @param onboarded - Flag indicating if the user has completed onboarding.
   */
  submitOnboarding(user: User, onboarded: boolean = true) {
    // collect data
    this.getOnboardingData(user, onboarded);

    // send onboarding data to the backend
    this.http.post(this.onboardingUpdateEndpoint, this.onboarding).pipe(
      catchError(error => {
        console.error('Error submitting onboarding:', error);
        return EMPTY;
      })
    ).subscribe(() => {
      console.log('Onboarding submitted successfully!');
      this.fetchOnboarding(); // update onboarding data
    });
  }

  /**
   * Retrieves the list of hobbies from the form control.
   * 
   * @param controlName - The name of the form control.
   * @param form - The form group.
   * @returns List of hobby IDs.
   */
  getHobbyList(controlName: string, form: FormGroup): number[] {
    let hobbies = form.get(controlName)?.value;
    if (!hobbies || hobbies.length == 0) {
      return [];
    }
    return hobbies.map((hobby: Hobby) => hobby.id);
  }
  
  /**
   * Retrieves the string or string array from the form control.
   * 
   * @param controlName - The name of the form control.
   * @param form - The form group.
   * @returns String or string array.
   */
  getStringToListChar(controlName: string, form: FormGroup): string | string[] {
    let char = form.get(controlName)?.value;
    if (!char || char.length == 0) {
      return "";
    }
    return char; 
  }

  /**
   * Submits the scenarios data to the backend.
   */
  getScenarioData(): ScenarioObj[] {
    // collect data
    let scenarioObjs: ScenarioObj[] = [];

    for (let i = 1; i <= maxScenarios; i++) {
      let scenario: Scenario = this.scenariosForm.get(`scenario${i}`)?.value;
      if (scenario) {
        let scenarioObj: ScenarioObj = scenario.scenarioObj;
        let choice = this.scenariosForm.get(`scenario${i}Choice`)?.value;

        scenarioObj.prefers_event1 = choice == 1 ? true : false;
        scenarioObj.prefers_event2 = !scenarioObj.prefers_event1;

        scenarioObjs.push(scenarioObj);
      }
    }
    return scenarioObjs;
  }
}