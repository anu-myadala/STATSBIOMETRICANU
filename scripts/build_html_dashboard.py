from __future__ import annotations

from pathlib import Path

import pandas as pd
import plotly.express as px

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_data() -> pd.DataFrame:
    processed_dir = PROJECT_ROOT / "data" / "processed"
    clustered_path = processed_dir / "daily_with_clusters.csv"
    if clustered_path.exists():
        return pd.read_csv(clustered_path)
    return pd.read_csv(processed_dir / "daily_biometrics.csv")


def main() -> None:
    df = load_data()

    scatter_fig = px.scatter(
        df,
        x="protein_g",
        y="resting_heart_rate",
        color="workout_type",
        hover_data=["full_date"],
        title="Protein vs Resting Heart Rate",
    )

    sleep_fig = px.histogram(
        df,
        x="sleep_duration_min",
        color="is_high_protein",
        title="Sleep Duration Distribution",
    )

    heat_cols = [
        "total_steps",
        "very_active_minutes",
        "sedentary_minutes",
        "resting_heart_rate",
        "sleep_duration_min",
        "protein_g",
        "carbs_g",
        "fat_g",
    ]
    heat_fig = px.imshow(
        df[heat_cols].corr(),
        text_auto=True,
        aspect="auto",
        color_continuous_scale="RdBu_r",
        title="Correlation Heatmap",
    )

    cluster_html = ""
    if "cluster" in df.columns:
        cluster_counts = df["cluster"].value_counts().reset_index()
        cluster_counts.columns = ["cluster", "count"]
        cluster_fig = px.bar(
            cluster_counts,
            x="cluster",
            y="count",
            text="count",
            title="Cluster Composition",
        )
        cluster_html = cluster_fig.to_html(full_html=False, include_plotlyjs="cdn")

    html_parts = [
        scatter_fig.to_html(full_html=False, include_plotlyjs="cdn"),
        sleep_fig.to_html(full_html=False, include_plotlyjs=False),
        heat_fig.to_html(full_html=False, include_plotlyjs=False),
        cluster_html,
    ]

    html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bimodal Biometric Warehouse Dashboard</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 24px; background: #f9fafb; color: #111827; }}
    h1 {{ margin-bottom: 12px; }}
    .card {{ background: white; padding: 16px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 10px rgba(0,0,0,0.06); }}
  </style>
</head>
<body>
  <h1>Bimodal Biometric Warehouse Dashboard</h1>
  <p>Static HTML dashboard generated from the processed datasets. Share this file via GitHub Pages, Netlify, or any static host.</p>
  {cards}
</body>
</html>
"""

    cards = "\n".join(f"<div class='card'>{part}</div>" for part in html_parts if part)
    output_html = html_content.format(cards=cards)

    reports_dir = PROJECT_ROOT / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    output_path = reports_dir / "dashboard.html"
    output_path.write_text(output_html, encoding="utf-8")

    print("HTML dashboard saved to", output_path)


if __name__ == "__main__":
    main()
