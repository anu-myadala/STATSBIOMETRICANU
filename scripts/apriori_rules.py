from __future__ import annotations

from pathlib import Path

import pandas as pd
import yaml
from mlxtend.frequent_patterns import apriori, association_rules

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_config() -> dict:
    with open(PROJECT_ROOT / "config.yaml", "r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def build_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """Build transaction matrix for association rule mining with enhanced features."""
    transactions = pd.DataFrame(index=df.index)

    # Nutrition flags
    transactions["high_protein_intake"] = df["is_high_protein"].astype(bool)
    transactions["poultry_meal"] = df["is_poultry"].astype(bool)
    transactions["vegetarian"] = df["is_vegetarian"].astype(bool)

    # Activity-based flags derived from percentiles
    steps_70 = df["total_steps"].quantile(0.7)
    calories_70 = df["total_calories"].quantile(0.7)
    hr_30 = df["resting_heart_rate"].quantile(0.3)  # Low HR is good

    transactions["high_steps"] = (df["total_steps"] >= steps_70).astype(bool)
    transactions["high_calories_burned"] = (df["total_calories"] >= calories_70).astype(bool)
    transactions["low_resting_hr"] = (df["resting_heart_rate"] <= hr_30).astype(bool)

    # Workout and strain flags
    strain_flag = df["very_active_minutes"] >= df["very_active_minutes"].quantile(0.7)
    recovery_flag = df["sleep_duration_min"] >= df["sleep_duration_min"].quantile(0.7)

    transactions["high_strain"] = strain_flag.astype(bool)
    transactions["high_recovery_sleep"] = recovery_flag.astype(bool)

    # Workout type dummies
    workout_dummies = pd.get_dummies(df["workout_type"], prefix="workout")
    transactions = pd.concat([transactions, workout_dummies], axis=1).astype(bool)

    return transactions


def main() -> None:
    config = load_config()
    output_dir = PROJECT_ROOT / config["paths"]["output_dir"]
    reports_dir = PROJECT_ROOT / config["paths"]["reports_dir"]

    df = pd.read_csv(output_dir / "daily_biometrics.csv")

    transactions = build_transactions(df)
    frequent_sets = apriori(transactions, min_support=0.08, use_colnames=True)
    rules = association_rules(frequent_sets, metric="lift", min_threshold=1.1)
    rules = rules.sort_values("lift", ascending=False)

    # Save to processed folder for use in modeling
    rules.to_csv(output_dir / "apriori_rules.csv", index=False)

    # Also save a copy to reports folder for presentation
    reports_dir.mkdir(parents=True, exist_ok=True)
    rules.to_csv(reports_dir / "apriori_rules.csv", index=False)

    print(f"Apriori rules saved. Found {len(rules)} rules with top lift: {rules['lift'].max():.2f}")


if __name__ == "__main__":
    main()