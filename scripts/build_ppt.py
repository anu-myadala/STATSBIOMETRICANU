from __future__ import annotations

from pathlib import Path
import json

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
import joblib
from pptx import Presentation
from pptx.util import Inches

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def add_title_slide(prs: Presentation, title: str, subtitle: str, notes: str) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[0])
    slide.shapes.title.text = title
    slide.placeholders[1].text = subtitle
    slide.notes_slide.notes_text_frame.text = notes


def add_bullets(prs: Presentation, title: str, bullets: list[str], notes: str) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    slide.shapes.title.text = title
    body = slide.shapes.placeholders[1].text_frame
    body.clear()
    for idx, bullet in enumerate(bullets):
        if idx == 0:
            body.text = bullet
        else:
            body.add_paragraph().text = bullet
    slide.notes_slide.notes_text_frame.text = notes


def add_image_slide(prs: Presentation, title: str, image_path: Path, notes: str) -> None:
    layout = prs.slide_layouts[5]
    slide = prs.slides.add_slide(layout)
    slide.shapes.title.text = title
    left = Inches(0.7)
    top = Inches(1.4)
    width = Inches(8.8)
    slide.shapes.add_picture(str(image_path), left, top, width=width)
    slide.notes_slide.notes_text_frame.text = notes


def build_charts(reports_dir: Path, processed_dir: Path, models_dir: Path) -> dict[str, Path]:
    reports_dir.mkdir(parents=True, exist_ok=True)
    charts_dir = reports_dir / "figures"
    charts_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(processed_dir / "daily_with_clusters.csv")
    df["full_date"] = pd.to_datetime(df["full_date"])

    sns.set_theme(style="whitegrid")

    scatter_path = charts_dir / "protein_vs_hr.png"
    plt.figure(figsize=(8, 4.5))
    sns.scatterplot(data=df, x="protein_g", y="resting_heart_rate", hue="workout_type", alpha=0.7)
    plt.title("Protein vs Resting Heart Rate")
    plt.tight_layout()
    plt.savefig(scatter_path, dpi=200)
    plt.close()

    heat_path = charts_dir / "correlation_heatmap.png"
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
    plt.figure(figsize=(8, 4.5))
    sns.heatmap(df[heat_cols].corr(), annot=True, fmt=".2f", cmap="RdBu_r")
    plt.title("Correlation Heatmap")
    plt.tight_layout()
    plt.savefig(heat_path, dpi=200)
    plt.close()

    cluster_path = charts_dir / "cluster_counts.png"
    plt.figure(figsize=(8, 4.5))
    cluster_counts = df["cluster"].value_counts().sort_index()
    sns.barplot(x=cluster_counts.index, y=cluster_counts.values, hue=cluster_counts.index, palette="viridis", legend=False)
    plt.title("Cluster Counts")
    plt.xlabel("Cluster")
    plt.ylabel("Days")
    plt.tight_layout()
    plt.savefig(cluster_path, dpi=200)
    plt.close()

    pca_path = charts_dir / "pca_variance.png"
    pipeline_path = models_dir / "pca_pipeline.pkl"
    if pipeline_path.exists():
        pipeline = joblib.load(pipeline_path)
        pca = pipeline.named_steps["pca"]
        plt.figure(figsize=(8, 4.5))
        sns.barplot(x=list(range(1, len(pca.explained_variance_ratio_) + 1)),
                    y=pca.explained_variance_ratio_)
        plt.title("PCA Explained Variance")
        plt.xlabel("Component")
        plt.ylabel("Explained Variance Ratio")
        plt.tight_layout()
        plt.savefig(pca_path, dpi=200)
        plt.close()
    else:
        pca_path = None

    return {
        "scatter": scatter_path,
        "heatmap": heat_path,
        "clusters": cluster_path,
        "pca": pca_path,
    }


