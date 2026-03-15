// NOTE: since this project is managed by Expo without native modules enabled yet
// we will mock the analytics behavior until the app is ejected/prebuilt for Firebase

export const logEvent = (eventName: string, params?: Record<string, any>) => {
  if (__DEV__) {
    console.log(`[Analytics Event]: ${eventName}`, params);
  }
  // TODO: Add actual analytics implementation when Firebase SDK is integrated
  // e.g., analytics().logEvent(eventName, params);
};

export const setUserId = (userId: string | null) => {
  if (__DEV__) {
    console.log(`[Analytics User]: Set ID to ${userId}`);
  }
  // TODO: e.g., analytics().setUserId(userId);
};

export const setUserProperties = (properties: Record<string, string | null>) => {
  if (__DEV__) {
    console.log(`[Analytics Properties]:`, properties);
  }
  // TODO: e.g., analytics().setUserProperties(properties);
};

export const logScreenView = (screenName: string, screenClass?: string) => {
  if (__DEV__) {
    console.log(`[Analytics Screen]: ${screenName}`);
  }
  // TODO: e.g., analytics().logScreenView({ screen_name: screenName, screen_class: screenClass });
};

export const logError = (error: Error, isFatal: boolean = false) => {
  if (__DEV__) {
    console.error(`[Crashlytics Error] Fatal: ${isFatal}`, error);
  }
  // TODO: e.g., crashlytics().recordError(error);
};
