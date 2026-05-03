from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
import yaml
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    confusion_matrix,
    f1_score,
    mean_squared_error,
    r2_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_config() -> dict:
    with open(PROJECT_ROOT / "config.yaml", "r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def build_recovery_label(df: pd.DataFrame) -> pd.Series:
    sleep_threshold = df["sleep_duration_min"].quantile(0.6)
    hr_threshold = df["resting_heart_rate"].quantile(0.6)
    return (df["sleep_duration_min"] >= sleep_threshold) & (df["resting_heart_rate"] <= hr_threshold)


def main() -> None:
    config = load_config()
    output_dir = PROJECT_ROOT / config["paths"]["output_dir"]
    models_dir = PROJECT_ROOT / config["paths"]["models_dir"]
    reports_dir = PROJECT_ROOT / config["paths"]["reports_dir"]

    df = pd.read_csv(output_dir / "daily_biometrics.csv")
    pca_path = output_dir / "pca_components.csv"
    if pca_path.exists():
        pca_df = pd.read_csv(pca_path)
        df = df.merge(pca_df, on="full_date", how="left")

    df["full_date"] = pd.to_datetime(df["full_date"])
    df = df.sort_values(["user_id", "full_date"]).reset_index(drop=True)
    df = df.fillna(df.mean(numeric_only=True))

    feature_cols = [
        "total_steps",
        "very_active_minutes",
        "resting_heart_rate",
        "sleep_duration_min",
        "protein_g",
        "carbs_g",
        "fat_g",
        "nutrition_calories",
        "sedentary_minutes",
    ]
    pca_cols = [col for col in df.columns if col.startswith("pca_")]
    feature_cols = feature_cols + pca_cols

    # Clustering
    kmeans = KMeans(n_clusters=config["settings"]["kmeans_clusters"], random_state=config["settings"]["random_state"])
    df["cluster"] = kmeans.fit_predict(df[feature_cols])

    # Regression: predict calories
    X = df[feature_cols]
    y_reg = df["total_calories"]
    X_train, X_test, y_train, y_test = train_test_split(X, y_reg, test_size=0.2, random_state=42)
    reg_model = LinearRegression()
    reg_model.fit(X_train, y_train)
    reg_pred = reg_model.predict(X_test)
    rmse = mean_squared_error(y_test, reg_pred) ** 0.5
    r2 = r2_score(y_test, reg_pred)

    # Classification: predict next-day recovery state using today's features
    df["recovery_ready"] = build_recovery_label(df).astype(int)
    df["recovery_ready_next"] = df.groupby("user_id")["recovery_ready"].shift(-1)
    cls_data = df.dropna(subset=["recovery_ready_next"]).copy()
    y_cls = cls_data["recovery_ready_next"].astype(int)
    X_cls = cls_data[feature_cols]
    X_train, X_test, y_train, y_test = train_test_split(
        X_cls, y_cls, test_size=0.2, random_state=42, stratify=y_cls
    )

    clf_pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("model", RandomForestClassifier(n_estimators=200, random_state=42)),
        ]
    )
    clf_pipeline.fit(X_train, y_train)
    cls_pred = clf_pipeline.predict(X_test)
    cls_proba = clf_pipeline.predict_proba(X_test)[:, 1]

    f1 = f1_score(y_test, cls_pred)
    roc_auc = roc_auc_score(y_test, cls_proba)
    cm = confusion_matrix(y_test, cls_pred).tolist()

    metrics = {
        "regression": {"rmse": rmse, "r2": r2},
        "classification": {"f1": f1, "roc_auc": roc_auc, "confusion_matrix": cm},
    }

    models_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    joblib.dump(kmeans, models_dir / "kmeans.pkl")
    joblib.dump(reg_model, models_dir / "regression.pkl")
    joblib.dump(clf_pipeline, models_dir / "recovery_classifier.pkl")
    (models_dir / "feature_columns.json").write_text(json.dumps(feature_cols, indent=2))

    df.to_csv(output_dir / "daily_with_clusters.csv", index=False)
    (reports_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))

    print("Modeling complete. Metrics saved to", reports_dir / "metrics.json")


if __name__ == "__main__":
    main()
