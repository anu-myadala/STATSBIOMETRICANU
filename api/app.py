from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
from flask import Flask, jsonify, request
PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "models" / "recovery_classifier.pkl"
FEATURES_PATH = PROJECT_ROOT / "models" / "feature_columns.json"

app = Flask(__name__)


@app.get("/health")
def health() -> tuple[dict, int]:
    return {"status": "ok"}, 200


@app.post("/predict")
def predict() -> tuple[dict, int]:
    if not MODEL_PATH.exists():
        return {"error": "Model not found. Run scripts/modeling.py first."}, 400
    if not FEATURES_PATH.exists():
        return {"error": "Feature list not found. Run scripts/modeling.py first."}, 400

    payload = request.get_json(silent=True) or {}
    feature_cols = json.loads(FEATURES_PATH.read_text())
    missing = [col for col in feature_cols if col not in payload]
    if missing:
        return {"error": f"Missing fields: {', '.join(missing)}"}, 400

    model = joblib.load(MODEL_PATH)
    features = np.array([[payload[col] for col in feature_cols]])

    proba = float(model.predict_proba(features)[0, 1])
    label = bool(model.predict(features)[0])

    return {
        "recovery_ready": label,
        "probability_ready": proba,
    }, 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
