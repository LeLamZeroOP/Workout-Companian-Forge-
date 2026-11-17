import { expandedExerciseVideos } from './expandedExerciseVideos';

export type ExerciseVideo = {
  videoId: string;
  title: string;
  creator: string;
  durationSeconds: number;
  startSeconds?: number;
  endSeconds?: number;
  note?: string;
  shorterTutorialReason?: string;
};

// Reviewed technique tutorials; live playback evidence is recorded in docs/exercise-videos.md.
// Separate from saved definitions to preserve workout history and user muscle mappings.
export const exerciseVideos: Record<string, ExerciseVideo> = {
  ...expandedExerciseVideos,
  "db-chest-press": {
    "videoId": "t1iaVBMItPo",
    "title": "Dumbbell Bench Press - Perfect Form Video Tutorial",
    "creator": "Fit Father Project - Fitness For Busy Fathers",
    "durationSeconds": 267
  },
  "bench-press": {
    "videoId": "vcBig73ojpE",
    "title": "How To Get A Huge Bench Press with Perfect Technique",
    "creator": "Jeff Nippard",
    "durationSeconds": 734
  },
  "incline-db-press": {
    "videoId": "0f6-uCUKqgA",
    "title": "Incline Dumbbell Press BETTER | Targeting The Muscle Series",
    "creator": "Renaissance Periodization",
    "durationSeconds": 452
  },
  "machine-chest-press": {
    "videoId": "gNBU7hmW2EU",
    "title": "Chest Press Machine Tutorial | Beginner’s Guide to Gym Machines (Build Muscle & Strength)",
    "creator": "Tim Bullici",
    "durationSeconds": 186
  },
  "cable-fly": {
    "videoId": "hrh0K1Oo7Yc",
    "title": "How to PROPERLY Cable Chest Fly (FIX THIS NOW!)",
    "creator": "Colossus Fitness",
    "durationSeconds": 296
  },
  "pec-deck": {
    "videoId": "H4mVGHaK2f4",
    "title": "How to PERFECT The Pec Deck | (CHEST FLY MISTAKES & TIPS)",
    "creator": "Colossus Fitness",
    "durationSeconds": 183
  },
  "push-up": {
    "videoId": "IODxDxX7oi4",
    "title": "The Perfect Push Up | Do it right!",
    "creator": "Calisthenicmovement",
    "durationSeconds": 218
  },
  "overhead-press": {
    "videoId": "_RlRDWO2jfg",
    "title": "Build Bigger Shoulders With Perfect Training Technique (The Overhead Press)",
    "creator": "Jeff Nippard",
    "durationSeconds": 479
  },
  "db-shoulder-press": {
    "videoId": "7C-btvC-UX4",
    "title": "Dumbbell Shoulder press Complete Tutorial.",
    "creator": "The Barbell path",
    "durationSeconds": 457
  },
  "lateral-raise": {
    "videoId": "v_ZkxWzYnMc",
    "title": "How To Build Capped Shoulders: Optimal Training Explained (Side Delts)",
    "creator": "Jeff Nippard",
    "durationSeconds": 484
  },
  "cable-lateral-raise": {
    "videoId": "Sp8be0IFNvk",
    "title": "How to Fix your Cable Lateral Raise | DB vs. CABLE",
    "creator": "John Jewett",
    "durationSeconds": 291
  },
  "reverse-pec-deck": {
    "videoId": "LzsSQzHFuLU",
    "title": "How to Reverse Pec Dec For HUGE round rear delts - Exercise Set up and Form with Hypertrophy Coach",
    "creator": "Hypertrophy Coach",
    "durationSeconds": 545
  },
  "face-pull": {
    "videoId": "DvjmJdEswQ4",
    "title": "Face Pulls | Proper Form vs Common Mistakes",
    "creator": "JONNI SHREVE",
    "durationSeconds": 670
  },
  "db-press-15": {
    "videoId": "0f6-uCUKqgA",
    "title": "Incline Dumbbell Press BETTER | Targeting The Muscle Series",
    "creator": "Renaissance Periodization",
    "durationSeconds": 452,
    "note": "General incline technique tutorial. Set your bench to the 15-degree angle specified in your plan."
  },
  "db-press-30": {
    "videoId": "0f6-uCUKqgA",
    "title": "Incline Dumbbell Press BETTER | Targeting The Muscle Series",
    "creator": "Renaissance Periodization",
    "durationSeconds": 452,
    "note": "General incline technique tutorial. Set your bench to the 30-degree angle specified in your plan."
  },
  "incline-barbell-press": {
    "videoId": "jPLdzuHckI8",
    "title": "Incline Barbell Press | Upper Chest | How-To Exercise Tutorial",
    "creator": "Buff Dudes Workouts",
    "durationSeconds": 286
  },
  "smith-incline-press": {
    "videoId": "GobPtFwc_Qk",
    "title": "How to Set Up Smith Incline Press (Upper Pecs)",
    "creator": "Ben Yanes",
    "durationSeconds": 826
  },
  "incline-converging-press": {
    "videoId": "GRTzUEPUqek",
    "title": "Dr. Mike Reviews the Atlantis Converging Incline Bench Press",
    "creator": "Atlantis Strength",
    "durationSeconds": 535,
    "note": "Demonstrates an Atlantis converging incline press. Match the seat, handles and pressing path to your machine."
  },
  "low-high-cable-fly": {
    "videoId": "-EIhKMDSjBY",
    "title": "The Best Way To Isolate The Chest For Growth (Upper Chest Focus)",
    "creator": "Jeff Nippard",
    "durationSeconds": 415
  },
  "smith-flat-press": {
    "videoId": "nFAQ35hmCqU",
    "title": "How To Smith Machine Bench Press (BEGINNER)",
    "creator": "Wavvy Fitness",
    "durationSeconds": 253
  },
  "flat-db-fly": {
    "videoId": "2dKBS61BX24",
    "title": "8 Dumbbell Fly Mistakes and How to Fix Them",
    "creator": "Renaissance Periodization",
    "durationSeconds": 627
  },
  "standing-cable-chest-press": {
    "videoId": "fOHouR0t9Cw",
    "title": "Standing Cable Chest Press  - Technique, Benefits, and Common Mistakes",
    "creator": "Mike | J2FIT Strength & Conditioning",
    "durationSeconds": 263
  },
  "single-arm-cable-chest-press": {
    "videoId": "sNUWfchnLIE",
    "title": "One Arm Cable Press exercise tutorial",
    "creator": "Nick Tumminello - Trainer of Trainers",
    "durationSeconds": 145,
    "shorterTutorialReason": "A complete 2:25 landscape coaching lesson for the exact unilateral cable movement from strength coach Nick Tumminello; preferable to a generic longer cable workout."
  },
  "chest-dip": {
    "videoId": "2z8JmcrW-As",
    "title": "The Perfect Dip  - Do it right",
    "creator": "Calisthenicmovement",
    "durationSeconds": 278,
    "note": "Use the chest-focused parallel-bar variation shown in the tutorial."
  },
  "feet-elevated-push-up": {
    "videoId": "BeS6eOYKQ8s",
    "title": "Grow Your UPPER CHEST With Push-Ups",
    "creator": "FitnessFAQs",
    "durationSeconds": 760,
    "note": "Covers feet-elevated push-ups and ring variations. Use the feet-elevated version in your plan."
  },
  "machine-shoulder-press": {
    "videoId": "BAZkFGeUy5U",
    "title": "Shoulder Press Machine | Tutorial for Gym Beginners",
    "creator": "Tim Bullici",
    "durationSeconds": 180
  },
  "lat-pulldown": {
    "videoId": "O94yEoGXtBY",
    "title": "How To Build A V-Tapered Back: Lat Training Dos and Don’ts",
    "creator": "Jeff Nippard",
    "durationSeconds": 501
  },
  "pull-up": {
    "videoId": "Hdc7Mw6BIEE",
    "title": "The Best Way To Do Pull Ups For A Wide Back (Optimal Training Technique)",
    "creator": "Jeff Nippard",
    "durationSeconds": 513
  },
  "chin-up": {
    "videoId": "40A3NGv31lE",
    "title": "4 Dumbest Chin-Up Mistakes Sabotaging Your BACK / BICEPS GROWTH! STOP DOING THESE!",
    "creator": "ScottHermanFitness",
    "durationSeconds": 570
  },
  "seated-cable-row": {
    "videoId": "7o2oolbmzeI",
    "title": "How To: Seated Cable Low-Row || PERFECT FORM",
    "creator": "ScottHermanFitness",
    "durationSeconds": 366
  },
  "db-row": {
    "videoId": "djKXLt7kv7Q",
    "title": "How To Do Dumbbell Rows: Build a Thicker Back With Proper \"Cheating\"",
    "creator": "Jeff Nippard",
    "durationSeconds": 443
  },
  "barbell-row": {
    "videoId": "G8l_8chR5BE",
    "title": "\"How To\" Barbell Row",
    "creator": "Alan Thrall (Untamed Strength)",
    "durationSeconds": 315
  },
  "chest-supported-row": {
    "videoId": "TXjeZsqCVsg",
    "title": "CHEST SUPPORTED DUMBBELL ROW | how-to, tips, benefits",
    "creator": "That Fit Friend",
    "durationSeconds": 373
  },
  "straight-arm-pulldown": {
    "videoId": "vJwAbr_pVVM",
    "title": "How to PROPERLY Straight-Arm Lat Pulldown for Bigger Lats",
    "creator": "Colossus Fitness",
    "durationSeconds": 264
  },
  "db-curl": {
    "videoId": "Ot2QgK5K_Hg",
    "title": "5 Dumbest Dumbbell Bicep Curl Mistakes Sabotaging Your Bicep Growth! | STOP DOING THESE!",
    "creator": "ScottHermanFitness",
    "durationSeconds": 579
  },
  "hammer-curl": {
    "videoId": "rbOhYRsd9Ak",
    "title": "5 Dumbest Hammer Curl Mistakes Sabotaging Your ARM GROWTH! STOP DOING THESE!",
    "creator": "ScottHermanFitness",
    "durationSeconds": 452
  },
  "cable-curl": {
    "videoId": "16aEi1a68E0",
    "title": "How to Do the Cable Biceps Curl With Perfect Form | Form Check | Men’s Health Muscle",
    "creator": "Men’s Health Muscle",
    "durationSeconds": 372,
    "note": "Demonstrates a single-arm cable curl. Use the attachment and arm position prescribed in your plan."
  },
  "preacher-curl": {
    "videoId": "R-8Sa0_qiws",
    "title": "How to PROPERLY Do The Machine Preacher Curl (LEARN FAST) | Eb & Swole | Men’s Health Muscle",
    "creator": "Men’s Health Muscle",
    "durationSeconds": 460
  },
  "triceps-pushdown": {
    "videoId": "Do8_ihxoK00",
    "title": "3 Triceps Pushdown Mistakes Everyone Makes | FIX NOW!",
    "creator": "ScottHermanFitness",
    "durationSeconds": 502
  },
  "overhead-triceps": {
    "videoId": "dVtMz69MOb0",
    "title": "How To Do Overhead Cable Extensions (INCREDIBLE TRICEPS BUILDER!)",
    "creator": "Geoffrey Verity Schofield",
    "durationSeconds": 402
  },
  "neutral-grip-lat-pulldown": {
    "videoId": "KgZqDuNx7rI",
    "title": "The BEST way to Perform the Neutral Grip Lat Pulldown | Form Tutorial",
    "creator": "Physique Development",
    "durationSeconds": 295
  },
  "machine-row": {
    "videoId": "6eBwGki2JuU",
    "title": "Exercise Scientist's Top 5 Back Exercises",
    "creator": "Renaissance Periodization",
    "durationSeconds": 1441,
    "startSeconds": 577,
    "endSeconds": 780,
    "note": "Machine-row coaching starts at 9:37 and runs to 13:00. Adjust the seat and handles for your machine."
  },
  "smith-jm-press": {
    "videoId": "RO5KcSbYXho",
    "title": "The 2 BEST JM Presses For Triceps",
    "creator": "Alex Leonidas",
    "durationSeconds": 706,
    "startSeconds": 44,
    "endSeconds": 375,
    "note": "Smith-machine JM press coaching starts at 0:44 and runs to 6:15."
  },
  "leg-press": {
    "videoId": "-Nw8EWUrJuQ",
    "title": "Leg Press 101: How to, Tips, & Tricks w/ Steve Kuclo",
    "creator": "Muscle & Strength",
    "durationSeconds": 241
  },
  "squat": {
    "videoId": "8PMjqgR8Wa8",
    "title": "How to Barbell Back Squat | A Tutorial for Beginners",
    "creator": "Barbell Rehab",
    "durationSeconds": 236
  },
  "goblet-squat": {
    "videoId": "9KzZD_n2r64",
    "title": "How to Goblet Squat - The Complete Guide for Beginners",
    "creator": "Naomi Kong",
    "durationSeconds": 509
  },
  "hack-squat": {
    "videoId": "4cxt_Tldugw",
    "title": "9 Hack Squat Mistakes and How to Fix Them",
    "creator": "Renaissance Periodization",
    "durationSeconds": 1127
  },
  "rdl": {
    "videoId": "_oyxCn2iSjU",
    "title": "HOW TO DO ROMANIAN DEADLIFTS (RDLs): Build Beefy Hamstrings With Perfect Technique",
    "creator": "Jeff Nippard",
    "durationSeconds": 382
  },
  "db-rdl": {
    "videoId": "2JWazArW0zw",
    "title": "Dumbbell RDL Exercise Tutorial",
    "creator": "Eric Roberts",
    "durationSeconds": 317
  },
  "bulgarian-split-squat": {
    "videoId": "-4LVK1crLSw",
    "title": "The ULTIMATE Bulgarian Split Squat Tutorial",
    "creator": "Squat University",
    "durationSeconds": 498
  },
  "leg-extension": {
    "videoId": "yiEDToHWs2E",
    "title": "Exercise Index - Leg Extension",
    "creator": "mountaindog1",
    "durationSeconds": 327
  },
  "seated-leg-curl": {
    "videoId": "Wy1SwoY2aaQ",
    "title": "How to PROPERLY Seated Hamstring Curl (FIX THIS NOW)",
    "creator": "Colossus Fitness",
    "durationSeconds": 211
  },
  "hip-thrust": {
    "videoId": "jQkKeL4Cg8M",
    "title": "HOW TO HIP THRUST | 2024 Complete Beginner's Guide",
    "creator": "Naomi Kong",
    "durationSeconds": 528
  },
  "calf-raise": {
    "videoId": "Xa18jxyeSnM",
    "title": "8 Calf Raise Mistakes and How to Fix Them",
    "creator": "Renaissance Periodization",
    "durationSeconds": 565
  },
  "cable-crunch": {
    "videoId": "aBd6T01PBqw",
    "title": "How to PROPERLY Perform A Cable Crunch to Shape Your Abs (Kneeling Cable Abdominal Crunch)",
    "creator": "Colossus Fitness",
    "durationSeconds": 317
  },
  "hanging-knee-raise": {
    "videoId": "QyVq5oUBpss",
    "title": "The WORST Ab Training MISTAKES | Leg Raises",
    "creator": "FitnessFAQs",
    "durationSeconds": 311,
    "note": "Covers knee raises and straight-leg progressions; use the bent-knee variation in your plan."
  },
  "lying-leg-curl": {
    "videoId": "jobEeklwrrs",
    "title": "9 Leg Curl Mistakes and How to Fix Them",
    "creator": "Renaissance Periodization",
    "durationSeconds": 743
  }
};
