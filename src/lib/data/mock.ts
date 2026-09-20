import type {
  AvailabilityExceptionRow,
  PitchPublicRow,
  ReviewRow,
  VenuePublicRow,
  WeeklyAvailabilityRow,
} from "@/lib/types/database";
import type { PitchListItem } from "@/lib/types/domain";

/**
 * Sample catalog used whenever Supabase env vars aren't configured, so the
 * app is fully browsable during local development/preview. Every data
 * fetcher in src/lib/data mirrors the real Supabase query shape, so swapping
 * this out for a live project requires no UI changes.
 */

export const MOCK_VENUES: VenuePublicRow[] = [
  {
    id: "venue-1",
    name_ar: "أكاديمية الشباب الرياضية",
    name_en: "Al Shabab Sports Academy",
    description_ar: "مجمع ملاعب حديث بإضاءة ليلية كاملة ومواقف سيارات واسعة.",
    description_en: "Modern pitch complex with full night lighting and ample parking.",
    city: "الرياض",
    neighborhood: "حي الملقا",
    address: "طريق الملك فهد، حي الملقا، الرياض",
    lat: 24.7784,
    lng: 46.6392,
  },
  {
    id: "venue-2",
    name_ar: "ملاعب الواحة",
    name_en: "Al Waha Pitches",
    description_ar: "ملاعب عشب صناعي مغطاة وغير مغطاة، قريبة من العليا.",
    description_en: "Covered and open-air artificial turf pitches near Olaya.",
    city: "الرياض",
    neighborhood: "حي العليا",
    address: "شارع التخصصي، حي العليا، الرياض",
    lat: 24.6944,
    lng: 46.6849,
  },
  {
    id: "venue-3",
    name_ar: "مركز النخبة الرياضي",
    name_en: "Al Nukhba Sports Center",
    description_ar: "منشأة رياضية متكاملة مع كافيتريا ومرافق تبديل ملابس.",
    description_en: "Full sports facility with a cafeteria and changing rooms.",
    city: "جدة",
    neighborhood: "حي الشاطئ",
    address: "طريق الكورنيش، حي الشاطئ، جدة",
    lat: 21.5905,
    lng: 39.1653,
  },
];

export const MOCK_PITCHES: PitchPublicRow[] = [
  {
    id: "pitch-1",
    venue_id: "venue-1",
    name_ar: "ملعب A - عشب صناعي",
    name_en: "Pitch A - Artificial Turf",
    size: "7x7",
    is_indoor: false,
    amenities: ["دورات مياه", "إضاءة ليلية", "مواقف سيارات", "واي فاي"],
    price_per_hour: 180,
    slot_duration_minutes: 60,
    capacity_min: 10,
    capacity_max: 14,
    deposit_required: true,
    deposit_amount: 50,
    advance_booking_deposit_days: 5,
  },
  {
    id: "pitch-2",
    venue_id: "venue-1",
    name_ar: "ملعب B - خماسي مغطى",
    name_en: "Pitch B - Covered 5-a-side",
    size: "5x5",
    is_indoor: true,
    amenities: ["مكيف", "دورات مياه", "مقصورة"],
    price_per_hour: 150,
    slot_duration_minutes: 60,
    capacity_min: 6,
    capacity_max: 10,
    deposit_required: false,
    deposit_amount: 0,
    advance_booking_deposit_days: 5,
  },
  {
    id: "pitch-3",
    venue_id: "venue-2",
    name_ar: "ملعب الواحة الرئيسي",
    name_en: "Al Waha Main Pitch",
    size: "11x11",
    is_indoor: false,
    amenities: ["دورات مياه", "إضاءة ليلية", "مدرجات"],
    price_per_hour: 320,
    slot_duration_minutes: 90,
    capacity_min: 18,
    capacity_max: 22,
    deposit_required: true,
    deposit_amount: 100,
    advance_booking_deposit_days: 5,
  },
  {
    id: "pitch-4",
    venue_id: "venue-3",
    name_ar: "ملعب النخبة السباعي",
    name_en: "Al Nukhba 7-a-side",
    size: "7x7",
    is_indoor: false,
    amenities: ["كافيتريا", "دورات مياه", "مواقف سيارات", "إضاءة ليلية"],
    price_per_hour: 200,
    slot_duration_minutes: 60,
    capacity_min: 10,
    capacity_max: 14,
    deposit_required: false,
    deposit_amount: 80,
    advance_booking_deposit_days: 5,
  },
];

const IMAGES = [
  "/images/pitch-placeholder-1.svg",
  "/images/pitch-placeholder-2.svg",
  "/images/pitch-placeholder-3.svg",
  "/images/pitch-placeholder-4.svg",
];

export const MOCK_PITCH_IMAGES: Record<string, string[]> = {
  "pitch-1": [IMAGES[0], IMAGES[1], IMAGES[2]],
  "pitch-2": [IMAGES[1], IMAGES[2]],
  "pitch-3": [IMAGES[2], IMAGES[3], IMAGES[0]],
  "pitch-4": [IMAGES[3], IMAGES[0], IMAGES[1]],
};

export const MOCK_WEEKLY_AVAILABILITY: WeeklyAvailabilityRow[] = MOCK_PITCHES.flatMap(
  (pitch) =>
    Array.from({ length: 7 }, (_, day) => ({
      id: `${pitch.id}-day-${day}`,
      pitch_id: pitch.id,
      day_of_week: day,
      start_time: "06:00:00",
      end_time: "23:30:00",
    })),
);

export const MOCK_EXCEPTIONS: AvailabilityExceptionRow[] = [];

export const MOCK_REVIEWS: ReviewRow[] = [
  {
    id: "rev-1",
    pitch_id: "pitch-1",
    user_id: "user-a",
    rating: 5,
    comment: "أرضية ممتازة وإضاءة رائعة، التجربة كانت احترافية.",
    created_at: "2025-08-01T18:00:00Z",
  },
  {
    id: "rev-2",
    pitch_id: "pitch-1",
    user_id: "user-b",
    rating: 4,
    comment: "موقع سهل الوصول لكن مواقف السيارات مزدحمة أحيانًا.",
    created_at: "2025-08-10T19:30:00Z",
  },
  {
    id: "rev-3",
    pitch_id: "pitch-3",
    user_id: "user-c",
    rating: 5,
    comment: "Great pitch for full 11-a-side matches, well maintained.",
    created_at: "2025-08-15T20:00:00Z",
  },
];

export function buildMockPitchListItems(): PitchListItem[] {
  return MOCK_PITCHES.map((pitch) => {
    const venue = MOCK_VENUES.find((v) => v.id === pitch.venue_id)!;
    const reviews = MOCK_REVIEWS.filter((r) => r.pitch_id === pitch.id);
    const avgRating = reviews.length
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : null;

    return {
      pitch,
      venue,
      images: MOCK_PITCH_IMAGES[pitch.id] ?? [IMAGES[0]],
      avgRating,
      reviewCount: reviews.length,
    };
  });
}
