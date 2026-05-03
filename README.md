# The Bimodal Biometric Warehouse

This project implements the full CMPE 255 rubric flow for the **Bimodal Biometric Warehouse**: a star-schema warehouse, PCA-based feature reduction, EDA/visualizations, multiple data mining techniques (clustering, association rules, regression, classification), evaluation metrics, an interactive dashboard, and a Flask API skeleton.

## What’s inside

- **ETL pipeline** that loads Fitbit + exercise + sleep + USDA FoodData Central survey data into a star-schema warehouse.
- **PCA pipeline** that compresses minute-level heart-rate sequences into 3–5 components.
- **Association rules** (Apriori) on nutrition + workout flags.
- **Clustering, regression, and classification** models with evaluation metrics.
- **Interactive dashboard** (Streamlit) for EDA and findings.
- **Presentation deck** generator with speaker notes.

## Data sources (configured in `config.yaml`)

- Fitbit activity & heart rate: `/Users/anumyad/Downloads/archive (1).zip`
- Fitbit secondary dataset: `/Users/anumyad/Downloads/archive (2).zip`
- USDA FoodData Central Survey (nutrition): `/Users/anumyad/Downloads/FoodData_Central_survey_food_csv_2022-10-28.zip`
- Sleep Health & Lifestyle dataset: `/Users/anumyad/Downloads/archive (4).zip`
- Exercise & Fitness Metrics dataset: `/Users/anumyad/Downloads/archive (5).zip`

## Quick start

1. Create a database (PostgreSQL preferred for rubric). Update `DATABASE_URL` in a `.env` file (see `.env.example`).
2. Create a local virtual environment and install dependencies.
3. Run the pipeline scripts in order.

```
# Optional: create .env from the example
cp .env.example .env

# Create & activate a virtual environment
/opt/homebrew/bin/python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
python -m pip install -r requirements.txt

# Run ETL
python scripts/etl.py

# Run PCA
python scripts/pca_pipeline.py

# Run Apriori rules
python scripts/apriori_rules.py

# Run modeling and evaluation
python scripts/modeling.py

# Build the presentation deck with speaker notes
python scripts/build_ppt.py

# Build a shareable HTML dashboard
python scripts/build_html_dashboard.py
```

## Interactive dashboard

```
streamlit run dashboard/app.py
```

### Static HTML dashboard (easy to publish)

`scripts/build_html_dashboard.py` generates `reports/dashboard.html`. You can publish it via GitHub Pages, Netlify, or any static file host.

**Quick GitHub Pages option**
1. Create a repo and push the project.
2. Move `reports/dashboard.html` to `docs/index.html` (GitHub Pages expects `docs/`).
3. Enable Pages in repo settings (source: `docs/`).
4. Share the generated URL.

## Flask API (skeleton)

```
/opt/homebrew/bin/python3 api/app.py
```

## Outputs

- `data/processed/daily_biometrics.csv`
- `data/processed/pca_components.csv`
- `data/processed/apriori_rules.csv`
- `data/processed/daily_with_clusters.csv`
- `models/` (PCA + ML models)
- `reports/metrics.json`
- `reports/bimodal_biometric_presentation.pptx`

## Notes on nutrition integration

FoodData Central doesn’t include daily logs, so the ETL script samples real foods from the USDA survey data and creates **daily macro totals** aligned to Fitbit dates. The macros and flags (`is_high_protein`, `is_poultry`, `is_vegetarian`) are therefore **derived from real food data**, but aggregated into synthetic daily combinations to support the star-schema design.
# STATSBIOMETRICANU
