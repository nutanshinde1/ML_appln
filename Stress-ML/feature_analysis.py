# ============================================================
# SWELL-KW DATASET
# STEP 5 - FEATURE ANALYSIS
# ============================================================

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns


# ============================================================
# 1. CONFIGURATION
# ============================================================

FILE_PATH = "data/Behavioral-features - per minute.xlsx"
SHEET_NAME = "SWELLdata"

OUTPUT_DIR = "feature_analysis_results"

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# 2. LOAD DATA
# ============================================================

print("\n" + "=" * 70)
print("LOADING SWELL DATASET")
print("=" * 70)

df = pd.read_excel(
    FILE_PATH,
    sheet_name=SHEET_NAME
)

print("\nDataset shape:")
print(df.shape)


# ============================================================
# 3. BASIC INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("BASIC INFORMATION")
print("=" * 70)

print("\nNumber of rows:", len(df))
print("Number of columns:", len(df.columns))

print("\nData types:")
print(df.dtypes.value_counts())


# ============================================================
# 4. STRESS ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("STRESS ANALYSIS")
print("=" * 70)

print("\nStress statistics:")

print(df["Stress"].describe())

print("\nMissing Stress values:")

print(df["Stress"].isna().sum())


# ============================================================
# 5. REMOVE ROWS WITH MISSING TARGET
# ============================================================

df_ml = df.dropna(
    subset=["Stress"]
).copy()

print("\nRows available for ML:")
print(len(df_ml))


# ============================================================
# 6. IDENTIFY NUMERICAL FEATURES
# ============================================================

# Columns that should NOT be considered features

excluded_columns = [
    "PP",
    "Blok",
    "Condition",
    "timestamp",
    "Stress"
]


numeric_features = []

for column in df_ml.columns:

    if column in excluded_columns:
        continue

    if pd.api.types.is_numeric_dtype(
        df_ml[column]
    ):
        numeric_features.append(column)


print("\n" + "=" * 70)
print("NUMERICAL FEATURE ANALYSIS")
print("=" * 70)

print("\nNumber of numerical candidate features:")

print(len(numeric_features))


# ============================================================
# 7. MISSING VALUE ANALYSIS
# ============================================================

missing_data = pd.DataFrame({

    "Feature":
        numeric_features,

    "Missing_Count":
        [
            df_ml[col].isna().sum()
            for col in numeric_features
        ],

    "Total":
        len(df_ml)

})


missing_data["Missing_Percentage"] = (
    missing_data["Missing_Count"]
    / missing_data["Total"]
    * 100
)


missing_data = missing_data.sort_values(
    by="Missing_Percentage",
    ascending=False
)


print("\nTop 20 features with missing values:")

print(
    missing_data.head(20).to_string(
        index=False
    )
)


missing_data.to_csv(
    f"{OUTPUT_DIR}/missing_value_analysis.csv",
    index=False
)


# ============================================================
# 8. CONSTANT / LOW-VARIANCE FEATURES
# ============================================================

variance_data = []

for column in numeric_features:

    variance = df_ml[column].var()

    unique_values = df_ml[column].nunique(
        dropna=True
    )

    variance_data.append({

        "Feature": column,

        "Variance": variance,

        "Unique_Values": unique_values

    })


variance_df = pd.DataFrame(
    variance_data
)


low_variance = variance_df[
    variance_df["Unique_Values"] <= 1
]


print("\n" + "=" * 70)
print("CONSTANT FEATURES")
print("=" * 70)

if len(low_variance) > 0:

    print(
        low_variance.to_string(
            index=False
        )
    )

else:

    print("No constant features found.")


variance_df.to_csv(
    f"{OUTPUT_DIR}/variance_analysis.csv",
    index=False
)


# ============================================================
# 9. CORRELATION WITH STRESS
# ============================================================

print("\n" + "=" * 70)
print("CORRELATION WITH STRESS")
print("=" * 70)


correlation_data = []

for column in numeric_features:

    correlation = df_ml[
        [column, "Stress"]
    ].corr(
        numeric_only=True
    ).iloc[0, 1]

    correlation_data.append({

        "Feature": column,

        "Correlation": correlation,

        "Absolute_Correlation":
            abs(correlation)

    })


correlation_df = pd.DataFrame(
    correlation_data
)


correlation_df = correlation_df.sort_values(
    by="Absolute_Correlation",
    ascending=False
)


print("\nTop 30 features correlated with Stress:")

print(
    correlation_df.head(30).to_string(
        index=False
    )
)


correlation_df.to_csv(
    f"{OUTPUT_DIR}/stress_correlations.csv",
    index=False
)


# ============================================================
# 10. TOP POSITIVE CORRELATIONS
# ============================================================

print("\n" + "=" * 70)
print("TOP POSITIVE CORRELATIONS")
print("=" * 70)

positive = correlation_df.sort_values(
    by="Correlation",
    ascending=False
)

