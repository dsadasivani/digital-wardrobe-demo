import { User, UserGender } from '../models';
import { UpdateUserRequestDto, UserDto } from '../dto/auth.dto';

const USER_GENDERS: readonly UserGender[] = ['male', 'female', 'non-binary', 'prefer-not-to-say'];

export function mapUserDtoToModel(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    gender: toUserGender(dto.gender),
    avatar: dto.avatar ?? undefined,
    preferences: {
      favoriteColors: dto.preferences?.favoriteColors ?? [],
      stylePreferences: dto.preferences?.stylePreferences ?? [],
      location: dto.preferences?.location ?? undefined,
      notificationsEnabled: dto.preferences?.notificationsEnabled ?? true,
      darkMode: dto.preferences?.darkMode ?? false,
    },
    createdAt: toDate(dto.createdAt) ?? new Date(),
  };
}

export function mapUserUpdatesToUpdateRequestDto(updates: Partial<User>): UpdateUserRequestDto {
  return {
    name: updates.name,
    email: updates.email,
    gender: updates.gender,
    avatar: updates.avatar,
    preferences: updates.preferences
      ? {
          favoriteColors: updates.preferences.favoriteColors,
          stylePreferences: updates.preferences.stylePreferences,
          location: updates.preferences.location,
          notificationsEnabled: updates.preferences.notificationsEnabled,
          darkMode: updates.preferences.darkMode,
        }
      : undefined,
  };
}

function toDate(value: string | Date | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toUserGender(value: string | null | undefined): UserGender | undefined {
  return USER_GENDERS.find((gender) => gender === value);
}
