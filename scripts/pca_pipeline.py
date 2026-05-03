from __future__ import annotations

import zipfile
from pathlib import Path
from typing import Dict
import sys

import joblib
import numpy as np
import pandas as pd
import yaml
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from utils.features import normalize_column_names


def load_config() -> Dict:
    with open(PROJECT_ROOT / "config.yaml", "r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def find_member(zip_path: str, needle: str) -> str:
    with zipfile.ZipFile(zip_path) as archive:
        for name in archive.namelist():
            if needle in name:
                return name
    raise FileNotFoundError(f"Could not find {needle} inside {zip_path}")


def read_zip_csv(zip_path: str, member_name: str) -> pd.DataFrame:
    with zipfile.ZipFile(zip_path) as archive:
        with archive.open(member_name) as handle:
            return pd.read_csv(handle)


def build_minute_matrix(hr_data: pd.DataFrame, sample_users: int, random_state: int) -> pd.DataFrame:
    hr_data = normalize_column_names(hr_data)
    hr_data["time"] = pd.to_datetime(hr_data["time"])
    hr_data["full_date"] = hr_data["time"].dt.date
    hr_data["minute"] = hr_data["time"].dt.hour * 60 + hr_data["time"].dt.minute

    user_ids = hr_data["id"].drop_duplicates().sample(min(sample_users, hr_data["id"].nunique()), random_state=random_state)
    hr_data = hr_data[hr_data["id"].isin(user_ids)]

    hr_daily = (
        hr_data.groupby(["id", "full_date", "minute"], as_index=False)["value"]
        .mean()
    )

    matrix = hr_daily.pivot_table(index=["id", "full_date"], columns="minute", values="value")
    matrix = matrix.reindex(columns=range(1440))

    # Impute missing minutes with row mean, then column mean
    matrix = matrix.apply(lambda row: row.fillna(row.mean()), axis=1)
    matrix = matrix.fillna(matrix.mean())

    matrix.index = pd.MultiIndex.from_tuples(matrix.index, names=["id", "full_date"])
    return matrix


def main() -> None:
    config = load_config()
    paths = config["paths"]
    settings = config["settings"]

    fitbit_zip = paths["fitbit_zip"]
    hr_member = find_member(fitbit_zip, "heartrate_seconds_merged.csv")
    hr_data = read_zip_csv(fitbit_zip, hr_member)

    minute_matrix = build_minute_matrix(
        hr_data,
        sample_users=settings["sample_user_count"],
        random_state=settings["random_state"],
    )

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("pca", PCA(n_components=settings["pca_components"], random_state=settings["random_state"])),
        ]
    )

    components = pipeline.fit_transform(minute_matrix.values)
    component_cols = [f"pca_{i + 1}" for i in range(components.shape[1])]
    component_df = pd.DataFrame(components, columns=component_cols)
    component_df["full_date"] = minute_matrix.index.get_level_values("full_date")
    component_df = component_df.groupby("full_date", as_index=False).mean()

    output_dir = PROJECT_ROOT / paths["output_dir"]
    models_dir = PROJECT_ROOT / paths["models_dir"]
    output_dir.mkdir(parents=True, exist_ok=True)
    models_dir.mkdir(parents=True, exist_ok=True)

    component_df.to_csv(output_dir / "pca_components.csv", index=False)
    joblib.dump(pipeline, models_dir / "pca_pipeline.pkl")

    print("PCA pipeline saved to", models_dir)


if __name__ == "__main__":
    main()
