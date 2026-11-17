import type { ExerciseDefinition } from './models';

// Common repetition-based movements; saved user definitions take precedence.
export const expandedExercises: ExerciseDefinition[] = [
  {
    "id": "decline-barbell-press",
    "name": "Decline Barbell Bench Press",
    "equipment": "barbell",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [
        "triceps",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Secure your legs on a modest decline bench; use rack safeties or a spotter. Log total bar plus plates.",
    "chestEmphasis": "mixed",
    "isCustom": false
  },
  {
    "id": "decline-db-press",
    "name": "Decline Dumbbell Press",
    "equipment": "dumbbell",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [
        "triceps",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Secure your legs on a decline bench and plan a controlled handoff. Log one dumbbell’s weight.",
    "chestEmphasis": "mixed",
    "isCustom": false
  },
  {
    "id": "db-floor-press",
    "name": "Dumbbell Floor Press",
    "equipment": "dumbbell",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [
        "triceps",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Lie on the floor; lightly pause the upper arms on the floor without bouncing. Log weight per dumbbell.",
    "chestEmphasis": "mid",
    "isCustom": false
  },
  {
    "id": "barbell-floor-press",
    "name": "Barbell Floor Press",
    "equipment": "barbell",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [
        "triceps",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a rack set for floor pressing; lower until upper arms gently meet the floor. Log bar plus plates.",
    "chestEmphasis": "mid",
    "isCustom": false
  },
  {
    "id": "close-grip-db-press",
    "name": "Dumbbell Squeeze Press",
    "equipment": "dumbbell",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [
        "triceps",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "On a flat bench keep the dumbbells together with a neutral grip. Log weight per dumbbell.",
    "chestEmphasis": "mid",
    "isCustom": false
  },
  {
    "id": "reverse-grip-bench-press",
    "name": "Reverse-grip Bench Press",
    "equipment": "barbell",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [
        "triceps",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a closed underhand grip, rack safeties and a spotter for unracking. Log bar plus plates.",
    "chestEmphasis": "upper",
    "isCustom": false
  },
  {
    "id": "incline-db-fly",
    "name": "Incline Dumbbell Fly",
    "equipment": "dumbbell",
    "muscleContribution": {
      "chest": 1
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a modest incline, a soft elbow bend and a controlled comfortable range. Log weight per dumbbell.",
    "chestEmphasis": "upper",
    "isCustom": false
  },
  {
    "id": "high-low-cable-fly",
    "name": "High-to-low Cable Fly",
    "equipment": "cable",
    "muscleContribution": {
      "chest": 1
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Set pulleys high and sweep hands down and inward with elbows softly bent. Log one cable stack’s load.",
    "chestEmphasis": "mixed",
    "isCustom": false
  },
  {
    "id": "bodyweight-squat",
    "name": "Bodyweight Squat",
    "equipment": "bodyweight",
    "muscleContribution": {
      "quads": 1,
      "glutes": 0.5
    },
    "muscleRoles": {
      "direct": [
        "quads"
      ],
      "indirect": [
        "glutes"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Air Squat",
      "Unweighted Squat"
    ],
    "setupNotes": "Keep your feet planted, bend at the hips and knees, and descend through a controlled comfortable range before standing. Log added external weight only; use 0 kg for bodyweight.",
    "isCustom": false
  },
  {
    "id": "weighted-push-up",
    "name": "Weighted Push-up",
    "equipment": "bodyweight",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [
        "triceps",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Weighted Pushup",
      "Dip-belt Push-up"
    ],
    "setupNotes": "Use stable raised hand supports and a securely fitted dip belt with plates as demonstrated. Keep a braced body line and control the descent. Log added external weight only; record support height and loading setup.",
    "chestEmphasis": "mixed",
    "isCustom": false
  },
  {
    "id": "incline-push-up",
    "name": "Incline Push-up",
    "equipment": "bodyweight",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [
        "triceps",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Place hands on a stable raised surface; keep your body in one line and record hand height. Log added external weight only.",
    "chestEmphasis": "mixed",
    "isCustom": false
  },
  {
    "id": "knee-push-up",
    "name": "Knee Push-up",
    "equipment": "bodyweight",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [
        "triceps",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Support on hands and knees with a straight line from knees to head. Log added external weight only.",
    "chestEmphasis": "mixed",
    "isCustom": false
  },
  {
    "id": "diamond-push-up",
    "name": "Diamond Push-up",
    "equipment": "bodyweight",
    "muscleContribution": {
      "triceps": 1,
      "chest": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "triceps"
      ],
      "indirect": [
        "chest",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a close hand position under the chest and controlled elbow travel. Log added external weight only.",
    "chestEmphasis": "mixed",
    "isCustom": false
  },
  {
    "id": "deficit-push-up",
    "name": "Deficit Push-up",
    "equipment": "bodyweight",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [
        "triceps",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use stable handles or blocks and lower through a controlled comfortable deeper range. Log added external weight only; record handle height.",
    "chestEmphasis": "mixed",
    "isCustom": false
  },
  {
    "id": "band-chest-press",
    "name": "Band Chest Press",
    "equipment": "band",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [
        "triceps",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Anchor a band securely behind you around chest height and press forward. Record band and anchor distance; log 0 kg if band resistance is unmeasured.",
    "chestEmphasis": "mixed",
    "isCustom": false
  },
  {
    "id": "band-chest-fly",
    "name": "Band Chest Fly",
    "equipment": "band",
    "muscleContribution": {
      "chest": 1
    },
    "muscleRoles": {
      "direct": [
        "chest"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Anchor a band securely behind you and bring softly bent arms together in an arc. Record band and anchor distance; log 0 kg if resistance is unmeasured.",
    "chestEmphasis": "mixed",
    "isCustom": false
  },
  {
    "id": "seated-barbell-press",
    "name": "Seated Barbell Shoulder Press",
    "equipment": "barbell",
    "muscleContribution": {
      "frontDelts": 1,
      "sideDelts": 0.5,
      "triceps": 0.5
    },
    "muscleRoles": {
      "direct": [
        "frontDelts"
      ],
      "indirect": [
        "sideDelts",
        "triceps"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a rack and supported upright bench; keep ribs controlled as you press overhead. Log total bar plus plates.",
    "isCustom": false
  },
  {
    "id": "standing-db-press",
    "name": "Standing Dumbbell Shoulder Press",
    "equipment": "dumbbell",
    "muscleContribution": {
      "frontDelts": 1,
      "sideDelts": 0.5,
      "triceps": 0.5
    },
    "muscleRoles": {
      "direct": [
        "frontDelts"
      ],
      "indirect": [
        "sideDelts",
        "triceps"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Stand braced without a leg drive; press both dumbbells overhead. Log weight per dumbbell.",
    "isCustom": false
  },
  {
    "id": "arnold-press",
    "name": "Arnold Press",
    "equipment": "dumbbell",
    "muscleContribution": {
      "frontDelts": 1,
      "sideDelts": 0.5,
      "triceps": 0.5
    },
    "muscleRoles": {
      "direct": [
        "frontDelts"
      ],
      "indirect": [
        "sideDelts",
        "triceps"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Start with palms facing you and rotate smoothly as you press overhead. Log weight per dumbbell.",
    "isCustom": false
  },
  {
    "id": "landmine-press",
    "name": "Single-arm Landmine Press",
    "equipment": "barbell",
    "muscleContribution": {
      "frontDelts": 1,
      "chest": 0.5,
      "triceps": 0.5
    },
    "muscleRoles": {
      "direct": [
        "frontDelts"
      ],
      "indirect": [
        "chest",
        "triceps"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Secure one end of the bar in a landmine anchor and press the sleeve upward and forward. Log plates on the loaded end only and reps per side; do not double set counts.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "single-arm-db-press",
    "name": "Single-arm Dumbbell Shoulder Press",
    "equipment": "dumbbell",
    "muscleContribution": {
      "frontDelts": 1,
      "sideDelts": 0.5,
      "triceps": 0.5
    },
    "muscleRoles": {
      "direct": [
        "frontDelts"
      ],
      "indirect": [
        "sideDelts",
        "triceps"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Brace your torso and press one dumbbell overhead without leaning. Log dumbbell load and reps per side; do not double set counts.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "smith-shoulder-press",
    "name": "Smith Machine Shoulder Press",
    "equipment": "machine",
    "muscleContribution": {
      "frontDelts": 1,
      "sideDelts": 0.5,
      "triceps": 0.5
    },
    "muscleRoles": {
      "direct": [
        "frontDelts"
      ],
      "indirect": [
        "sideDelts",
        "triceps"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Set a supported bench so the bar path clears your face; set stops. Record the machine’s bar and added-load convention.",
    "isCustom": false
  },
  {
    "id": "db-front-raise",
    "name": "Dumbbell Front Raise",
    "equipment": "dumbbell",
    "muscleContribution": {
      "frontDelts": 1
    },
    "muscleRoles": {
      "direct": [
        "frontDelts"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Raise dumbbells in front with controlled torso position. Log weight per dumbbell and reps per arm when alternating.",
    "isCustom": false
  },
  {
    "id": "cable-front-raise",
    "name": "Cable Front Raise",
    "equipment": "cable",
    "muscleContribution": {
      "frontDelts": 1
    },
    "muscleRoles": {
      "direct": [
        "frontDelts"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a low pulley and raise the handle in front without swinging. Log stack load; record attachment and whether the exercise is bilateral.",
    "isCustom": false
  },
  {
    "id": "kettlebell-shoulder-press",
    "name": "Kettlebell Shoulder Press",
    "equipment": "other",
    "muscleContribution": {
      "frontDelts": 1,
      "sideDelts": 0.5,
      "triceps": 0.5
    },
    "muscleRoles": {
      "direct": [
        "frontDelts"
      ],
      "indirect": [
        "sideDelts",
        "triceps"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Kettlebell Press",
      "KB Shoulder Press"
    ],
    "setupNotes": "Start one kettlebell in a stable rack and press overhead without leg drive. Log bell weight and reps per side; do not double set counts.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "db-reverse-fly",
    "name": "Dumbbell Reverse Fly",
    "equipment": "dumbbell",
    "muscleContribution": {
      "rearDelts": 1,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "rearDelts"
      ],
      "indirect": [
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Hinge at the hips or support the chest on an incline bench; move arms outward without swinging. Log weight per dumbbell.",
    "isCustom": false
  },
  {
    "id": "cable-reverse-fly",
    "name": "Cable Reverse Fly",
    "equipment": "cable",
    "muscleContribution": {
      "rearDelts": 1,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "rearDelts"
      ],
      "indirect": [
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Cross the cable handles and move arms outward with a soft elbow bend. Log one stack’s load and cable height.",
    "isCustom": false
  },
  {
    "id": "band-pull-apart",
    "name": "Band Pull-apart",
    "equipment": "band",
    "muscleContribution": {
      "rearDelts": 1,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "rearDelts"
      ],
      "indirect": [
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Hold a band in front and pull hands apart without arching your back. Record band and grip width; log 0 kg if resistance is unmeasured.",
    "isCustom": false
  },
  {
    "id": "cable-upright-row",
    "name": "Cable Upright Row",
    "equipment": "cable",
    "muscleContribution": {
      "sideDelts": 1,
      "upperBack": 0.5,
      "biceps": 0.5
    },
    "muscleRoles": {
      "direct": [
        "sideDelts"
      ],
      "indirect": [
        "upperBack",
        "biceps"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a low pulley and raise elbows through a comfortable range; avoid forcing the handles high. Log stack load and attachment.",
    "isCustom": false
  },
  {
    "id": "push-press",
    "name": "Barbell Push Press",
    "equipment": "barbell",
    "muscleContribution": {
      "frontDelts": 1,
      "triceps": 0.5,
      "sideDelts": 0.5,
      "quads": 0.5,
      "glutes": 0.5
    },
    "muscleRoles": {
      "direct": [
        "frontDelts"
      ],
      "indirect": [
        "triceps",
        "sideDelts",
        "quads",
        "glutes"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a short vertical knee dip then drive the bar overhead; finish with straight legs. Log bar plus plates.",
    "isCustom": false
  },
  {
    "id": "seated-db-lateral-raise",
    "name": "Seated Dumbbell Lateral Raise",
    "equipment": "dumbbell",
    "muscleContribution": {
      "sideDelts": 1
    },
    "muscleRoles": {
      "direct": [
        "sideDelts"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Sit tall and raise dumbbells out to your sides without swinging. Log weight per dumbbell.",
    "isCustom": false
  },
  {
    "id": "leaning-cable-lateral-raise",
    "name": "Leaning Cable Lateral Raise",
    "equipment": "cable",
    "muscleContribution": {
      "sideDelts": 1
    },
    "muscleRoles": {
      "direct": [
        "sideDelts"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Hold a stable support, lean gently away and raise the working arm outward. Log stack load and reps per side; do not double set counts.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "close-grip-bench-press",
    "name": "Close-grip Barbell Bench Press",
    "equipment": "barbell",
    "muscleContribution": {
      "triceps": 1,
      "chest": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "triceps"
      ],
      "indirect": [
        "chest",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a comfortable roughly shoulder-width grip with wrists over forearms; use rack safeties. Log bar plus plates.",
    "isCustom": false
  },
  {
    "id": "ez-bar-skullcrusher",
    "name": "EZ-bar Skullcrusher",
    "equipment": "barbell",
    "muscleContribution": {
      "triceps": 1
    },
    "muscleRoles": {
      "direct": [
        "triceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Lie on a bench and bend the elbows to lower the EZ bar under control. Log EZ bar plus plates.",
    "isCustom": false
  },
  {
    "id": "db-skullcrusher",
    "name": "Dumbbell Skullcrusher",
    "equipment": "dumbbell",
    "muscleContribution": {
      "triceps": 1
    },
    "muscleRoles": {
      "direct": [
        "triceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Lie on a bench with neutral-grip dumbbells and extend elbows without swinging upper arms. Log weight per dumbbell.",
    "isCustom": false
  },
  {
    "id": "db-overhead-triceps",
    "name": "Dumbbell Overhead Triceps Extension",
    "equipment": "dumbbell",
    "muscleContribution": {
      "triceps": 1
    },
    "muscleRoles": {
      "direct": [
        "triceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Hold one dumbbell with both hands overhead and lower it behind your head under control. Log the single dumbbell’s total weight.",
    "isCustom": false
  },
  {
    "id": "single-arm-db-triceps-extension",
    "name": "Single-arm Dumbbell Triceps Extension",
    "equipment": "dumbbell",
    "muscleContribution": {
      "triceps": 1
    },
    "muscleRoles": {
      "direct": [
        "triceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Hold one dumbbell overhead and bend and straighten the elbow with a stable upper arm. Log load and reps per side; do not double set counts.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "cable-triceps-kickback",
    "name": "Cable Triceps Kickback",
    "equipment": "cable",
    "muscleContribution": {
      "triceps": 1
    },
    "muscleRoles": {
      "direct": [
        "triceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Hinge with a stable torso, keep the upper arm back and extend the elbow. Log stack load and reps per side; do not double set counts.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "db-triceps-kickback",
    "name": "Dumbbell Triceps Kickback",
    "equipment": "dumbbell",
    "muscleContribution": {
      "triceps": 1
    },
    "muscleRoles": {
      "direct": [
        "triceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Support your torso, keep the working upper arm still and extend the elbow. Log dumbbell load and reps per side; do not double set counts.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "reverse-grip-triceps-pushdown",
    "name": "Reverse-grip Triceps Pushdown",
    "equipment": "cable",
    "muscleContribution": {
      "triceps": 1
    },
    "muscleRoles": {
      "direct": [
        "triceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a high pulley and an underhand bar grip; keep elbows near your sides. Log stack load and attachment.",
    "isCustom": false
  },
  {
    "id": "single-arm-triceps-pushdown",
    "name": "Single-arm Triceps Pushdown",
    "equipment": "cable",
    "muscleContribution": {
      "triceps": 1
    },
    "muscleRoles": {
      "direct": [
        "triceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use one high-pulley handle and extend the elbow without torso momentum. Log stack load and reps per side; do not double set counts.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "triceps-dip",
    "name": "Triceps-focused Dip",
    "equipment": "bodyweight",
    "muscleContribution": {
      "triceps": 1,
      "chest": 0.5,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "triceps"
      ],
      "indirect": [
        "chest",
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use parallel bars with a relatively upright torso and a controlled comfortable depth. Log added external weight only; 0 kg means bodyweight.",
    "isCustom": false
  },
  {
    "id": "machine-triceps-extension",
    "name": "Machine Triceps Extension",
    "equipment": "machine",
    "muscleContribution": {
      "triceps": 1
    },
    "muscleRoles": {
      "direct": [
        "triceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Adjust the seat so elbows align with the machine pivot and upper arms rest on the pad. Log stack load and machine settings.",
    "isCustom": false
  },
  {
    "id": "assisted-pull-up",
    "name": "Assisted Pull-up",
    "equipment": "machine",
    "muscleContribution": {
      "lats": 1,
      "biceps": 0.5,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats"
      ],
      "indirect": [
        "biceps",
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Machine-assisted Pull-up",
      "Assisted Pullup"
    ],
    "setupNotes": "Set the knee pad and overhand grip, enter using the step, and pull without bouncing. Log 0 kg external load; record machine assistance and settings in notes. Assistance is not lifted external weight.",
    "isCustom": false
  },
  {
    "id": "assisted-chin-up",
    "name": "Assisted Chin-up",
    "equipment": "machine",
    "muscleContribution": {
      "lats": 1,
      "biceps": 0.5,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats"
      ],
      "indirect": [
        "biceps",
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Machine-assisted Chin-up",
      "Assisted Chinup"
    ],
    "setupNotes": "Use a shoulder-width underhand grip on an assisted pull-up machine. Log 0 kg external load; record assistance and machine settings in notes, since more assistance reduces the demand.",
    "isCustom": false
  },
  {
    "id": "neutral-grip-pull-up",
    "name": "Neutral-grip Pull-up",
    "equipment": "bodyweight",
    "muscleContribution": {
      "lats": 1,
      "biceps": 0.5,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats"
      ],
      "indirect": [
        "biceps",
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Parallel-grip Pull-up",
      "Neutral Grip Pullup"
    ],
    "setupNotes": "Use parallel handles with palms facing each other. Keep the body controlled through the pull and descent. Log only added external load; use 0 kg when unweighted.",
    "isCustom": false
  },
  {
    "id": "inverted-row",
    "name": "Inverted Row",
    "equipment": "bodyweight",
    "muscleContribution": {
      "upperBack": 1,
      "lats": 1,
      "biceps": 0.5,
      "rearDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "upperBack",
        "lats"
      ],
      "indirect": [
        "biceps",
        "rearDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Australian Pull-up",
      "Bodyweight Row"
    ],
    "setupNotes": "Secure a bar in a rack or Smith machine. Keep a straight body and row the lower chest toward the bar. Raise the bar or bend the knees to reduce difficulty. Log only added external load; 0 kg when unweighted.",
    "isCustom": false
  },
  {
    "id": "single-arm-lat-pulldown",
    "name": "Single-arm Lat Pulldown",
    "equipment": "cable",
    "muscleContribution": {
      "lats": 1,
      "biceps": 0.5,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats"
      ],
      "indirect": [
        "biceps",
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "One-arm Lat Pulldown"
    ],
    "setupNotes": "Use a single handle at a high pulley, secure the thighs, and pull one elbow down toward the ribs without twisting. Log the working-side stack setting.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "underhand-lat-pulldown",
    "name": "Underhand Lat Pulldown",
    "equipment": "cable",
    "muscleContribution": {
      "lats": 1,
      "biceps": 0.5,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats"
      ],
      "indirect": [
        "biceps",
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Reverse-grip Lat Pulldown",
      "Supinated Lat Pulldown"
    ],
    "setupNotes": "Secure the thigh pad, take a comfortable shoulder-width underhand grip, and pull toward the upper chest with a small, consistent backward lean.",
    "isCustom": false
  },
  {
    "id": "kneeling-lat-pulldown",
    "name": "Kneeling Lat Pulldown",
    "equipment": "cable",
    "muscleContribution": {
      "lats": 1,
      "biceps": 0.5,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats"
      ],
      "indirect": [
        "biceps",
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Kneeling Cable Pulldown"
    ],
    "setupNotes": "Set the pulley high, hold a pulldown attachment, and kneel facing it with enough space for a full controlled reach. Keep the hips and ribs steady rather than leaning back.",
    "isCustom": false
  },
  {
    "id": "wide-grip-seated-row",
    "name": "Wide-grip Seated Cable Row",
    "equipment": "cable",
    "muscleContribution": {
      "upperBack": 1,
      "rearDelts": 1,
      "lats": 0.5,
      "biceps": 0.5
    },
    "muscleRoles": {
      "direct": [
        "upperBack",
        "rearDelts"
      ],
      "indirect": [
        "lats",
        "biceps"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Wide-grip Cable Row"
    ],
    "setupNotes": "Attach a wide bar and brace the feet. Row toward the lower chest with elbows comfortably out, allowing controlled shoulder-blade motion without rocking backward.",
    "isCustom": false
  },
  {
    "id": "single-arm-cable-row",
    "name": "Single-arm Cable Row",
    "equipment": "cable",
    "muscleContribution": {
      "lats": 1,
      "upperBack": 1,
      "biceps": 0.5,
      "rearDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats",
        "upperBack"
      ],
      "indirect": [
        "biceps",
        "rearDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "One-arm Seated Cable Row"
    ],
    "setupNotes": "Use a single handle at a seated low cable station. Keep the torso square and drive the elbow back while controlling the return. Log one working-side stack setting.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "high-machine-row",
    "name": "High Machine Row",
    "equipment": "machine",
    "muscleContribution": {
      "lats": 1,
      "upperBack": 1,
      "biceps": 0.5,
      "rearDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats",
        "upperBack"
      ],
      "indirect": [
        "biceps",
        "rearDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Machine High Row",
      "Plate-loaded High Row"
    ],
    "setupNotes": "Set the seat and chest pad so you can reach the high handles without leaving the pad. Pull down and back toward the ribs, then return under control. Record machine settings for comparisons.",
    "isCustom": false
  },
  {
    "id": "chest-supported-t-bar-row",
    "name": "Chest-supported T-bar Row",
    "equipment": "machine",
    "muscleContribution": {
      "upperBack": 1,
      "lats": 1,
      "biceps": 0.5,
      "rearDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "upperBack",
        "lats"
      ],
      "indirect": [
        "biceps",
        "rearDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Supported T-bar Row"
    ],
    "setupNotes": "Use a purpose-built chest-supported T-bar machine, with sternum on the pad and feet braced. Row without lifting the chest. Log the plates added to the machine and keep the convention consistent.",
    "isCustom": false
  },
  {
    "id": "meadows-row",
    "name": "Meadows Row",
    "equipment": "barbell",
    "muscleContribution": {
      "lats": 1,
      "upperBack": 1,
      "biceps": 0.5,
      "rearDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats",
        "upperBack"
      ],
      "indirect": [
        "biceps",
        "rearDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "One-arm Meadows Row"
    ],
    "setupNotes": "Secure the bar in a landmine. Stand side-on near its loaded end, brace the free arm on the thigh, grip the sleeve overhand, and row without rotating. Use small plates for clearance. Record plates on the working end consistently.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "pendlay-row",
    "name": "Pendlay Row",
    "equipment": "barbell",
    "muscleContribution": {
      "upperBack": 1,
      "lats": 1,
      "biceps": 0.5,
      "rearDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "upperBack",
        "lats"
      ],
      "indirect": [
        "biceps",
        "rearDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Dead-stop Barbell Row"
    ],
    "setupNotes": "Hinge with the torso close to horizontal and brace. Pull the bar from a dead stop toward the lower chest, then reset it on the floor each repetition. Log bar plus plates.",
    "isCustom": false
  },
  {
    "id": "underhand-barbell-row",
    "name": "Underhand Barbell Row",
    "equipment": "barbell",
    "muscleContribution": {
      "lats": 1,
      "upperBack": 1,
      "biceps": 0.5,
      "rearDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats",
        "upperBack"
      ],
      "indirect": [
        "biceps",
        "rearDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Supinated Barbell Row",
      "Reverse-grip Barbell Row"
    ],
    "setupNotes": "Use a comfortable underhand grip and a stable hip hinge. Row toward the lower ribs with elbows close, keeping the torso angle consistent. Log bar plus plates.",
    "isCustom": false
  },
  {
    "id": "db-pullover",
    "name": "Dumbbell Pullover",
    "equipment": "dumbbell",
    "muscleContribution": {
      "lats": 1,
      "chest": 1
    },
    "muscleRoles": {
      "direct": [
        "lats",
        "chest"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Dumbbell Pull-over"
    ],
    "setupNotes": "Support the upper body securely on a bench and hold one dumbbell with both hands. Maintain a slight fixed elbow bend and move at the shoulders through a comfortable overhead arc. Log the single dumbbell weight.",
    "isCustom": false
  },
  {
    "id": "machine-pullover",
    "name": "Machine Pullover",
    "equipment": "machine",
    "muscleContribution": {
      "lats": 1,
      "chest": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats"
      ],
      "indirect": [
        "chest"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Pullover Machine"
    ],
    "setupNotes": "Adjust the seat and range stops to the machine instructions. Keep the torso supported and pull the upper-arm pads through a controlled arc without crunching forward.",
    "isCustom": false
  },
  {
    "id": "db-shrug",
    "name": "Dumbbell Shrug",
    "equipment": "dumbbell",
    "muscleContribution": {
      "upperBack": 1
    },
    "muscleRoles": {
      "direct": [
        "upperBack"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Dumbbell Shoulder Shrug"
    ],
    "setupNotes": "Hold dumbbells at the sides and lift the shoulders under control, keeping the elbows straight. Avoid bouncing or rolling the shoulders. Use the same per-dumbbell logging convention each time.",
    "isCustom": false
  },
  {
    "id": "smith-shrug",
    "name": "Smith Machine Shrug",
    "equipment": "machine",
    "muscleContribution": {
      "upperBack": 1
    },
    "muscleRoles": {
      "direct": [
        "upperBack"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Smith Shrug"
    ],
    "setupNotes": "Set the Smith bar near thigh height with stops in place. Stand where the bar can travel freely, then elevate and lower the shoulders with controlled reps. Record added plates and the machine used consistently.",
    "isCustom": false
  },
  {
    "id": "spider-curl",
    "name": "Spider Curl",
    "equipment": "barbell",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Barbell Spider Curl",
      "EZ-bar Spider Curl"
    ],
    "setupNotes": "Lie chest-down on an incline bench with a bar or EZ bar hanging below the shoulders. Keep upper arms still while curling and lowering. Log bar plus plates.",
    "isCustom": false
  },
  {
    "id": "barbell-preacher-curl",
    "name": "Barbell Preacher Curl",
    "equipment": "barbell",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "EZ-bar Preacher Curl",
      "Scott Curl"
    ],
    "setupNotes": "Set the preacher bench so the upper arms rest fully on the pad. Use a bar or EZ bar, curl without lifting the upper arms, and lower without bouncing at the bottom. Log bar plus plates.",
    "isCustom": false
  },
  {
    "id": "db-preacher-curl",
    "name": "Dumbbell Preacher Curl",
    "equipment": "dumbbell",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "One-arm Preacher Curl",
      "Dumbbell Scott Curl"
    ],
    "setupNotes": "Rest the back of one upper arm on a preacher pad or the steep face of an incline bench. Keep the shoulder stable and lower the dumbbell under control without bouncing. Log one dumbbell weight.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "high-cable-curl",
    "name": "High Cable Curl",
    "equipment": "cable",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Overhead Cable Curl",
      "Hercules Curl"
    ],
    "setupNotes": "Stand between high pulleys with single handles and upper arms held out to the sides. Curl toward the head without moving the upper arms or leaning. Record the setting per stack consistently.",
    "isCustom": false
  },
  {
    "id": "cable-preacher-curl",
    "name": "Cable Preacher Curl",
    "equipment": "cable",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Low-cable Preacher Curl"
    ],
    "setupNotes": "Place a preacher pad in front of a low cable and attach a bar. Support the upper arms fully and curl without lifting them off the pad. Keep cable tension through a comfortable range.",
    "isCustom": false
  },
  {
    "id": "band-assisted-pull-up",
    "name": "Band-assisted Pull-up",
    "equipment": "band",
    "muscleContribution": {
      "lats": 1,
      "biceps": 0.5,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats"
      ],
      "indirect": [
        "biceps",
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Banded Pull-up",
      "Resistance-band-assisted Pull-up"
    ],
    "setupNotes": "Loop an intact band securely over the pull-up bar and use a stable step to enter and exit. Keep the supported foot or knee steady and lower under control. Log 0 kg external load and note the band and setup; band assistance is not external weight.",
    "isCustom": false
  },
  {
    "id": "t-bar-row",
    "name": "T-bar Row",
    "equipment": "machine",
    "muscleContribution": {
      "upperBack": 1,
      "lats": 1,
      "biceps": 0.5,
      "rearDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "upperBack",
        "lats"
      ],
      "indirect": [
        "biceps",
        "rearDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Standing Machine T-bar Row",
      "Unsupported T-bar Row"
    ],
    "setupNotes": "Use an unsupported plate-loaded T-bar row machine with a fixed pivot and handles. Hinge and brace, row toward the lower torso, then lower without standing up. This entry is distinct from a barbell landmine row. Record added plates consistently.",
    "isCustom": false
  },
  {
    "id": "seal-row",
    "name": "Seal Row",
    "equipment": "barbell",
    "muscleContribution": {
      "upperBack": 1,
      "lats": 1,
      "biceps": 0.5,
      "rearDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "upperBack",
        "lats"
      ],
      "indirect": [
        "biceps",
        "rearDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Prone Barbell Row"
    ],
    "setupNotes": "Lie prone on a purpose-built elevated flat bench with enough clearance for the barbell. Keep the chest supported and row without leg drive. Use a secure rated setup rather than loose unstable supports. Log bar plus plates.",
    "isCustom": false
  },
  {
    "id": "barbell-shrug",
    "name": "Barbell Shrug",
    "equipment": "barbell",
    "muscleContribution": {
      "upperBack": 1
    },
    "muscleRoles": {
      "direct": [
        "upperBack"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Barbell Shoulder Shrug"
    ],
    "setupNotes": "Hold the bar in front of the thighs, brace the torso, and raise and lower the shoulders under control without rolling or bouncing. Log bar plus plates.",
    "isCustom": false
  },
  {
    "id": "band-row",
    "name": "Band Row",
    "equipment": "band",
    "muscleContribution": {
      "upperBack": 1,
      "lats": 1,
      "biceps": 0.5,
      "rearDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "upperBack",
        "lats"
      ],
      "indirect": [
        "biceps",
        "rearDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Resistance Band Row",
      "Standing Band Row"
    ],
    "setupNotes": "Anchor an intact band to a secure fixed point in front of you. Brace in a stable stance and row toward the ribs without leaning back. Note band color, anchor height and distance; 0 kg avoids representing variable band tension as a measured free-weight load.",
    "isCustom": false
  },
  {
    "id": "band-lat-pulldown",
    "name": "Band Lat Pulldown",
    "equipment": "band",
    "muscleContribution": {
      "lats": 1,
      "biceps": 0.5,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "lats"
      ],
      "indirect": [
        "biceps",
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Resistance-band Lat Pulldown"
    ],
    "setupNotes": "Anchor an intact band securely overhead and kneel facing it. Pull the elbows down toward the sides, then return slowly. Note the band and anchor setup; log 0 kg rather than treating the band label as a fixed measured load.",
    "isCustom": false
  },
  {
    "id": "standing-cable-row",
    "name": "Standing Cable Row",
    "equipment": "cable",
    "muscleContribution": {
      "upperBack": 1,
      "lats": 1,
      "biceps": 0.5,
      "rearDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "upperBack",
        "lats"
      ],
      "indirect": [
        "biceps",
        "rearDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Standing Low Cable Row"
    ],
    "setupNotes": "Face a low-to-mid cable with a two-handed attachment and step back until taut. Brace with soft knees and row toward the lower ribs without leaning backward.",
    "isCustom": false
  },
  {
    "id": "db-bent-over-row",
    "name": "Bent-over Dumbbell Row",
    "equipment": "dumbbell",
    "muscleContribution": {
      "upperBack": 1,
      "lats": 1,
      "biceps": 0.5,
      "rearDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "upperBack",
        "lats"
      ],
      "indirect": [
        "biceps",
        "rearDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Two-arm Dumbbell Row",
      "Bilateral Dumbbell Row"
    ],
    "setupNotes": "Hold two dumbbells and hinge at the hips with knees soft. Row both arms together while keeping the torso angle stable. Use a consistent per-dumbbell logging convention. This is the bilateral unsupported version.",
    "isCustom": false
  },
  {
    "id": "barbell-curl",
    "name": "Barbell Curl",
    "equipment": "barbell",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Straight-bar Curl",
      "Barbell Biceps Curl"
    ],
    "setupNotes": "Stand upright with an underhand grip and steady upper arms. Curl and lower under control without driving with the hips. Log bar plus plates.",
    "isCustom": false
  },
  {
    "id": "ez-bar-curl",
    "name": "EZ-bar Curl",
    "equipment": "barbell",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "EZ Curl",
      "EZ-bar Biceps Curl"
    ],
    "setupNotes": "Hold the angled EZ-bar sections in a comfortable semi-supinated grip, keeping the upper arms near the sides. Curl without leaning back. Log the EZ bar plus plates.",
    "isCustom": false
  },
  {
    "id": "incline-db-curl",
    "name": "Incline Dumbbell Curl",
    "equipment": "dumbbell",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Incline Dumbbell Biceps Curl"
    ],
    "setupNotes": "Set a bench around 45-60 degrees, sit with the back supported and let the arms hang slightly behind the torso. Curl without moving the upper arms forward. Use a consistent per-dumbbell logging convention.",
    "isCustom": false
  },
  {
    "id": "concentration-curl",
    "name": "Concentration Curl",
    "equipment": "dumbbell",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Dumbbell Concentration Curl"
    ],
    "setupNotes": "Sit with feet planted apart and brace the back of the working upper arm against the inner thigh. Curl without rotating or lifting the shoulder. Log the single dumbbell weight.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "reverse-barbell-curl",
    "name": "Reverse Barbell Curl",
    "equipment": "barbell",
    "muscleContribution": {
      "biceps": 0.5
    },
    "muscleRoles": {
      "direct": [],
      "indirect": [
        "biceps"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Overhand Barbell Curl",
      "Pronated Barbell Curl"
    ],
    "setupNotes": "Take an overhand grip and curl with steady upper arms and neutral wrists. Use a lighter load than a supinated curl. Forearm and brachialis work is not represented in the current 13-muscle tracker; biceps receives indirect credit only. Log bar plus plates.",
    "isCustom": false
  },
  {
    "id": "zottman-curl",
    "name": "Zottman Curl",
    "equipment": "dumbbell",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Dumbbell Zottman Curl"
    ],
    "setupNotes": "Curl the dumbbells palm-up, rotate to palms-down at the top, and lower under control before rotating back at the bottom. Forearm work is outside the tracked muscle list. Use a consistent per-dumbbell logging convention.",
    "isCustom": false
  },
  {
    "id": "dumbbell-hammer-preacher-curl",
    "name": "Dumbbell Hammer Preacher Curl",
    "equipment": "dumbbell",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Hammer Preacher Curl",
      "Neutral-grip Dumbbell Preacher Curl"
    ],
    "setupNotes": "Rest the back of one upper arm fully on a preacher pad or the steep face of an incline bench. Hold the dumbbell with the palm facing inward and keep that neutral grip throughout. Curl without lifting the upper arm or rolling the shoulder; lower under control without bouncing. Log one dumbbell weight. Forearm and brachialis work is outside the tracked muscle list.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "rope-hammer-curl",
    "name": "Rope Hammer Curl",
    "equipment": "cable",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Cable Rope Hammer Curl"
    ],
    "setupNotes": "Attach a rope to the low pulley and hold it with palms facing each other. Keep upper arms steady and curl without swinging. Forearm and brachialis work is outside the tracked muscle list.",
    "isCustom": false
  },
  {
    "id": "seated-hammer-curl",
    "name": "Seated Hammer Curl",
    "equipment": "dumbbell",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Seated Dumbbell Hammer Curl"
    ],
    "setupNotes": "Sit upright on a bench with feet planted, dumbbells at the sides and palms facing inward. Keep the upper arms steady and maintain a neutral grip throughout each controlled curl. Forearm and brachialis work is outside the tracked muscle list. Use a consistent per-dumbbell logging convention.",
    "isCustom": false
  },
  {
    "id": "bayesian-cable-curl",
    "name": "Bayesian Cable Curl",
    "equipment": "cable",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Behind-the-back Cable Curl",
      "Face-away Cable Curl"
    ],
    "setupNotes": "Face away from a low cable with the working arm slightly behind the torso. Use a split stance and curl without letting the shoulder drift forward. Log the working-side stack setting; train both sides equally.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "single-arm-cable-curl",
    "name": "Single-arm Cable Curl",
    "equipment": "cable",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "One-arm Cable Biceps Curl"
    ],
    "setupNotes": "Face a low pulley with a single handle and an underhand grip. Keep the elbow beside the torso while curling and lowering under control. Log the working-side stack setting.",
    "unilateral": true,
    "isCustom": false
  },
  {
    "id": "drag-curl",
    "name": "Drag Curl",
    "equipment": "barbell",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Barbell Drag Curl"
    ],
    "setupNotes": "Take an underhand barbell grip and keep the bar close to the torso as the elbows travel backward. Lower smoothly without hip drive. Log bar plus plates.",
    "isCustom": false
  },
  {
    "id": "seated-db-curl",
    "name": "Seated Dumbbell Curl",
    "equipment": "dumbbell",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Seated Dumbbell Biceps Curl"
    ],
    "setupNotes": "Sit upright on a bench with feet planted and arms hanging beside the torso. Curl palm-up without rocking or moving the elbows forward. Use a consistent per-dumbbell logging convention; keep the bench upright to distinguish this from the incline curl.",
    "isCustom": false
  },
  {
    "id": "band-biceps-curl",
    "name": "Band Biceps Curl",
    "equipment": "band",
    "muscleContribution": {
      "biceps": 1
    },
    "muscleRoles": {
      "direct": [
        "biceps"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "Resistance-band Biceps Curl",
      "Band Curl"
    ],
    "setupNotes": "Stand securely on the middle of an intact band and grip both ends palm-up. Keep elbows near the sides and curl without leaning. Note band color and starting length; log 0 kg rather than an assumed constant band load.",
    "isCustom": false
  },
  {
    "id": "deadlift",
    "name": "Barbell Conventional Deadlift",
    "equipment": "barbell",
    "muscleContribution": {
      "glutes": 1,
      "hamstrings": 1,
      "quads": 0.5,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "glutes",
        "hamstrings"
      ],
      "indirect": [
        "quads",
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Brace before lifting and keep the bar close; record the total barbell load.",
    "isCustom": false
  },
  {
    "id": "sumo-deadlift",
    "name": "Sumo Deadlift",
    "equipment": "barbell",
    "muscleContribution": {
      "glutes": 1,
      "quads": 1,
      "hamstrings": 0.5,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "glutes",
        "quads"
      ],
      "indirect": [
        "hamstrings",
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a comfortable wide stance and keep knees aligned with toes. Record total barbell load.",
    "isCustom": false
  },
  {
    "id": "trap-bar-deadlift",
    "name": "Trap Bar Deadlift",
    "equipment": "other",
    "muscleContribution": {
      "glutes": 1,
      "quads": 1,
      "hamstrings": 0.5,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "glutes",
        "quads"
      ],
      "indirect": [
        "hamstrings",
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "hex bar deadlift"
    ],
    "setupNotes": "Stand centered inside the trap/hex bar. Record the total bar and plate load.",
    "isCustom": false
  },
  {
    "id": "front-squat",
    "name": "Barbell Front Squat",
    "equipment": "barbell",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1,
      "abs": 0.5
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [
        "abs"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Support the bar across the front shoulders with elbows up. Record total barbell load.",
    "isCustom": false
  },
  {
    "id": "smith-squat",
    "name": "Smith Machine Squat",
    "equipment": "machine",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Set safety stops and choose a foot position suited to the machine. Record load consistently across sessions.",
    "isCustom": false
  },
  {
    "id": "db-squat",
    "name": "Dumbbell Squat",
    "equipment": "dumbbell",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "suitcase squat"
    ],
    "setupNotes": "Hold one dumbbell at each side and squat under control. Record the combined load of both dumbbells.",
    "isCustom": false
  },
  {
    "id": "kettlebell-goblet-squat",
    "name": "Kettlebell Goblet Squat",
    "equipment": "other",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1,
      "abs": 0.5
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [
        "abs"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Hold one kettlebell at the chest and keep the whole foot planted. Record kettlebell weight.",
    "isCustom": false
  },
  {
    "id": "box-squat",
    "name": "Barbell Box Squat",
    "equipment": "barbell",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a stable box and controlled contact without dropping onto it. Record total barbell load.",
    "isCustom": false
  },
  {
    "id": "safety-bar-squat",
    "name": "Safety Bar Squat",
    "equipment": "barbell",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1,
      "upperBack": 0.5
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [
        "upperBack"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use the padded safety squat bar and keep the handles steady. Record the specific bar plus plate load.",
    "isCustom": false
  },
  {
    "id": "belt-squat",
    "name": "Belt Squat",
    "equipment": "machine",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Secure the belt at the hips and set the machine safeties. Record machine load consistently.",
    "isCustom": false
  },
  {
    "id": "reverse-lunge",
    "name": "Dumbbell Reverse Lunge",
    "equipment": "dumbbell",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Step backward and lower under control. Log repetitions per side and combined dumbbell load.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "forward-lunge",
    "name": "Dumbbell Forward Lunge",
    "equipment": "dumbbell",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Step forward and push back to the starting position. Log repetitions per side and combined dumbbell load.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "walking-lunge",
    "name": "Dumbbell Walking Lunge",
    "equipment": "dumbbell",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Advance with controlled steps. Log steps per side and combined dumbbell load.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "lateral-lunge",
    "name": "Lateral Lunge",
    "equipment": "bodyweight",
    "muscleContribution": {
      "glutes": 1,
      "quads": 1
    },
    "muscleRoles": {
      "direct": [
        "glutes",
        "quads"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Step to the side and sit into the working hip. Log repetitions per side and 0 kg when unweighted.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "step-up",
    "name": "Dumbbell Step-Up",
    "equipment": "dumbbell",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use a stable platform and a height you can control. Log repetitions per side and combined dumbbell load.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "split-squat",
    "name": "Dumbbell Split Squat",
    "equipment": "dumbbell",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Keep the rear foot on the floor and lower in a split stance. Log repetitions per side and combined dumbbell load.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "single-leg-leg-press",
    "name": "Single-Leg Leg Press",
    "equipment": "machine",
    "muscleContribution": {
      "quads": 1,
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "quads",
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use one leg without rotating the pelvis; set the machine safeties. Log repetitions per side and machine load.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "single-leg-rdl",
    "name": "Single-Leg Romanian Deadlift",
    "equipment": "dumbbell",
    "muscleContribution": {
      "hamstrings": 1,
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "hamstrings",
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Hinge on one leg with the hips square. Log repetitions per side and combined held dumbbell load.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "good-morning",
    "name": "Barbell Good Morning",
    "equipment": "barbell",
    "muscleContribution": {
      "hamstrings": 1,
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "hamstrings",
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Brace and hinge at the hips with a modest knee bend. Record total barbell load.",
    "isCustom": false
  },
  {
    "id": "back-extension",
    "name": "45-Degree Back Extension",
    "equipment": "other",
    "muscleContribution": {
      "glutes": 1,
      "hamstrings": 1
    },
    "muscleRoles": {
      "direct": [
        "glutes",
        "hamstrings"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Set the pad below the hip crease and hinge at the hips. Lower-back work is not separately tracked. Log added external load, or 0 kg unweighted.",
    "isCustom": false
  },
  {
    "id": "glute-bridge",
    "name": "Glute Bridge",
    "equipment": "bodyweight",
    "muscleContribution": {
      "glutes": 1,
      "hamstrings": 0.5
    },
    "muscleRoles": {
      "direct": [
        "glutes"
      ],
      "indirect": [
        "hamstrings"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Press through the feet and extend the hips without arching the lower back. Log added external load, or 0 kg unweighted.",
    "isCustom": false
  },
  {
    "id": "single-leg-glute-bridge",
    "name": "Single-Leg Glute Bridge",
    "equipment": "bodyweight",
    "muscleContribution": {
      "glutes": 1,
      "hamstrings": 0.5
    },
    "muscleRoles": {
      "direct": [
        "glutes"
      ],
      "indirect": [
        "hamstrings"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Keep the pelvis level while driving through one foot. Log repetitions per side and 0 kg unweighted.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "machine-hip-thrust",
    "name": "Machine Hip Thrust",
    "equipment": "machine",
    "muscleContribution": {
      "glutes": 1,
      "hamstrings": 0.5
    },
    "muscleRoles": {
      "direct": [
        "glutes"
      ],
      "indirect": [
        "hamstrings"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Secure the machine belt or pad and extend through the hips. Record machine load consistently.",
    "isCustom": false
  },
  {
    "id": "cable-pull-through",
    "name": "Cable Pull-Through",
    "equipment": "cable",
    "muscleContribution": {
      "glutes": 1,
      "hamstrings": 1
    },
    "muscleRoles": {
      "direct": [
        "glutes",
        "hamstrings"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Face away from the low pulley, hold the rope between the legs, and hinge at the hips. Record cable stack load.",
    "isCustom": false
  },
  {
    "id": "cable-glute-kickback",
    "name": "Cable Glute Kickback",
    "equipment": "cable",
    "muscleContribution": {
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use an ankle cuff and extend one hip without swinging the trunk. Log repetitions per side and stack load.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "kettlebell-deadlift",
    "name": "Kettlebell Deadlift",
    "equipment": "other",
    "muscleContribution": {
      "glutes": 1,
      "hamstrings": 1,
      "quads": 0.5
    },
    "muscleRoles": {
      "direct": [
        "glutes",
        "hamstrings"
      ],
      "indirect": [
        "quads"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "kettlebell",
      "KB"
    ],
    "setupNotes": "Set the kettlebell between the feet and stand by extending the hips. Record kettlebell weight.",
    "isCustom": false
  },
  {
    "id": "hip-abduction-machine",
    "name": "Hip Abduction Machine",
    "equipment": "machine",
    "muscleContribution": {
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Place the pads outside the thighs and open the knees under control. Record machine stack load.",
    "isCustom": false
  },
  {
    "id": "band-lateral-walk",
    "name": "Band Lateral Walk",
    "equipment": "band",
    "muscleContribution": {
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Maintain band tension with controlled side steps. Log steps per side at 0 kg and note band strength.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "clamshell",
    "name": "Clamshell",
    "equipment": "bodyweight",
    "muscleContribution": {
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Lie on the side with hips stacked and open the top knee without rolling backward. Log repetitions per side at 0 kg; note any band.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "seated-calf-raise",
    "name": "Seated Calf Raise",
    "equipment": "machine",
    "muscleContribution": {
      "calves": 1
    },
    "muscleRoles": {
      "direct": [
        "calves"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Secure the knee pad above the knees, raise the heels, and lower under control. Record machine load consistently.",
    "isCustom": false
  },
  {
    "id": "leg-press-calf-raise",
    "name": "Leg Press Calf Raise",
    "equipment": "machine",
    "muscleContribution": {
      "calves": 1
    },
    "muscleRoles": {
      "direct": [
        "calves"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Keep the balls of the feet securely on the sled and move through the ankles. Use machine safeties and record sled load consistently.",
    "isCustom": false
  },
  {
    "id": "single-leg-calf-raise",
    "name": "Single-Leg Calf Raise",
    "equipment": "bodyweight",
    "muscleContribution": {
      "calves": 1
    },
    "muscleRoles": {
      "direct": [
        "calves"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use stable hand support and move through the ankle on one leg. Log repetitions per side and added external load, or 0 kg.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "donkey-calf-raise",
    "name": "Donkey Calf Raise",
    "equipment": "other",
    "muscleContribution": {
      "calves": 1
    },
    "muscleRoles": {
      "direct": [
        "calves"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Hinge forward with stable hand support and use a properly secured dip belt. Record the added belt load.",
    "isCustom": false
  },
  {
    "id": "standing-leg-curl",
    "name": "Standing Machine Leg Curl",
    "equipment": "machine",
    "muscleContribution": {
      "hamstrings": 1
    },
    "muscleRoles": {
      "direct": [
        "hamstrings"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "standing leg curl",
      "unilateral machine leg curl"
    ],
    "setupNotes": "Use the standing unilateral leg-curl machine, aligning the working knee with the pivot and keeping the pelvis steady. Log repetitions per side and machine load.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "nordic-curl",
    "name": "Nordic Hamstring Curl",
    "equipment": "bodyweight",
    "muscleContribution": {
      "hamstrings": 1
    },
    "muscleRoles": {
      "direct": [
        "hamstrings"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Secure the ankles in an appropriate anchor and lower only as far as controlled. Log repetitions at 0 kg; record assistance in notes.",
    "isCustom": false
  },
  {
    "id": "swiss-ball-leg-curl",
    "name": "Swiss Ball Leg Curl",
    "equipment": "other",
    "muscleContribution": {
      "hamstrings": 1,
      "glutes": 0.5
    },
    "muscleRoles": {
      "direct": [
        "hamstrings"
      ],
      "indirect": [
        "glutes"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Place the heels on the ball, lift the hips, and curl the ball toward you. Log repetitions at 0 kg.",
    "isCustom": false
  },
  {
    "id": "sliding-leg-curl",
    "name": "Sliding Leg Curl",
    "equipment": "other",
    "muscleContribution": {
      "hamstrings": 1,
      "glutes": 0.5
    },
    "muscleRoles": {
      "direct": [
        "hamstrings"
      ],
      "indirect": [
        "glutes"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use sliders or towels on an appropriate surface and curl the heels toward the hips. Log repetitions at 0 kg.",
    "isCustom": false
  },
  {
    "id": "kettlebell-swing",
    "name": "Kettlebell Swing",
    "equipment": "other",
    "muscleContribution": {
      "glutes": 1,
      "hamstrings": 1
    },
    "muscleRoles": {
      "direct": [
        "glutes",
        "hamstrings"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "kettlebell",
      "KB"
    ],
    "setupNotes": "Use a two-handed hip hinge swing and let the hips drive the bell. Record kettlebell weight.",
    "isCustom": false
  },
  {
    "id": "frog-pump",
    "name": "Frog Pump",
    "equipment": "bodyweight",
    "muscleContribution": {
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Lie with soles together and knees open, then extend the hips in a comfortable range. Log added external load, or 0 kg.",
    "isCustom": false
  },
  {
    "id": "cable-hip-abduction",
    "name": "Cable Hip Abduction",
    "equipment": "cable",
    "muscleContribution": {
      "glutes": 1
    },
    "muscleRoles": {
      "direct": [
        "glutes"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Use an ankle cuff on the outside leg and move the leg sideways without tilting the pelvis. Log repetitions per side and stack load.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "crunch",
    "name": "Crunch",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Curl the ribs toward the pelvis without pulling the head forward. Log repetitions at 0 kg.",
    "isCustom": false
  },
  {
    "id": "reverse-crunch",
    "name": "Reverse Crunch",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Curl the pelvis toward the ribs without swinging the legs. Log repetitions at 0 kg.",
    "isCustom": false
  },
  {
    "id": "bicycle-crunch",
    "name": "Bicycle Crunch",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Rotate the ribcage toward the opposite knee under control. Log repetitions per side at 0 kg.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "decline-sit-up",
    "name": "Decline Sit-Up",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Secure the legs on a decline bench and sit up without jerking. Log added external load, or 0 kg.",
    "isCustom": false
  },
  {
    "id": "sit-up",
    "name": "Sit-Up",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "floor situp",
      "sit ups"
    ],
    "setupNotes": "Lie on the floor with knees bent and sit up smoothly without pulling the neck. Log repetitions at 0 kg.",
    "isCustom": false
  },
  {
    "id": "hanging-leg-raise",
    "name": "Hanging Leg Raise",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Hang from a secure bar and raise the legs while curling the pelvis without swinging. Log repetitions at 0 kg.",
    "isCustom": false
  },
  {
    "id": "captain-chair-leg-raise",
    "name": "Captain's Chair Leg Raise",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [
      "captain's chair knee raise",
      "vertical leg raise",
      "vertical knee raise"
    ],
    "setupNotes": "Support the forearms on the pads and curl the pelvis as the legs rise without swinging. Bend the knees to reduce the difficulty. Log repetitions at 0 kg.",
    "isCustom": false
  },
  {
    "id": "ab-wheel-rollout",
    "name": "Ab Wheel Rollout",
    "equipment": "other",
    "muscleContribution": {
      "abs": 1,
      "lats": 0.5
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [
        "lats"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Start from the knees and roll only as far as you can keep the trunk controlled. Log repetitions at 0 kg.",
    "isCustom": false
  },
  {
    "id": "cable-woodchop",
    "name": "Cable Woodchop",
    "equipment": "cable",
    "muscleContribution": {
      "abs": 1
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Stand side-on to the cable and rotate through a controlled chop. Log repetitions per side and cable stack load.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "pallof-press",
    "name": "Band Pallof Press",
    "equipment": "band",
    "muscleContribution": {
      "abs": 1
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Anchor a resistance band securely at chest height, stand side-on, and press away without rotating. Log press repetitions per side at 0 kg and record band strength in notes.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "russian-twist",
    "name": "Russian Twist",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Rotate the ribcage through a controlled range. Log repetitions per side and added external load, or 0 kg unweighted.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "dead-bug",
    "name": "Dead Bug",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "Extend the opposite arm and leg while maintaining trunk control. Log repetitions per side at 0 kg.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "bird-dog",
    "name": "Bird Dog",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1,
      "glutes": 0.5
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [
        "glutes"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "From hands and knees, extend the opposite arm and leg without rotating the trunk. Log repetitions per side at 0 kg.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "mountain-climber",
    "name": "Mountain Climber",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1,
      "frontDelts": 0.5
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [
        "frontDelts"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "From a high plank, bring alternating knees forward while keeping the trunk steady. Log knee-drive repetitions per side at 0 kg.",
    "isCustom": false,
    "unilateral": true
  },
  {
    "id": "plank-shoulder-tap",
    "name": "Plank Shoulder Tap",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1,
      "frontDelts": 0.5,
      "triceps": 0.5
    },
    "muscleRoles": {
      "direct": [
        "abs"
      ],
      "indirect": [
        "frontDelts",
        "triceps"
      ],
      "reviewedAt": "2026-10-16",
      "source": "forge-reviewed"
    },
    "aliases": [],
    "setupNotes": "From a high plank, tap the opposite shoulder without rotating the hips. Log taps per side at 0 kg.",
    "isCustom": false,
    "unilateral": true
  }
];
