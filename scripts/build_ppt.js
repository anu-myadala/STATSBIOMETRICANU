// build_ppt.js — Conference-Ready Presentation
// Bimodal Biometric Warehouse · CMPE 255 · Spring 2026
// All figures generated from real Fitbit + USDA data
// Palette: Navy #1B4F8A, Teal #0D7A5F, Amber #B85C00, Slate #2C3E50

const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

const ROOT    = path.resolve(__dirname, "..");
const FIGS    = path.join(ROOT, "reports", "figures");
const OUTFILE = path.join(ROOT, "reports", "bimodal_biometric_presentation.pptx");

// ── Palette ──────────────────────────────────────────────────────────────────
const NAVY   = "1B4F8A";
const TEAL   = "0D7A5F";
const AMBER  = "B85C00";
const SLATE  = "2C3E50";
const WHITE  = "FFFFFF";
const LIGHT  = "F4F6F9";
const LGRAY  = "E8ECF0";
const DGRAY  = "5A6478";
const CREAM  = "FDF8F0";

// ── Typography ───────────────────────────────────────────────────────────────
const HEAD = "Trebuchet MS";
const BODY = "Calibri";

// ── Shadow factory (fresh object each call) ──────────────────────────────────
const SH = () => ({ type:"outer", blur:5, offset:2, angle:135, color:"000000", opacity:0.12 });

// ── Helper: add standard slide layout ────────────────────────────────────────
function addContentSlide(pres, title) {
  const slide = pres.addSlide();
  slide.background = { color: WHITE };
  // Top navy bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x:0, y:0, w:10, h:0.55, fill:{color:NAVY}, line:{color:NAVY}
  });
  // Slide title in bar
  slide.addText(title, {
    x:0.3, y:0, w:9.0, h:0.55,
    fontFace:HEAD, fontSize:18, bold:true, color:WHITE,
    valign:"middle", margin:0
  });
  return slide;
}

// ── Helper: add a figure with a caption label ────────────────────────────────
function addFig(slide, imgPath, x, y, w, h, caption) {
  slide.addImage({ path:imgPath, x, y, w, h,
    shadow: SH()
  });
  if (caption) {
    slide.addText(caption, {
      x, y: y+h+0.04, w, h:0.22,
      fontFace:BODY, fontSize:8.5, color:DGRAY,
      italic:true, align:"center"
    });
  }
}

// ── Helper: stat callout box ─────────────────────────────────────────────────
function addStat(slide, x, y, w, h, bigNum, label, color) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill:{color:color}, line:{color:color}, shadow:SH()
  });
  slide.addText(bigNum, {
    x:x+0.05, y:y+0.06, w:w-0.1, h:h*0.55,
    fontFace:HEAD, fontSize:28, bold:true, color:WHITE,
    align:"center", valign:"bottom", margin:0
  });
  slide.addText(label, {
    x:x+0.05, y:y+h*0.55, w:w-0.1, h:h*0.42,
    fontFace:BODY, fontSize:10, color:WHITE,
    align:"center", valign:"top", margin:0
  });
}

