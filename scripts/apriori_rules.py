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
    transactions = pd.DataFrame(index=df.index)
    transactions["high_protein"] = df["is_high_protein"].astype(bool)
    transactions["poultry_meal"] = df["is_poultry"].astype(bool)
    transactions["vegetarian"] = df["is_vegetarian"].astype(bool)

    workout_dummies = pd.get_dummies(df["workout_type"], prefix="workout")
    strain_flag = df["very_active_minutes"] >= df["very_active_minutes"].quantile(0.7)
    recovery_flag = df["sleep_duration_min"] >= df["sleep_duration_min"].quantile(0.7)

    transactions["high_strain"] = strain_flag
    transactions["high_recovery_sleep"] = recovery_flag
    transactions = pd.concat([transactions, workout_dummies], axis=1).astype(bool)
    return transactions


def main() -> None:
    config = load_config()
    output_dir = PROJECT_ROOT / config["paths"]["output_dir"]
    df = pd.read_csv(output_dir / "daily_biometrics.csv")

    transactions = build_transactions(df)
    frequent_sets = apriori(transactions, min_support=0.08, use_colnames=True)
    rules = association_rules(frequent_sets, metric="lift", min_threshold=1.1)
    rules = rules.sort_values("lift", ascending=False)

    rules.to_csv(output_dir / "apriori_rules.csv", index=False)
    print("Apriori rules saved to", output_dir / "apriori_rules.csv")


if __name__ == "__main__":
    main()
