import type {
  AvailabilityExceptionRow,
  PitchPublicRow,
  ReviewRow,
  VenuePublicRow,
  WeeklyAvailabilityRow,
} from "./database";

export interface PitchListItem {
  pitch: PitchPublicRow;
  venue: VenuePublicRow;
  images: string[];
  avgRating: number | null;
  reviewCount: number;
  hasSlotsToday?: boolean;
}

export interface PitchDetail extends PitchListItem {
  weeklyAvailability: WeeklyAvailabilityRow[];
  exceptions: AvailabilityExceptionRow[];
  reviews: (ReviewRow & { authorInitial: string })[];
}

export interface HomeFilters {
  query?: string;
  size?: PitchPublicRow["size"] | "any";
  indoor?: "indoor" | "outdoor" | "any";
  availableToday?: boolean;
}

export interface TimeSlot {
  startsAt: string; // ISO
  endsAt: string; // ISO
  isAvailable: boolean;
}
