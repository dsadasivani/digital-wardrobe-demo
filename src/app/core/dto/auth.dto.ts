export interface UserPreferencesDto {
  favoriteColors: string[];
  stylePreferences: string[];
  location: string | null;
  notificationsEnabled: boolean;
  darkMode: boolean;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  preferences: UserPreferencesDto;
  createdAt: string;
}

export interface AuthResponseDto {
  token: string;
  user: UserDto;
}

export interface ApiFieldErrorDto {
  field: string;
  message: string;
}

export interface ApiErrorDto {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
  fieldErrors: ApiFieldErrorDto[];
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface SignupRequestDto {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserPreferencesRequestDto {
  favoriteColors?: string[];
  stylePreferences?: string[];
  location?: string;
  notificationsEnabled?: boolean;
  darkMode?: boolean;
}

export interface UpdateUserRequestDto {
  name?: string;
  email?: string;
  avatar?: string;
  preferences?: UpdateUserPreferencesRequestDto;
}
