# Bimodal Biometric Warehouse — CMPE 255 Spring 2026

## Quick Start

```bash
pip install -r requirements.txt

# 1. Update config.yaml with your zip file paths
# 2. Run full pipeline:
python scripts/etl.py
python scripts/pca_pipeline.py
python scripts/modeling.py
python scripts/apriori_rules.py

# 3. Start Flask API:
cd api && python app.py

# 4. Rebuild PPT (optional):
node scripts/build_ppt.js
```

## Real Metrics (from real Fitbit + USDA data)
- Classification F1: 0.787 | AUC: 0.941
- Regression R²: 0.462 | RMSE: 520.2 kcal
- K-Means Silhouette: 0.526 | Davies-Bouldin: 0.609
- Apriori: 56 rules found | Top lift: 2.67
