// Hand-written mirror of supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once a live project exists.
//
// NOTE: these must be `type` aliases, not `interface`s — Supabase's generics
// structurally check row types against `Record<string, unknown>`, and only
// object type literals (not interfaces) get TypeScript's implicit index
// signature, so an `interface` here would silently resolve every query to
// `never`.

export type UserRole = "player" | "owner" | "admin";
export type PitchSize = "5x5" | "7x7" | "11x11";
export type BookingStatus = "confirmed" | "completed" | "cancelled";
export type DepositStatus = "not_required" | "pending" | "paid" | "failed";

export type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
};

export type VenueRow = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  city: string;
  neighborhood: string | null;
  address: string | null;
  lat: number;
  lng: number;
  created_by: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type VenuePublicRow = Omit<
  VenueRow,
  "created_by" | "is_published" | "created_at" | "updated_at"
>;

export type PitchRow = {
  id: string;
  venue_id: string;
  name_ar: string;
  name_en: string;
  size: PitchSize;
  is_indoor: boolean;
  amenities: string[];
  price_per_hour: number;
  slot_duration_minutes: number;
  capacity_min: number;
  capacity_max: number;
  deposit_required: boolean;
  deposit_amount: number;
  advance_booking_deposit_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PitchPublicRow = Omit<
  PitchRow,
  "is_active" | "created_at" | "updated_at"
>;

export type PitchImageRow = {
  id: string;
  pitch_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
};

export type WeeklyAvailabilityRow = {
  id: string;
  pitch_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type AvailabilityExceptionRow = {
  id: string;
  pitch_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_closed: boolean;
  reason: string | null;
  created_at: string;
};

export type BookingHoldRow = {
  id: string;
  pitch_id: string;
  starts_at: string;
  ends_at: string;
  held_by: string;
  status: "active" | "released";
  expires_at: string;
  created_at: string;
};

export type BookingRow = {
  id: string;
  pitch_id: string;
  user_id: string;
  starts_at: string;
  ends_at: string;
  player_count: number;
  total_price: number;
  status: BookingStatus;
  deposit_status: DepositStatus;
  deposit_amount: number;
  created_at: string;
};

export type PaymentRow = {
  id: string;
  booking_id: string;
  provider: string;
  provider_charge_id: string | null;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
};

export type ReviewRow = {
  id: string;
  pitch_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type VenueManagerRow = {
  venue_id: string;
  profile_id: string;
  created_at: string;
};

export type PitchRatingPublicRow = {
  pitch_id: string;
  avg_rating: number;
  review_count: number;
};

type NoRelationships = { Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow> & { id: string }; Update: Partial<ProfileRow> } & NoRelationships;
      venues: { Row: VenueRow; Insert: Partial<VenueRow>; Update: Partial<VenueRow> } & NoRelationships;
      venue_managers: { Row: VenueManagerRow; Insert: Partial<VenueManagerRow> & Pick<VenueManagerRow, "venue_id" | "profile_id">; Update: Partial<VenueManagerRow> } & NoRelationships;
      pitches: { Row: PitchRow; Insert: Partial<PitchRow>; Update: Partial<PitchRow> } & NoRelationships;
      pitch_images: { Row: PitchImageRow; Insert: Partial<PitchImageRow>; Update: Partial<PitchImageRow> } & NoRelationships;
      weekly_availability: { Row: WeeklyAvailabilityRow; Insert: Partial<WeeklyAvailabilityRow>; Update: Partial<WeeklyAvailabilityRow> } & NoRelationships;
      availability_exceptions: { Row: AvailabilityExceptionRow; Insert: Partial<AvailabilityExceptionRow>; Update: Partial<AvailabilityExceptionRow> } & NoRelationships;
      booking_holds: { Row: BookingHoldRow; Insert: Partial<BookingHoldRow>; Update: Partial<BookingHoldRow> } & NoRelationships;
      bookings: { Row: BookingRow; Insert: Partial<BookingRow>; Update: Partial<BookingRow> } & NoRelationships;
      payments: { Row: PaymentRow; Insert: Partial<PaymentRow>; Update: Partial<PaymentRow> } & NoRelationships;
      reviews: { Row: ReviewRow; Insert: Partial<ReviewRow>; Update: Partial<ReviewRow> } & NoRelationships;
    };
    Views: {
      venue_public: { Row: VenuePublicRow } & NoRelationships;
      pitch_public: { Row: PitchPublicRow } & NoRelationships;
      pitch_rating_public: { Row: PitchRatingPublicRow } & NoRelationships;
    };
    Functions: Record<string, never>;
  };
};