def main() -> None:
    prs = Presentation()
    reports_dir = PROJECT_ROOT / "reports"
    processed_dir = PROJECT_ROOT / "data" / "processed"
    models_dir = PROJECT_ROOT / "models"
    charts = build_charts(reports_dir, processed_dir, models_dir)

    add_title_slide(
        prs,
        title="The Bimodal Biometric Warehouse",
        subtitle="Mining wearable + nutrition data for metabolic optimization",
        notes="Introduce the bimodal activity hypothesis and the data mining focus.",
    )

    add_bullets(
        prs,
        "Problem & Objectives",
        [
            "Model recovery and calorie burn for bimodal activity days",
            "Integrate wearable + nutrition data into a star schema",
            "Apply PCA + clustering + association rules + predictive modeling",
        ],
        "Explain the project goal and why bimodal activity needs special modeling.",
    )

    add_bullets(
        prs,
        "Data Sources",
        [
            "Fitbit daily activity + minute heart rate (Kaggle Fitabase)",
            "USDA FoodData Central survey foods",
            "Exercise & fitness metrics dataset",
            "Sleep health & lifestyle dataset",
        ],
        "Mention each source and the role it plays in the warehouse.",
    )

    add_bullets(
        prs,
        "Star Schema Warehouse",
        [
            "Fact_Daily_Biometrics (steps, HR, sleep, activity minutes)",
            "Dim_Workout (strength/cardio sessions + intensity)",
            "Dim_Nutrition (macro totals + meal flags)",
            "Dim_Time (day/season/weekend)",
        ],
        "Highlight surrogate keys and support for multiple sessions per day.",
    )

    add_bullets(
        prs,
        "Preprocessing & PCA",
        [
            "Mean imputation for missing sensor metrics",
            "PCA on 1,440-minute heart-rate vectors",
            "Top components capture bimodal exertion signature",
        ],
        "Explain how PCA compresses minute-level HR into usable features.",
    )

    if charts.get("pca"):
        add_image_slide(
            prs,
            "PCA Explained Variance",
            charts["pca"],
            "Show how the first components capture most variance.",
        )

    add_bullets(
        prs,
        "EDA & Visualization",
        [
            "Histograms for protein intake vs resting HR",
            "Heatmap for correlation among biometrics and macros",
            "Interactive Streamlit dashboard",
        ],
        "Point to the dashboard as the main interactive storytelling layer.",
    )

    add_image_slide(
        prs,
        "Protein vs Resting Heart Rate",
        charts["scatter"],
        "Higher protein intake clusters with lower resting HR for some workout types.",
    )

    add_image_slide(
        prs,
        "Correlation Heatmap",
        charts["heatmap"],
        "Discuss relationships between activity, sleep, and nutrition signals.",
    )

    add_bullets(
        prs,
        "Data Mining Techniques",
        [
            "K-Means clustering for daily recovery archetypes",
            "Apriori rules for nutrition-workout-sleep patterns",
            "Linear regression for calorie burn prediction",
            "Random Forest classification for recovery readiness",
        ],
        "Summarize the four algorithm categories required by the rubric.",
    )

    add_image_slide(
        prs,
        "Cluster Distribution",
        charts["clusters"],
        "Interpret clusters as recovery archetypes.",
    )

    metrics_path = reports_dir / "metrics.json"
    if metrics_path.exists():
        metrics = json.loads(metrics_path.read_text())
        add_bullets(
            prs,
            "Model Results",
            [
                f"Regression RMSE: {metrics['regression']['rmse']:.2f}",
                f"Regression R²: {metrics['regression']['r2']:.3f}",
                f"Classification F1: {metrics['classification']['f1']:.3f}",
                f"Classification ROC-AUC: {metrics['classification']['roc_auc']:.3f}",
            ],
            "Share the quantitative model performance metrics.",
        )

    rules_path = processed_dir / "apriori_rules.csv"
    if rules_path.exists():
        rules = pd.read_csv(rules_path)
        top_rules = rules.head(5)
        rule_bullets = [
            f"{row['antecedents']} → {row['consequents']} (lift {row['lift']:.2f})"
            for _, row in top_rules.iterrows()
        ]
        add_bullets(
            prs,
            "Top Association Rules",
            rule_bullets,
            "Highlight the strongest nutrition-workout-sleep relationships.",
        )

    add_bullets(
        prs,
        "Evaluation & Deployment",
        [
            "F1 + ROC-AUC for recovery classification",
            "RMSE + R² for calorie regression",
            "Flask API skeleton with saved preprocessing pipeline",
        ],
        "Emphasize that preprocessing + model are packaged together for API use.",
    )

    add_bullets(
        prs,
        "Conclusions & Next Steps",
        [
            "Bimodal signatures align with distinct recovery clusters",
            "High-protein + strength sessions trend toward better sleep",
            "Future work: add personalization + longitudinal forecasting",
        ],
        "Close with insights and future enhancements.",
    )

    reports_dir.mkdir(parents=True, exist_ok=True)
    output_path = reports_dir / "bimodal_biometric_presentation.pptx"
    prs.save(output_path)
    print("Presentation saved to", output_path)


if __name__ == "__main__":
    main()