print(
    positive.head(15).to_string(
        index=False
    )
)


# ============================================================
# 11. TOP NEGATIVE CORRELATIONS
# ============================================================

print("\n" + "=" * 70)
print("TOP NEGATIVE CORRELATIONS")
print("=" * 70)

negative = correlation_df.sort_values(
    by="Correlation",
    ascending=True
)

print(
    negative.head(15).to_string(
        index=False
    )
)


# ============================================================
# 12. TOP 20 CORRELATION PLOT
# ============================================================

top_20 = correlation_df.head(20).copy()

top_20 = top_20.sort_values(
    by="Correlation"
)


plt.figure(
    figsize=(10, 8)
)

sns.barplot(
    data=top_20,
    x="Correlation",
    y="Feature"
)

plt.title(
    "Top 20 Features Correlated with Stress"
)

plt.xlabel(
    "Correlation with Stress"
)

plt.ylabel(
    "Feature"
)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/top_20_stress_correlations.png",
    dpi=300
)

plt.show()


# ============================================================
# 13. TOP FEATURES HEATMAP
# ============================================================

top_features = (
    correlation_df
    .head(15)["Feature"]
    .tolist()
)


heatmap_columns = (
    top_features + ["Stress"]
)


plt.figure(
    figsize=(12, 9)
)

correlation_matrix = df_ml[
    heatmap_columns
].corr(
    numeric_only=True
)


sns.heatmap(
    correlation_matrix,
    annot=True,
    fmt=".2f",
    cmap="coolwarm",
    center=0
)

plt.title(
    "Correlation Heatmap - Top Stress Related Features"
)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/top_features_heatmap.png",
    dpi=300
)

plt.show()


# ============================================================
# 14. STRESS DISTRIBUTION
# ============================================================

plt.figure(
    figsize=(8, 5)
)

sns.histplot(
    df_ml["Stress"],
    bins=20,
    kde=True
)

plt.title(
    "Stress Distribution"
)

plt.xlabel(
    "Stress"
)

plt.ylabel(
    "Frequency"
)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/stress_distribution.png",
    dpi=300
)

plt.show()


# ============================================================
# 15. STRESS BY CONDITION
# ============================================================

print("\n" + "=" * 70)
print("STRESS BY CONDITION")
print("=" * 70)

condition_stress = (
    df_ml
    .groupby("Condition")["Stress"]
    .agg([
        "count",
        "mean",
        "median",
        "std",
        "min",
        "max"
    ])
)


print(condition_stress)


condition_stress.to_csv(
    f"{OUTPUT_DIR}/stress_by_condition.csv"
)


# ============================================================
# 16. STRESS BY PARTICIPANT
# ============================================================

participant_stress = (
    df_ml
    .groupby("PP")["Stress"]
    .agg([
        "count",
        "mean",
        "std",
        "min",
        "max"
    ])
)


print("\n" + "=" * 70)
print("STRESS BY PARTICIPANT")
print("=" * 70)

print(
    participant_stress
)


participant_stress.to_csv(
    f"{OUTPUT_DIR}/stress_by_participant.csv"
)


# ============================================================
# 17. FEATURE SUMMARY TABLE
# ============================================================

feature_summary = pd.DataFrame({

    "Feature":
        numeric_features,

    "Missing_Percentage":
        [
            df_ml[col].isna().mean() * 100
            for col in numeric_features
        ],

    "Unique_Values":
        [
            df_ml[col].nunique(dropna=True)
            for col in numeric_features
        ],

    "Mean":
        [
            df_ml[col].mean()
            for col in numeric_features
        ],

    "Std":
        [
            df_ml[col].std()
            for col in numeric_features
        ],

    "Correlation_With_Stress":
        [
            df_ml[
                [col, "Stress"]
            ].corr(
                numeric_only=True
            ).iloc[0, 1]
            for col in numeric_features
        ]

})


feature_summary[
    "Absolute_Correlation"
] = feature_summary[
    "Correlation_With_Stress"
].abs()


feature_summary = feature_summary.sort_values(
    by="Absolute_Correlation",
    ascending=False
)


feature_summary.to_csv(
    f"{OUTPUT_DIR}/complete_feature_summary.csv",
    index=False
)


# ============================================================
# 18. FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("FEATURE ANALYSIS COMPLETED")
print("=" * 70)

print("\nCandidate numerical features:")
print(len(numeric_features))

print("\nTop 10 features by absolute correlation:")

print(
    correlation_df.head(10).to_string(
        index=False
    )
)

print("\nResults saved in:")

print(
    OUTPUT_DIR
)

print("\nGenerated files:")

print("""
1. missing_value_analysis.csv
2. variance_analysis.csv
3. stress_correlations.csv
4. stress_by_condition.csv
5. stress_by_participant.csv
6. complete_feature_summary.csv
7. top_20_stress_correlations.png
8. top_features_heatmap.png
9. stress_distribution.png
""")

print("\nFeature analysis completed successfully!")