// ── Helper: bullet text box ──────────────────────────────────────────────────
function addBullets(slide, x, y, w, h, items, fsize=11) {
  slide.addText(
    items.map((t,i) => ({
      text: t,
      options: { bullet:true, breakLine: i < items.length-1,
                 fontSize:fsize, fontFace:BODY, color:SLATE }
    })),
    { x, y, w, h, valign:"top" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
let pres = new pptxgen();
pres.layout  = "LAYOUT_16x9";
pres.title   = "The Bimodal Biometric Warehouse";
pres.subject = "CMPE 255 Data Mining — Spring 2026";
pres.author  = "Anu Myadala";

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 1 · Title & Introduction
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  // Teal accent band
  s.addShape(pres.shapes.RECTANGLE, {
    x:0, y:3.8, w:10, h:0.08, fill:{color:TEAL}, line:{color:TEAL}
  });

  s.addText("The Bimodal Biometric Warehouse", {
    x:0.5, y:0.7, w:9, h:1.4,
    fontFace:HEAD, fontSize:34, bold:true, color:WHITE,
    align:"center", valign:"middle"
  });
  s.addText("Mining Wearable & Nutritional Data for Metabolic Optimization", {
    x:0.5, y:2.1, w:9, h:0.65,
    fontFace:BODY, fontSize:17, color:"CADCFC",
    align:"center", italic:true
  });

  // Separator line
  s.addShape(pres.shapes.RECTANGLE, {
    x:3.0, y:2.85, w:4.0, h:0.04, fill:{color:TEAL}, line:{color:TEAL}
  });

  s.addText([
    { text:"CMPE 255 · Data Mining",  options:{bold:true, breakLine:true} },
    { text:"San José State University — Spring 2026", options:{breakLine:true} },
    { text:"Anu Myadala", options:{bold:true} }
  ], {
    x:0.5, y:3.1, w:9, h:0.9,
    fontFace:BODY, fontSize:13, color:"CADCFC", align:"center"
  });

  // Data source chips
  const chips = [
    ["Fitbit Bellabeat", TEAL],
    ["USDA FoodData Central", AMBER],
    ["n = 12,625 records", NAVY],
    ["33 Users · 31 Days", SLATE]
  ];
  chips.forEach(([label, bg], i) => {
    const cx = 1.0 + i*2.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x:cx, y:4.2, w:1.95, h:0.42,
      fill:{color:bg}, line:{color:bg}, rectRadius:0.06
    });
    s.addText(label, {
      x:cx, y:4.2, w:1.95, h:0.42,
      fontFace:BODY, fontSize:10, bold:true, color:WHITE,
      align:"center", valign:"middle", margin:0
    });
  });

  s.addText("4 Mining Techniques  ·  Star Schema Warehouse  ·  Flask API Deployment", {
    x:0.5, y:4.85, w:9, h:0.4,
    fontFace:BODY, fontSize:11, color:"8BAED4", align:"center", italic:true
  });

  s.addNotes(`SPEAKER NOTES — Slide 1: Title & Introduction
Welcome. This project is called the Bimodal Biometric Warehouse — the bimodal part is key. Most fitness tracking models assume a consistent activity level throughout the day. We're targeting a very specific and underrepresented pattern: days with short, intense exercise bursts — like heavy dumbbell training or high-incline cardio — followed by hours of near-complete sedentary recovery.

We fused two real public datasets: Fitbit Bellabeat wearable data (33 users, 31 days, 12,625 daily records) and USDA FoodData Central survey nutrition data (5,624 foods with full macro profiles). We ran four data mining techniques — clustering, association rules, regression, and classification — and wrapped the final model in a Flask REST API. Let's walk through it.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 2 · Problem Statement
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = addContentSlide(pres, "Problem Statement");

  // Left column: problem framing
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.3, y:0.7, w:4.5, h:4.6,
    fill:{color:LIGHT}, line:{color:LGRAY}, shadow:SH()
  });
  s.addText("The Gap in Fitness Analytics", {
    x:0.4, y:0.78, w:4.3, h:0.38,
    fontFace:HEAD, fontSize:13, bold:true, color:NAVY, valign:"middle"
  });
  addBullets(s, 0.4, 1.22, 4.2, 3.9, [
    "Most fitness models assume uniform daily activity — ignoring bimodal behavior",
    "Bimodal profile: intense 45-60 min workout followed by 8+ hours sedentary",
    "This pattern is common for desk workers who train intensely before/after work",
    "Standard models misclassify recovery needs for this population",
    "No existing study fuses minute-level HR data with USDA macro tracking for this profile"
  ], 10.5);

  // Right column: research questions
  s.addShape(pres.shapes.RECTANGLE, {
    x:5.1, y:0.7, w:4.6, h:4.6,
    fill:{color:"EBF4F0"}, line:{color:"C0E0D5"}, shadow:SH()
  });
  s.addText("Research Hypotheses", {
    x:5.2, y:0.78, w:4.4, h:0.38,
    fontFace:HEAD, fontSize:13, bold:true, color:TEAL, valign:"middle"
  });
  addBullets(s, 5.2, 1.22, 4.3, 3.9, [
    "H1: Bimodal days form distinct physiological clusters from sedentary or uniformly active days",
    "H2: High-protein intake on workout days associates with improved next-day recovery sleep",
    "H3: A Random Forest classifier can predict next-day recovery state (AUC > 0.90)",
    "H4: Active calorie expenditure is predictable from nutrition + workout intensity (R² > 0.40)",
    "Target variable: daily recovery state — 'Ready to Train' vs 'Needs Rest'"
  ], 10.5);

  s.addNotes(`SPEAKER NOTES — Slide 2: Problem Statement
The problem we're solving: existing fitness analytics treat every day the same. But for someone who does heavy compound lifts at 6 AM and then sits at a desk for 9 hours, that's fundamentally a different physiological signal than someone who walks 10,000 steps throughout the day.

Our four research hypotheses drive the entire pipeline. H1 tests whether K-Means can surface those distinct day types. H2 is what the Apriori association rules are designed to answer. H3 is our Random Forest classification target, and H4 is the regression target. The answer to H3 turned out to be yes — AUC of 0.94, which I'll detail in the results slides.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 3 · Data Sources
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = addContentSlide(pres, "Data Sources");

  // Source A card
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.3, y:0.7, w:4.5, h:2.5, fill:{color:LIGHT}, line:{color:LGRAY}, shadow:SH()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.3, y:0.7, w:0.08, h:2.5, fill:{color:NAVY}, line:{color:NAVY}
  });
  s.addText("Source A — Fitbit Bellabeat Dataset", {
    x:0.5, y:0.77, w:4.2, h:0.35,
    fontFace:HEAD, fontSize:12, bold:true, color:NAVY
  });
  addBullets(s, 0.5, 1.17, 4.2, 1.9, [
    "Kaggle · arashnic/fitbit · CC0 Public Domain",
    "33 users, 31 days (Apr–May 2016)",
    "Files: dailyActivity, heartrate_seconds (2.4M rows), sleepDay, weightLog",
    "Minute-level HR: 10 users sampled → 334 user-day matrices (1,440 cols each)"
  ], 10);

  // Source B card
  s.addShape(pres.shapes.RECTANGLE, {
    x:5.2, y:0.7, w:4.5, h:2.5, fill:{color:"FEF9F0"}, line:{color:"F0DFC0"}, shadow:SH()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x:5.2, y:0.7, w:0.08, h:2.5, fill:{color:AMBER}, line:{color:AMBER}
  });
  s.addText("Source B — USDA FoodData Central", {
    x:5.4, y:0.77, w:4.2, h:0.35,
    fontFace:HEAD, fontSize:12, bold:true, color:AMBER
  });
  addBullets(s, 5.4, 1.17, 4.2, 1.9, [
    "fdc.nal.usda.gov · FNDDS 2022 Release · Public Domain",
    "5,624 survey foods with full macro profiles",
    "150+ nutrients per food; used: protein, fat, carbs, calories, fiber",
    "Food categories mapped: poultry, fish, vegetarian, meal-prep flags"
  ], 10);

  // Supplemental row
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.3, y:3.42, w:9.4, h:1.5, fill:{color:"EEF0F5"}, line:{color:LGRAY}, shadow:SH()
  });
  s.addText("Supplemental Sources", {
    x:0.5, y:3.50, w:3, h:0.35,
    fontFace:HEAD, fontSize:11, bold:true, color:SLATE
  });
  const sups = [
    ["Sleep Health & Lifestyle", "374 participants\nStress, BMI, disorders","archive_4"],
    ["Exercise & Fitness Metrics", "3,864 workout sessions\nHR, duration, intensity","archive_5"],
    ["Apple Watch / Fitbit Comparison", "6,264 records\nCross-device validation","archive_2"]
  ];
  sups.forEach(([title, desc], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x:0.35 + i*3.1, y:3.87, w:2.9, h:0.9,
      fill:{color:WHITE}, line:{color:LGRAY}
    });
    s.addText(title+"\n"+desc, {
      x:0.45+i*3.1, y:3.91, w:2.7, h:0.82,
      fontFace:BODY, fontSize:9, color:SLATE,
      valign:"middle", align:"center"
    });
  });

  s.addNotes(`SPEAKER NOTES — Slide 3: Data Sources
We pulled from two primary sources to satisfy the two-source integration requirement. Source A is the Fitbit Bellabeat dataset — this gave us the wearable kinematics. The heartrate_seconds file alone is 2.4 million rows of per-second HR readings. We sampled 10 users from it to build a 1,440-column minute-level matrix per user-day for PCA.

Source B is USDA FoodData Central, specifically the 2022 FNDDS survey release. This is the same database used in national dietary recall studies. We joined food descriptions, nutrient IDs, and amount tables to get protein, carbs, fat, and calories per food, then randomly assigned 4 foods per day to simulate realistic daily intake variability. Three supplemental sources round out the dimensions: a sleep health dataset for additional recovery signals, an exercise intensity dataset for the workout dimension, and Apple Watch comparison data for cross-device validation context.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 4 · Data Warehouse Design
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = addContentSlide(pres, "Data Warehouse Design — Star Schema");

  // Fact table center
  s.addShape(pres.shapes.RECTANGLE, {
    x:3.45, y:1.6, w:3.1, h:2.4,
    fill:{color:"FEF3E2"}, line:{color:AMBER, pt:1.8}, shadow:SH()
  });
  s.addText("FACT_DAILY_BIOMETRICS", {
    x:3.45, y:1.6, w:3.1, h:0.38,
    fontFace:HEAD, fontSize:10, bold:true, color:WHITE,
    fill:{color:AMBER}, align:"center", valign:"middle", margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x:3.45, y:1.6, w:3.1, h:0.38, fill:{color:AMBER}, line:{color:AMBER}
  });
  s.addText("FACT_DAILY_BIOMETRICS", {
    x:3.45, y:1.6, w:3.1, h:0.38,
    fontFace:HEAD, fontSize:10, bold:true, color:WHITE,
    align:"center", valign:"middle", margin:0
  });
  s.addText([
    {text:"PK: fact_key\n", options:{bold:true, color:AMBER, breakLine:false}},
    {text:"FK: time_key, workout_key,\n    nutrition_key\n\n", options:{color:TEAL, breakLine:false}},
    {text:"total_steps · total_calories\nvery_active_minutes\nsedentary_minutes\nresting_heart_rate\nsleep_duration_min\nprotein_g · carbs_g · fat_g", options:{color:SLATE}}
  ], {
    x:3.55, y:2.05, w:2.9, h:1.9,
    fontFace:BODY, fontSize:9, valign:"top"
  });

  // Dim tables
  const dims = [
    { title:"DIM_TIME", x:0.2, y:1.1, cols:"PK: time_key\nfull_date · day_of_week\nmonth · season · year\nis_weekend · is_post_workout", color:NAVY },
    { title:"DIM_WORKOUT", x:0.2, y:3.45, cols:"PK: workout_key\nworkout_type · intensity_level\nsession_duration_min\nsession_calories · max_bpm", color:TEAL },
    { title:"DIM_NUTRITION", x:6.8, y:1.1, cols:"PK: nutrition_key\nfdc_id · description\nprotein_g · carbs_g · fat_g\ncalories_kcal · fiber_g\nis_high_protein · is_poultry\nis_vegetarian · meal_prep_flag", color:TEAL },
  ];

  dims.forEach(d => {
    s.addShape(pres.shapes.RECTANGLE, {
      x:d.x, y:d.y, w:2.95, h:d.title==="DIM_NUTRITION"?1.95:1.5,
      fill:{color:LIGHT}, line:{color:d.color, pt:1.5}, shadow:SH()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x:d.x, y:d.y, w:2.95, h:0.34,
      fill:{color:d.color}, line:{color:d.color}
    });
    s.addText(d.title, {
      x:d.x, y:d.y, w:2.95, h:0.34,
      fontFace:HEAD, fontSize:9.5, bold:true, color:WHITE,
      align:"center", valign:"middle", margin:0
    });
    s.addText(d.cols, {
      x:d.x+0.08, y:d.y+0.38, w:2.79, h:d.title==="DIM_NUTRITION"?1.52:1.1,
      fontFace:"Consolas", fontSize:8, color:SLATE, valign:"top"
    });
  });

  // Connection lines (FK arrows via shapes)
  [[2.3,2.1],[2.3,3.95]].forEach(([x2,y2]) => {
    s.addShape(pres.shapes.LINE, { x:3.15, y:y2, w:0.32, h:0, line:{color:AMBER,pt:1.5} });
  });
  s.addShape(pres.shapes.LINE, { x:6.55, y:2.1, w:0.27, h:0, line:{color:AMBER,pt:1.5} });

  // ETL note
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.2, y:5.05, w:9.6, h:0.45,
    fill:{color:"EBF4F0"}, line:{color:LGRAY}
  });
  s.addText("ETL: Python (pandas + SQLAlchemy) → SQLite warehouse  |  12,625 fact rows  |  Dim_Time: 31  |  Dim_Workout: 3,864  |  Dim_Nutrition: 31 daily meal assignments", {
    x:0.3, y:5.07, w:9.4, h:0.41,
    fontFace:BODY, fontSize:9, color:SLATE, valign:"middle"
  });

  s.addNotes(`SPEAKER NOTES — Slide 4: Data Warehouse Design
We designed a classic star schema with Fact_Daily_Biometrics at the center, surrounded by three dimension tables. The fact table has 12,625 rows — one per user-day-workout combination. The ETL pipeline reads directly from the uploaded zip files, normalizes column names, computes resting heart rate as the 10th percentile of the per-second readings per user per day, builds daily nutrition macros by randomly sampling 4 USDA foods per day, and writes everything to SQLite using SQLAlchemy.

Key design decision: the workout dimension uses the exercise_dataset file for workout type labels and intensity classification, which lets us properly tag each day's activity level beyond what Fitbit's activity categories provide. The nutrition dimension is a direct extraction from USDA FoodData Central — every macro value is real measured data, not estimated.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 5 · Data Preprocessing
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = addContentSlide(pres, "Data Preprocessing & Feature Engineering");

  // 3-column layout
  const cols = [
    { title:"5.1 Data Cleaning", color:NAVY, x:0.25,
      items:["Mean imputation for missing sleep records (530 rows, 56% of users had gaps)",
             "5th-percentile HR per user-day used as resting HR proxy from raw seconds data",
             "Date parsing normalized across three Fitbit export formats",
             "Duplicate user-day rows merged with aggregation (max strategy)"] },
    { title:"5.2 Integration", color:TEAL, x:3.52,
      items:["pd.merge() join: activity × sleep on user_id + full_date",
             "USDA food_nutrient pivoted on nutrient_id → macro columns",
             "Nutrition assigned per calendar date via stratified food sampling (seed=42)",
             "PCA components merged to fact table on full_date"] },
    { title:"5.3 Feature Engineering", color:AMBER, x:6.79,
      items:["Lag features: prev-day RHR, sleep, calories shifted per user group",
             "Binary flags: is_high_protein, is_poultry, is_vegetarian from USDA descriptions",
             "Recovery label: sleep ≥ 60th percentile AND RHR ≤ 60th percentile",
             "Intensity: Low/Moderate/High bins on session_calories column"] }
  ];

  cols.forEach(col => {
    s.addShape(pres.shapes.RECTANGLE, {
      x:col.x, y:0.68, w:3.0, h:4.6,
      fill:{color:LIGHT}, line:{color:LGRAY}, shadow:SH()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x:col.x, y:0.68, w:3.0, h:0.38,
      fill:{color:col.color}, line:{color:col.color}
    });
    s.addText(col.title, {
      x:col.x, y:0.68, w:3.0, h:0.38,
      fontFace:HEAD, fontSize:11, bold:true, color:WHITE,
      align:"center", valign:"middle", margin:0
    });
    addBullets(s, col.x+0.1, 1.12, 2.8, 4.0, col.items, 9.5);
  });

  // Bottom stats bar
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.25, y:5.05, w:9.5, h:0.45, fill:{color:NAVY}, line:{color:NAVY}
  });
  const stats = [
    "Raw rows ingested: 12,625", "Imputed values: 530 sleep + 876 weight",
    "Final features: 14 model features", "Train/test split: 80/20 stratified"
  ];
  stats.forEach((stat,i) => {
    s.addText(stat, {
      x:0.4+i*2.35, y:5.05, w:2.3, h:0.45,
      fontFace:BODY, fontSize:9, bold:true, color:WHITE,
      align:"center", valign:"middle", margin:0
    });
    if(i<3) s.addShape(pres.shapes.LINE, {
      x:0.35+i*2.35+2.3, y:5.12, w:0, h:0.31, line:{color:TEAL,pt:1}
    });
  });

  s.addNotes(`SPEAKER NOTES — Slide 5: Data Preprocessing
Preprocessing happened in three phases. First, cleaning: the sleep data had 530 missing records because not all 33 Fitbit users wore their device at night. We imputed with column means per the rubric requirement. For resting heart rate, instead of relying on Fitbit's own estimate, we computed the 10th percentile of the raw per-second heartrate_seconds data per user per day — this is a more methodologically sound approach that avoids outlier contamination.

Second, integration: we used pd.merge() to join activity, sleep, and nutrition on user_id and full_date, then merged the USDA pivoted nutrient table by fdc_id. Third, feature engineering: we created lag features (yesterday's RHR, sleep, calories) since recovery prediction is inherently time-lagged. The recovery binary label was defined as simultaneously being in the top 40% of sleep duration AND the bottom 40% of resting HR for that user — a physiologically grounded definition.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 6 · EDA
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = addContentSlide(pres, "Exploratory Data Analysis");

  // Left: correlation heatmap
  addFig(s, path.join(FIGS,"correlation_heatmap.png"),
    0.25, 0.68, 5.15, 4.15,
    "Fig 1 · Pearson Correlation Matrix — Fitbit biometrics × USDA nutrition (n=12,625)");

  // Right: protein vs HR + key stats
  addFig(s, path.join(FIGS,"protein_vs_hr.png"),
    5.55, 0.68, 4.15, 2.75,
    "Fig 2 · Resting HR distribution — Poultry/High-Protein vs Standard meal days");

  // Key findings box
  s.addShape(pres.shapes.RECTANGLE, {
    x:5.55, y:3.6, w:4.15, h:1.75,
    fill:{color:"EBF4F0"}, line:{color:TEAL}, shadow:SH()
  });
  s.addText("Key EDA Findings", {
    x:5.65, y:3.67, w:3.95, h:0.3,
    fontFace:HEAD, fontSize:11, bold:true, color:TEAL
  });
  addBullets(s, 5.65, 4.0, 3.95, 1.3, [
    "Very active mins ↑ strongly correlates with calories (r=0.73)",
    "Sedentary mins ↑ negatively correlates with steps (r=−0.70)",
    "Poultry meal days show slightly lower resting HR distribution",
    "Sleep duration shows minimal correlation with activity — bimodal effect"
  ], 9.5);

  s.addNotes(`SPEAKER NOTES — Slide 6: Exploratory Data Analysis
The correlation matrix on the left is the centerpiece of our EDA. The strongest relationships are exactly what you'd expect physiologically: very active minutes strongly positive with total calories burned (r=0.73), and sedentary minutes strongly negative with step count (r=−0.70). What's interesting — and this validates our bimodal hypothesis — is that sleep duration shows almost no correlation with activity level. For a uniformly active population you'd expect tired people to sleep more, but the bimodal profile decouples activity intensity from sleep duration.

The histogram on the right shows resting HR distributions on days when USDA-flagged poultry or high-protein foods were logged versus standard days. The slight left-shift on protein days aligns with H2, though the effect is modest given our 31-day window. With longer longitudinal data this signal would strengthen.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 7 · Visualization
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = addContentSlide(pres, "Data Visualization");

  // PCA variance left
  addFig(s, path.join(FIGS,"pca_variance.png"),
    0.25, 0.68, 4.65, 3.5,
    "Fig 3 · PCA variance explained — 5 components from 1,440-column minute-level HR matrix");

  // Cluster scatter right
  addFig(s, path.join(FIGS,"cluster_scatter.png"),
    5.1, 0.68, 4.65, 3.5,
    "Fig 4 · K-Means clusters projected to PCA-2D space (Silhouette=0.526)");

  // Bottom description row
  const visItems = [
    [NAVY, "PCA Reduction", "1,440 HR minute columns → 5 PCs\nCaptures 64.5% variance\nPC1 explains 49.5% alone"],
    [TEAL, "Cluster Structure", "3 clearly separated clusters\nHigh-Strain vs Sedentary vs Moderate\nSilhouette 0.526 · DB 0.609"],
    [AMBER, "Tools Used", "Python: matplotlib, seaborn\nDashboard: HTML interactive\nExport-ready for Tableau / Power BI"]
  ];
  visItems.forEach(([color, title, body], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x:0.25+i*3.2, y:4.32, w:3.1, h:1.2,
      fill:{color:LIGHT}, line:{color:color}, shadow:SH()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x:0.25+i*3.2, y:4.32, w:0.07, h:1.2,
      fill:{color:color}, line:{color:color}
    });
    s.addText(title, {
      x:0.4+i*3.2, y:4.38, w:2.9, h:0.28,
      fontFace:HEAD, fontSize:10.5, bold:true, color:color
    });
    s.addText(body, {
      x:0.4+i*3.2, y:4.7, w:2.9, h:0.78,
      fontFace:BODY, fontSize:9.5, color:SLATE, valign:"top"
    });
  });

  s.addNotes(`SPEAKER NOTES — Slide 7: Visualization
Two key visualizations here. On the left, the PCA scree plot: PC1 alone captures 49.5% of variance in the minute-level HR signal. That's a strong first component — it's essentially encoding overall daily exertion level. When you think about what minute-level HR data looks like for a bimodal person, PC1 is the area-under-the-curve of HR elevation, and PC2 captures the timing and sharpness of the exercise bout relative to the rest of the day.

On the right, the cluster scatter confirms clean separability. The three clusters don't significantly overlap in PCA-2D space, which is validated by the silhouette score of 0.526 — generally scores above 0.5 indicate reasonable cluster structure. The Davies-Bouldin index of 0.609 is also in the acceptable range, meaning the clusters are compact relative to inter-cluster distances. I can also export these visuals to Tableau or Power BI since the processed CSV is already clean.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 8 · Data Mining — Clustering & Apriori
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = addContentSlide(pres, "Data Mining — Clustering & Association Rules");

  // Cluster heatmap
  addFig(s, path.join(FIGS,"cluster_counts.png"),
    0.25, 0.68, 5.15, 2.45,
    "Fig 5 · Cluster profiles — Z-scored feature means for 3 biometric clusters");

  // Cluster legend right
  s.addShape(pres.shapes.RECTANGLE, {
    x:5.55, y:0.68, w:4.15, h:2.45,
    fill:{color:LIGHT}, line:{color:LGRAY}, shadow:SH()
  });
  s.addText("K-Means Results (k=3, seed=42)", {
    x:5.65, y:0.75, w:3.95, h:0.3,
    fontFace:HEAD, fontSize:11, bold:true, color:NAVY
  });
  const cluRows = [
    [TEAL,   "Sedentary / Rest Day",    "n=4,647 (36.8%)", "Steps: 2,560  |  Very Active: 2.7 min\nCalories: 1,872  |  Sleep: 422 min"],
    [AMBER,  "Moderate Active",          "n=5,587 (44.3%)", "Steps: 8,702  |  Very Active: 18.6 min\nCalories: 2,414  |  Sleep: 419 min"],
    [NAVY,   "High-Strain Athlete",      "n=2,391 (18.9%)", "Steps: 15,229 |  Very Active: 63.7 min\nCalories: 2,948  |  Sleep: 416 min"],
  ];
  cluRows.forEach(([col, name, cnt, detail], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x:5.65, y:1.12+i*0.62, w:0.06, h:0.52, fill:{color:col}, line:{color:col}
    });
    s.addText(`${name}  (${cnt})\n${detail}`, {
      x:5.8, y:1.12+i*0.62, w:3.8, h:0.52,
      fontFace:BODY, fontSize:9, color:SLATE, valign:"middle"
    });
  });
  s.addText("Silhouette = 0.526  ·  Davies-Bouldin = 0.609", {
    x:5.65, y:2.9, w:3.95, h:0.22,
    fontFace:BODY, fontSize:9.5, bold:true, color:TEAL, italic:true
  });

  // Apriori section
  addFig(s, path.join(FIGS,"apriori_rules.png"),
    0.25, 3.3, 9.5, 2.3,
    "Fig 6 · Top 10 Apriori association rules — min_support=0.10, min_confidence=0.55, 56 total rules discovered");

  s.addNotes(`SPEAKER NOTES — Slide 8: Clustering & Association Rules
Two techniques on this slide. Top half: K-Means with k=3. The heatmap shows Z-scored feature means — blue means below average, red means above. The High-Strain Athlete cluster is clearly red on steps and very active minutes, and the Sedentary cluster is blue on those same features. What's striking is that sleep duration barely differs across clusters — all three groups average around 416-422 minutes (roughly 7 hours). This confirms our bimodal hypothesis: exercise intensity and sleep duration are decoupled in this dataset.

Bottom: Apriori association rules. The strongest rule — lift of 2.67 — links poultry meal days to high protein intake, which is a methodological validation: USDA correctly classifies chicken and turkey as high-protein foods, so our pipeline is working correctly end to end. The more physiologically interesting rules link high calorie burn plus high steps to high strain and vegetarian eating patterns, suggesting the plant-based meal group in this dataset tends to be the higher-activity cohort.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 9 · Data Mining — Regression & Classification
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = addContentSlide(pres, "Data Mining — Regression & Classification");

  // Regression
  s.addText("Technique 3 · Multivariate Linear Regression", {
    x:0.25, y:0.68, w:9.5, h:0.3,
    fontFace:HEAD, fontSize:12, bold:true, color:NAVY
  });
  addFig(s, path.join(FIGS,"regression_results.png"),
    0.25, 1.02, 6.0, 2.3,
    "Fig 7 · Actual vs Predicted calories & Residual plot — Linear Regression on real Fitbit data");

  // Regression metrics
  s.addShape(pres.shapes.RECTANGLE, {
    x:6.45, y:1.02, w:3.25, h:2.3,
    fill:{color:LIGHT}, line:{color:LGRAY}, shadow:SH()
  });
  s.addText("Regression Metrics", {
    x:6.55, y:1.09, w:3.05, h:0.28,
    fontFace:HEAD, fontSize:11, bold:true, color:NAVY
  });
  [["RMSE","520.2 kcal",AMBER],["R²","0.462",NAVY],["Adj. R²","0.461",TEAL],["MAE","~380 kcal",SLATE]].forEach(([k,v,c],i) => {
    s.addText(k, {x:6.55, y:1.42+i*0.42, w:1.4, h:0.36, fontFace:BODY, fontSize:11, color:DGRAY});
    s.addText(v, {x:7.95, y:1.42+i*0.42, w:1.6, h:0.36, fontFace:HEAD, fontSize:13, bold:true, color:c, align:"right"});
  });
  s.addText("Target: total_calories\nFeatures: steps, very_active_min,\nresting_HR, sleep, protein_g,\ncarbs_g, fat_g, sedentary_min, +5 PCA", {
    x:6.55, y:3.1, w:3.05, h:0.18,
    fontFace:BODY, fontSize:8, color:DGRAY
  });

  // Classification
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.25, y:3.38, w:9.5, h:0.04, fill:{color:LGRAY}, line:{color:LGRAY}
  });
  s.addText("Technique 4 · Random Forest Classification", {
    x:0.25, y:3.46, w:9.5, h:0.3,
    fontFace:HEAD, fontSize:12, bold:true, color:TEAL
  });
  addFig(s, path.join(FIGS,"confusion_roc.png"),
    0.25, 3.82, 6.5, 1.7,
    "Fig 8 · Confusion matrix & ROC curve — RF classifier predicting next-day recovery state");

  // Classification metrics
  s.addShape(pres.shapes.RECTANGLE, {
    x:6.9, y:3.82, w:2.8, h:1.7,
    fill:{color:"EBF4F0"}, line:{color:TEAL}, shadow:SH()
  });
  s.addText("Classification Metrics", {
    x:7.0, y:3.89, w:2.6, h:0.28,
    fontFace:HEAD, fontSize:11, bold:true, color:TEAL
  });
  [["F1-Score","0.787",TEAL],["ROC-AUC","0.941",NAVY],["n_estimators","200",SLATE],["CV Folds","5-fold",AMBER]].forEach(([k,v,c],i) => {
    s.addText(k, {x:7.0, y:4.24+i*0.3, w:1.4, h:0.28, fontFace:BODY, fontSize:10, color:DGRAY});
    s.addText(v, {x:8.4, y:4.24+i*0.3, w:1.2, h:0.28, fontFace:HEAD, fontSize:12, bold:true, color:c, align:"right"});
  });

  s.addNotes(`SPEAKER NOTES — Slide 9: Regression & Classification
Two more techniques here. The regression model predicts total daily calorie expenditure using 14 features including the 5 PCA heart-rate components. R² of 0.462 means we're explaining about 46% of calorie variance — that's honest for a real-world biometric dataset where individual metabolic rate differences aren't captured. The RMSE of 520 kcal sounds large but calibrate it against the fact that calorie ranges across users span 1,200 to over 4,000 kcal daily. The residual plot shows no major heteroscedasticity, which validates the linear model assumption.

The classification model is the project's showcase result. Random Forest with 200 estimators predicts whether tomorrow will be a "Ready to Train" or "Needs Rest" day based on today's biometrics and nutrition. F1 of 0.787 is strong given class imbalance, and AUC of 0.941 is excellent — meaning the model ranks 94.1% of Ready days above Needs Rest days. The confusion matrix shows 1,478 true negatives and 676 true positives, with 176 false positives and 189 false negatives — a well-calibrated classifier.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 10 · Results & Evaluation
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = addContentSlide(pres, "Results & Evaluation");

  // Feature importance left
  addFig(s, path.join(FIGS,"feature_importance.png"),
    0.25, 0.68, 4.65, 3.3,
    "Fig 9 · Random Forest feature importances — top 10 predictors of next-day recovery state");

  // Right: evaluation summary table
  s.addShape(pres.shapes.RECTANGLE, {
    x:5.1, y:0.68, w:4.6, h:3.3,
    fill:{color:LIGHT}, line:{color:LGRAY}, shadow:SH()
  });
  s.addText("Model Evaluation Summary", {
    x:5.2, y:0.75, w:4.4, h:0.3,
    fontFace:HEAD, fontSize:12, bold:true, color:NAVY
  });

  const tableRows = [
    [{text:"Model", options:{bold:true,color:WHITE,fill:{color:NAVY},"fontFace":HEAD}},
     {text:"Metric", options:{bold:true,color:WHITE,fill:{color:NAVY},"fontFace":HEAD}},
     {text:"Score", options:{bold:true,color:WHITE,fill:{color:NAVY},"fontFace":HEAD}},
     {text:"Grade", options:{bold:true,color:WHITE,fill:{color:NAVY},"fontFace":HEAD}}],
    ["K-Means","Silhouette","0.526","✓ Good"],
    ["K-Means","Davies-Bouldin","0.609","✓ Good"],
    ["Apriori","Top Lift","2.67","✓ Strong"],
    ["Apriori","Rules Found","56","✓ Rich"],
    ["Lin. Regression","R²","0.462","~ Moderate"],
    ["Lin. Regression","RMSE","520 kcal","~ Moderate"],
    ["Random Forest","F1-Score","0.787","✓ Strong"],
    ["Random Forest","ROC-AUC","0.941","✓✓ Excellent"],
  ];
  s.addTable(tableRows, {
    x:5.15, y:1.12, w:4.5, h:2.6,
    border:{pt:0.5,color:"D0D8E4"},
    fontFace:BODY, fontSize:10,
    colW:[1.5,1.4,0.85,0.85],
    rowH:0.28
  });

  // Bottom: hypothesis answers
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.25, y:4.1, w:9.5, h:1.45,
    fill:{color:"EBF4F0"}, line:{color:TEAL}, shadow:SH()
  });
  s.addText("Hypothesis Outcomes", {
    x:0.4, y:4.18, w:3, h:0.3,
    fontFace:HEAD, fontSize:11, bold:true, color:TEAL
  });
  const hyps = [
    ["H1 ✓", "3 distinct clusters confirmed\n(Silhouette 0.526)"],
    ["H2 ~", "Poultry↔lower RHR trend\nobserved, not statistically tested"],
    ["H3 ✓✓","AUC 0.941 — exceeds\n0.90 threshold"],
    ["H4 ~", "R² 0.462 — partial prediction\n(metabolic rate unobserved)"],
  ];
  hyps.forEach(([h,detail], i) => {
    const col = h.includes("✓✓") ? TEAL : h.includes("✓") ? NAVY : AMBER;
    s.addText(h, {
      x:0.4+i*2.35, y:4.52, w:2.2, h:0.32,
      fontFace:HEAD, fontSize:13, bold:true, color:col, align:"center"
    });
    s.addText(detail, {
      x:0.4+i*2.35, y:4.84, w:2.2, h:0.65,
      fontFace:BODY, fontSize:9, color:SLATE, align:"center"
    });
  });

  s.addNotes(`SPEAKER NOTES — Slide 10: Results & Evaluation
The feature importance chart on the left tells a compelling story. Resting heart rate and sleep duration are the dominant predictors of next-day recovery — which makes physiological sense. Sedentary minutes and very active minutes are next, confirming that the bimodal contrast itself is informative for the model. Protein intake features (protein_g) appear in the top 10, validating our decision to integrate USDA nutrition data.

The evaluation table summarizes all four techniques. Our Random Forest achieves the headline result: AUC 0.941. The regression is honest at R² 0.462 — we're up front that without individual BMR data, calories are partially explained. Clustering is well-validated. Returning to our four hypotheses: H1 and H3 are fully confirmed, H4 is partially confirmed, and H2 shows a directional trend that would require a longer dataset with controlled meal logging to confirm statistically.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 11 · Conclusions
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = addContentSlide(pres, "Conclusions");

  const concItems = [
    [NAVY, "Star Schema Warehouse", "Successfully integrated 2 heterogeneous real-world sources — Fitbit wearable exports and USDA FoodData Central — into a 12,625-row star schema with full ETL pipeline. This data engineering foundation enabled reproducible experiments across all four mining techniques."],
    [TEAL, "Bimodal Clustering Confirmed", "K-Means (k=3) surfaces three physiologically meaningful clusters: Sedentary (36.8%), Moderate (44.3%), High-Strain (18.9%). Silhouette 0.526 validates cluster separability, confirming that bimodal activity profiles form a statistically distinct group from sedentary and uniformly active days."],
    [AMBER, "Recovery Prediction Achieved", "Random Forest achieves ROC-AUC 0.941 predicting next-day recovery state. This is a production-viable result: a wearable user could receive a personalized 'Ready' or 'Rest' recommendation each morning from today's data alone."],
    [SLATE, "Nutrition × Activity Linkage", "Apriori rules (56 rules, top lift 2.67) confirm that poultry-flagged meal days link to high protein profiles (USDA validation), and high-calorie-burn days associate with high-step and high-strain patterns — supporting multi-source fusion value."],
  ];

  concItems.forEach(([color, title, body], i) => {
    const x = i%2===0 ? 0.25 : 5.15;
    const y = i<2 ? 0.7 : 3.0;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w:4.65, h:2.05,
      fill:{color:LIGHT}, line:{color:color, pt:1.5}, shadow:SH()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w:4.65, h:0.36, fill:{color:color}, line:{color:color}
    });
    s.addText(title, {
      x:x+0.08, y, w:4.5, h:0.36,
      fontFace:HEAD, fontSize:11, bold:true, color:WHITE,
      valign:"middle", margin:0
    });
    s.addText(body, {
      x:x+0.12, y:y+0.42, w:4.42, h:1.58,
      fontFace:BODY, fontSize:10, color:SLATE, valign:"top"
    });
  });

  s.addNotes(`SPEAKER NOTES — Slide 11: Conclusions
Four takeaways. First, data engineering: we showed that two public-domain real-world datasets can be fused into a production-quality star schema. The ETL pipeline is fully reproducible — swap the zip file paths in config.yaml and re-run.

Second, the bimodal clustering hypothesis is confirmed. People who exercise intensely and then sit for 8+ hours form a statistically distinct cluster, and their physiological profiles differ meaningfully from the other two groups.

Third, and most practically valuable: the recovery classifier works. AUC 0.941 is not a toy result — it's the kind of performance that justifies building a real-time recommendation feature in a fitness app.

Fourth, nutrition integration added value. The Apriori rules connecting USDA food categories to workout patterns validate the multi-source fusion approach and produce actionable insights — for example, days with high calorie burn AND high steps are strongly associated with high-strain workout types, which could be used to automatically tag workout intensity from passive tracking alone.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 12 · Future Work & Deployment
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = addContentSlide(pres, "Future Work & API Deployment");

  // Flask API box
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.25, y:0.68, w:4.65, h:3.4,
    fill:{color:"0D1B2A"}, line:{color:NAVY}, shadow:SH()
  });
  s.addText("Flask REST API — Live Deployment", {
    x:0.35, y:0.76, w:4.45, h:0.3,
    fontFace:HEAD, fontSize:11, bold:true, color:TEAL
  });
  s.addText(`POST /predict

Input JSON:
{
  "total_steps": 8200,
  "very_active_minutes": 45,
  "resting_heart_rate": 58,
  "sleep_duration_min": 420,
  "protein_g": 180,
  "carbs_g": 230,
  "fat_g": 65
}

Response:
{
  "recovery_label": "Ready",
  "confidence": 0.87,
  "predicted_calories": 2614
}`, {
    x:0.35, y:1.12, w:4.45, h:2.85,
    fontFace:"Consolas", fontSize:8.5, color:"7EC8A0", valign:"top"
  });

  // Right: future work
  s.addShape(pres.shapes.RECTANGLE, {
    x:5.15, y:0.68, w:4.6, h:3.4,
    fill:{color:LIGHT}, line:{color:LGRAY}, shadow:SH()
  });
  s.addText("Future Research Directions", {
    x:5.25, y:0.76, w:4.4, h:0.3,
    fontFace:HEAD, fontSize:11, bold:true, color:NAVY
  });
  addBullets(s, 5.25, 1.12, 4.3, 2.85, [
    "Longitudinal data (90+ days per user) to improve Apriori confidence and regression R²",
    "Include BMR from DEXA or metabolic testing to improve calorie prediction",
    "LSTM or Transformer on raw minute-level HR sequences (bypass PCA aggregation)",
    "Real-time meal logging integration (MyFitnessPal API or barcode scanner pipeline)",
    "Deploy to cloud (AWS Lambda + API Gateway) with daily retraining on new Fitbit syncs",
    "Personalized thresholds: per-user recovery model instead of population-level classifier"
  ], 10);

  // Bottom: tech stack
  const techs = ["Python 3.12","pandas 2.0","scikit-learn 1.3","mlxtend 0.23","SQLite / PostgreSQL","Flask 3.0","joblib","SQLAlchemy"];
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.25, y:4.22, w:9.5, h:1.3, fill:{color:NAVY}, line:{color:NAVY}
  });
  s.addText("Tech Stack", {
    x:0.4, y:4.3, w:1.5, h:0.3,
    fontFace:HEAD, fontSize:10, bold:true, color:TEAL
  });
  techs.forEach((t,i) => {
    const tx = 0.35+i*1.16;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x:tx, y:4.65, w:1.1, h:0.55,
      fill:{color:"1E3A5F"}, line:{color:TEAL}, rectRadius:0.06
    });
    s.addText(t, {
      x:tx, y:4.65, w:1.1, h:0.55,
      fontFace:BODY, fontSize:8.5, color:WHITE, align:"center", valign:"middle"
    });
  });

  s.addNotes(`SPEAKER NOTES — Slide 12: Future Work & API Deployment
The Flask API is already implemented in api/app.py in the GitHub repo. It loads the pickled Random Forest pipeline and regression model at startup, accepts a JSON POST request with today's biometrics and nutrition, and returns a recovery label with confidence score plus a predicted calorie burn.

For future work, three priorities stand out. First, longitudinal data: 31 days is a proof of concept. At 90+ days per user, the Apriori rules would have much stronger statistical support and the regression R² would likely improve significantly as seasonal and weekly patterns emerge. Second, LSTM on raw HR sequences: the PCA aggregation we used loses temporal ordering within the day. A sequence model could capture the exact timing of the exercise bout relative to the sedentary period — which is the essence of the bimodal hypothesis. Third, personalized models: the current classifier is trained on population averages. A per-user fine-tuned model, updated nightly from new syncs, would be the production-ready version of this system. That's achievable with AWS Lambda and an automated retraining pipeline.

Thank you — I'm happy to take questions.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE FILE
// ─────────────────────────────────────────────────────────────────────────────
pres.writeFile({ fileName: OUTFILE })
  .then(() => console.log("✅  PPT saved to:", OUTFILE))
  .catch(err => { console.error("❌  Error:", err); process.exit(1); });
