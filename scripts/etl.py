from __future__ import annotations

import json
import random
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Dict
import sys

import numpy as np
import pandas as pd
import yaml


@dataclass
class Config:
    paths: Dict[str, str]
    settings: Dict[str, int | float]


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from utils.db import get_engine
from utils.features import assign_season, normalize_column_names


def load_config() -> Config:
    with open(PROJECT_ROOT / "config.yaml", "r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle)
    return Config(paths=data["paths"], settings=data["settings"])


def find_member(zip_path: str, needle: str, prefer_substring: str | None = None) -> str:
    with zipfile.ZipFile(zip_path) as archive:
        matches = [name for name in archive.namelist() if needle in name]
        if not matches:
            raise FileNotFoundError(f"Could not find {needle} inside {zip_path}")
        if prefer_substring:
            preferred = [name for name in matches if prefer_substring in name]
            if preferred:
                return sorted(preferred)[-1]
        return sorted(matches)[-1]


def read_zip_csv(zip_path: str, member_name: str) -> pd.DataFrame:
    with zipfile.ZipFile(zip_path) as archive:
        with archive.open(member_name) as handle:
            return pd.read_csv(handle)


def extract_member(zip_path: str, member_name: str, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path) as archive:
        with archive.open(member_name) as source:
            output_path.write_bytes(source.read())
    return output_path


def build_time_dimension(dates: pd.Series) -> pd.DataFrame:
    time_dim = pd.DataFrame({"full_date": pd.to_datetime(dates).dt.date}).drop_duplicates()
    time_dim["full_date"] = pd.to_datetime(time_dim["full_date"])
    time_dim["day_of_week"] = time_dim["full_date"].dt.day_name()
    time_dim["month"] = time_dim["full_date"].dt.month
    time_dim["year"] = time_dim["full_date"].dt.year
    time_dim["is_weekend"] = time_dim["full_date"].dt.dayofweek >= 5
    time_dim["season"] = assign_season(time_dim["full_date"])
    time_dim = time_dim.sort_values("full_date").reset_index(drop=True)
    time_dim.insert(0, "time_key", np.arange(1, len(time_dim) + 1))
    return time_dim


def build_workout_dimension(workout: pd.DataFrame) -> pd.DataFrame:
    workout = normalize_column_names(workout)
    column_map = {
        "workout_type": "workout_type",
        "exercise": "workout_type",
        "session_duration": "session_duration_min",
        "duration": "session_duration_min",
        "calories_burned": "session_calories",
        "calories_burn": "session_calories",
        "max_bpm": "max_bpm",
        "heart_rate": "max_bpm",
        "resting_bpm": "resting_bpm",
    }
    workout = workout.rename(columns={key: value for key, value in column_map.items() if key in workout.columns})
    if "workout_type" not in workout.columns:
        workout["workout_type"] = "unknown"
    if "session_duration_min" not in workout.columns:
        workout["session_duration_min"] = workout.select_dtypes(include=["number"]).iloc[:, 0].fillna(30)
    if "session_calories" not in workout.columns:
        workout["session_calories"] = workout.select_dtypes(include=["number"]).iloc[:, 0].fillna(200)
    workout["intensity_level"] = pd.cut(
        workout["session_calories"],
        bins=[-np.inf, 200, 500, np.inf],
        labels=["low", "moderate", "high"],
    ).astype(str)
    workout = workout.drop_duplicates(subset=["workout_type", "session_duration_min", "session_calories"])
    workout = workout.reset_index(drop=True)
    workout.insert(0, "workout_key", np.arange(1, len(workout) + 1))
    return workout


def build_nutrition_dimension(
    food: pd.DataFrame,
    nutrient: pd.DataFrame,
    food_nutrient: pd.DataFrame,
    wweia_category: pd.DataFrame | None = None,
) -> pd.DataFrame:
    nutrient = normalize_column_names(nutrient)
    food_nutrient = normalize_column_names(food_nutrient)
    food = normalize_column_names(food)

    nutrient_map = nutrient.set_index("id")["name"].to_dict()
    food_nutrient["nutrient_name"] = food_nutrient["nutrient_id"].map(nutrient_map)
    if food_nutrient["nutrient_name"].isna().mean() > 0.9 and "nutrient_nbr" in nutrient.columns:
        nutrient_clean = nutrient.dropna(subset=["nutrient_nbr"]).drop_duplicates(subset=["nutrient_nbr"])
        nutrient_map = nutrient_clean.set_index("nutrient_nbr")["name"].to_dict()
        food_nutrient["nutrient_name"] = food_nutrient["nutrient_id"].map(nutrient_map)

    macro_filter = food_nutrient["nutrient_name"].isin(
        ["Protein", "Total lipid (fat)", "Carbohydrate, by difference"]
    )
    macros = food_nutrient.loc[macro_filter, ["fdc_id", "nutrient_name", "amount"]]

    macro_table = macros.pivot_table(
        index="fdc_id", columns="nutrient_name", values="amount", aggfunc="sum"
    ).reset_index()
    macro_table = macro_table.rename(
        columns={
            "Protein": "protein_g",
            "Total lipid (fat)": "fat_g",
            "Carbohydrate, by difference": "carbs_g",
        }
    )

    if "description" in food.columns:
        food_lookup = food[["fdc_id", "description"]].copy()
    elif wweia_category is not None and "wweia_category_number" in food.columns:
        wweia_category = normalize_column_names(wweia_category)
        category_map = wweia_category.set_index("wweia_food_category")["wweia_food_category_description"].to_dict()
        food_lookup = food[["fdc_id", "wweia_category_number"]].copy()
        food_lookup["description"] = food_lookup["wweia_category_number"].map(category_map)
    else:
        food_lookup = food[["fdc_id", "food_code"]].copy()
        food_lookup = food_lookup.rename(columns={"food_code": "description"})

    merged = food_lookup.merge(macro_table, on="fdc_id", how="left")
    merged[["protein_g", "fat_g", "carbs_g"]] = merged[["protein_g", "fat_g", "carbs_g"]].fillna(0)
    merged["total_calories"] = merged["protein_g"] * 4 + merged["carbs_g"] * 4 + merged["fat_g"] * 9

    return merged


def build_daily_nutrition(
    dates: pd.Series,
    food_macros: pd.DataFrame,
    items_per_day: int,
    high_protein_threshold: float,
    random_state: int,
) -> pd.DataFrame:
    rng = random.Random(random_state)
    food_pool = food_macros.sample(min(2000, len(food_macros)), random_state=random_state)

    records = []
    for full_date in pd.to_datetime(dates).dt.date.unique():
        sample = food_pool.sample(items_per_day, random_state=rng.randint(0, 10_000))
        totals = sample[["protein_g", "carbs_g", "fat_g", "total_calories"]].sum()
        description = ", ".join(sample["description"].head(3))
        records.append(
            {
                "full_date": pd.to_datetime(full_date),
                "protein_g": totals["protein_g"],
                "carbs_g": totals["carbs_g"],
                "fat_g": totals["fat_g"],
                "nutrition_calories": totals["total_calories"],
                "sample_foods": description,
            }
        )

    nutrition = pd.DataFrame(records)
    nutrition["is_high_protein"] = nutrition["protein_g"] >= high_protein_threshold
    nutrition["is_poultry"] = nutrition["sample_foods"].str.contains("chicken|turkey", case=False, na=False)
    nutrition["is_vegetarian"] = ~nutrition["sample_foods"].str.contains(
        "beef|pork|chicken|turkey|fish", case=False, na=False
    )
    nutrition = nutrition.reset_index(drop=True)
    nutrition.insert(0, "nutrition_key", np.arange(1, len(nutrition) + 1))
    return nutrition


def build_fact_table(
    activity: pd.DataFrame,
    sleep: pd.DataFrame,
    nutrition: pd.DataFrame,
    workouts: pd.DataFrame,
    time_dim: pd.DataFrame,
) -> pd.DataFrame:
    merged = activity.merge(sleep, on="full_date", how="left")
    merged = merged.merge(nutrition, on="full_date", how="left")

    workout_daily = workouts.sample(len(merged), replace=True, random_state=42)
    workout_daily = workout_daily.reset_index(drop=True)
    merged = pd.concat([merged.reset_index(drop=True), workout_daily[["workout_key", "workout_type"]]], axis=1)

    merged = merged.merge(time_dim[["time_key", "full_date"]], on="full_date", how="left")
    merged = merged.rename(
        columns={
            "totalsteps": "total_steps",
            "calories": "total_calories",
            "veryactiveminutes": "very_active_minutes",
            "restingheart_rate": "resting_heart_rate",
            "sedentaryminutes": "sedentary_minutes",
            "totalminutesasleep": "sleep_duration_min",
        }
    )

    merged = merged[[
        "time_key",
        "workout_key",
        "nutrition_key",
        "user_id",
        "total_steps",
        "total_calories",
        "very_active_minutes",
        "sedentary_minutes",
        "resting_heart_rate",
        "sleep_duration_min",
        "workout_type",
        "protein_g",
        "carbs_g",
        "fat_g",
        "nutrition_calories",
        "is_high_protein",
        "is_poultry",
        "is_vegetarian",
        "full_date",
    ]]

    numeric_cols = merged.select_dtypes(include=["number"]).columns
    merged[numeric_cols] = merged[numeric_cols].fillna(merged[numeric_cols].mean())
    merged.insert(0, "fact_key", np.arange(1, len(merged) + 1))
    return merged


def main() -> None:
    config = load_config()

    output_dir = PROJECT_ROOT / config.paths["output_dir"]
    raw_dir = PROJECT_ROOT / config.paths["raw_dir"]
    output_dir.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(parents=True, exist_ok=True)

    fitbit_zip = config.paths["fitbit_zip"]
    preferred_period = "4.12.16-5.12.16"
    activity_member = find_member(fitbit_zip, "dailyActivity_merged.csv", prefer_substring=preferred_period)
    sleep_member = find_member(fitbit_zip, "sleepDay_merged.csv", prefer_substring=preferred_period)

    activity = read_zip_csv(fitbit_zip, activity_member)
    sleep = read_zip_csv(fitbit_zip, sleep_member)

    activity = normalize_column_names(activity)
    sleep = normalize_column_names(sleep)

    activity["full_date"] = pd.to_datetime(activity["activitydate"])
    sleep["full_date"] = pd.to_datetime(sleep["sleepday"].str.split().str[0])

    activity = activity[[
        "id",
        "full_date",
        "totalsteps",
        "calories",
        "veryactiveminutes",
        "sedentaryminutes",
    ]]

    sleep = sleep[["full_date", "totalminutesasleep", "totaltimeinbed"]]

    # Derive daily resting HR from Fitbit heart-rate seconds data
    hr_member = find_member(fitbit_zip, "heartrate_seconds_merged.csv", prefer_substring=preferred_period)
    hr_data = read_zip_csv(fitbit_zip, hr_member)
    hr_data = normalize_column_names(hr_data)
    hr_data["full_date"] = pd.to_datetime(hr_data["time"]).dt.date
    hr_data["full_date"] = pd.to_datetime(hr_data["full_date"])
    resting_hr = (
        hr_data.groupby(["id", "full_date"], as_index=False)["value"]
        .quantile(0.1)
        .rename(columns={"value": "resting_heart_rate"})
    )

    activity = activity.merge(resting_hr, on=["id", "full_date"], how="left")
    activity = activity.rename(columns={"id": "user_id"})

    # Nutrition from FoodData Central survey data
    food_zip = config.paths["fooddata_zip"]
    food_member = find_member(food_zip, "food.csv")
    nutrient_member = find_member(food_zip, "nutrient.csv")
    food_nutrient_member = find_member(food_zip, "food_nutrient.csv")
    wweia_member = find_member(food_zip, "wweia_food_category.csv")

    food = read_zip_csv(food_zip, food_member)
    nutrient = read_zip_csv(food_zip, nutrient_member)
    food_nutrient = read_zip_csv(food_zip, food_nutrient_member)
    wweia_category = read_zip_csv(food_zip, wweia_member)

    food_macros = build_nutrition_dimension(food, nutrient, food_nutrient, wweia_category)
    nutrition_daily = build_daily_nutrition(
        activity["full_date"],
        food_macros,
        items_per_day=config.settings["nutrition_items_per_day"],
        high_protein_threshold=config.settings["high_protein_threshold_g"],
        random_state=config.settings["random_state"],
    )

    # Workout dimension
    workout_zip = config.paths["exercise_zip"]
    workout_member = find_member(workout_zip, "exercise_dataset.csv")
    workouts = read_zip_csv(workout_zip, workout_member)
    workout_dim = build_workout_dimension(workouts)

    # Time dimension
    time_dim = build_time_dimension(activity["full_date"])

    # Fact table
    fact = build_fact_table(activity, sleep, nutrition_daily, workout_dim, time_dim)

    # Save processed outputs
    activity.to_csv(output_dir / "activity_daily.csv", index=False)
    sleep.to_csv(output_dir / "sleep_daily.csv", index=False)
    nutrition_daily.to_csv(output_dir / "nutrition_daily.csv", index=False)
    workout_dim.to_csv(output_dir / "workout_dim.csv", index=False)
    time_dim.to_csv(output_dir / "time_dim.csv", index=False)
    fact.to_csv(output_dir / "daily_biometrics.csv", index=False)

    # Persist to warehouse
    engine = get_engine()
    with engine.begin() as connection:
        time_dim.to_sql("dim_time", connection, if_exists="replace", index=False)
        workout_dim.to_sql("dim_workout", connection, if_exists="replace", index=False)
        nutrition_daily.to_sql("dim_nutrition", connection, if_exists="replace", index=False)
        fact.to_sql("fact_daily_biometrics", connection, if_exists="replace", index=False)

    # Save a lightweight manifest
    manifest = {
        "rows": {
            "dim_time": len(time_dim),
            "dim_workout": len(workout_dim),
            "dim_nutrition": len(nutrition_daily),
            "fact_daily_biometrics": len(fact),
        }
    }
    (output_dir / "etl_manifest.json").write_text(json.dumps(manifest, indent=2))

    print("ETL complete. Outputs saved to", output_dir)


if __name__ == "__main__":
    main()
