# ============================================================
# SWELL-KW DATASET - STRESS PREDICTION USING MACHINE LEARNING
# ============================================================
#
# Dataset:
# Behavioral-features - per minute.xlsx
#
# Objective:
# Predict self-reported Stress using behavioral/physiological
# features while avoiding participant-level data leakage.
#
# ============================================================


# ============================================================
# 1. IMPORT LIBRARIES
# ============================================================

import os
import warnings

import numpy as np
import pandas as pd

import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import GroupShuffleSplit, GroupKFold
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

from sklearn.preprocessing import StandardScaler

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neighbors import KNeighborsRegressor

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

import joblib


warnings.filterwarnings("ignore")


# ============================================================
# 2. CONFIGURATION
# ============================================================

FILE_PATH = "data/Behavioral-features - per minute.xlsx"

SHEET_NAME = "SWELLdata"

MODEL_DIR = "models"

os.makedirs(MODEL_DIR, exist_ok=True)


# ============================================================
# 3. LOAD DATASET
# ============================================================

print("\n" + "=" * 70)
print("LOADING DATASET")
print("=" * 70)

df = pd.read_excel(
    FILE_PATH,
    sheet_name=SHEET_NAME
)

print("\nDataset loaded successfully!")

print("Rows    :", df.shape[0])
print("Columns :", df.shape[1])


# ============================================================
# 4. BASIC DATASET INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("DATASET INFORMATION")
print("=" * 70)

print("\nFirst 5 rows:")
print(df.head())

print("\nDataset shape:")
print(df.shape)

print("\nData types:")
print(df.dtypes.value_counts())

print("\nColumn names:")

for i, column in enumerate(df.columns):
    print(f"{i:3d} : {column}")


# ============================================================
# 5. PARTICIPANT INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("PARTICIPANT INFORMATION")
print("=" * 70)

if "PP" in df.columns:

    print("\nNumber of participants:")
    print(df["PP"].nunique())

    print("\nParticipants:")
    print(df["PP"].unique())

else:
    raise ValueError("Column 'PP' was not found.")


# ============================================================
# 6. CONDITION INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("CONDITION INFORMATION")
print("=" * 70)

if "Condition" in df.columns:

    print("\nCondition distribution:")
    print(df["Condition"].value_counts())

else:
    raise ValueError("Column 'Condition' was not found.")


# ============================================================
# 7. TARGET VARIABLE - STRESS
# ============================================================

print("\n" + "=" * 70)
print("STRESS TARGET ANALYSIS")
print("=" * 70)

if "Stress" not in df.columns:
    raise ValueError("Column 'Stress' was not found.")

print("\nStress statistics:")

print(
    df["Stress"].describe()
)

print("\nMissing Stress values:")

print(
    df["Stress"].isna().sum()
)

print("\nAvailable Stress values:")

print(
    df["Stress"].notna().sum()
)


# ============================================================
# 8. STRESS BY CONDITION
# ============================================================

print("\n" + "=" * 70)
print("STRESS BY CONDITION")
print("=" * 70)

stress_by_condition = (
    df.groupby("Condition")["Stress"]
      .agg(
          count="count",
          mean="mean",
          min="min",
          max="max"
      )
)

print(stress_by_condition)


# ============================================================
# 9. MISSING VALUE ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("MISSING VALUE ANALYSIS")
print("=" * 70)

missing = (
    df.isnull()
      .sum()
      .sort_values(ascending=False)
)

print("\nTop 30 columns with missing values:")

print(
    missing.head(30)
)


# ============================================================
# 10. REMOVE ROWS WITHOUT TARGET
# ============================================================
#
# We cannot train a supervised model when Stress is missing.
#
# ============================================================

df_ml = df.dropna(
    subset=["Stress"]
).copy()

print("\n" + "=" * 70)
print("DATA AFTER REMOVING MISSING TARGET")
print("=" * 70)

print("Original rows :", len(df))

print("ML rows       :", len(df_ml))

print("Removed rows  :", len(df) - len(df_ml))


# ============================================================
# 11. IDENTIFY FEATURE TYPES
# ============================================================

print("\n" + "=" * 70)
print("FEATURE TYPES")
print("=" * 70)

numeric_columns = df_ml.select_dtypes(
    include=np.number
).columns.tolist()

categorical_columns = df_ml.select_dtypes(
    exclude=np.number
).columns.tolist()

print("\nNumeric columns:", len(numeric_columns))

print("Categorical columns:", len(categorical_columns))


# ============================================================
# 12. REMOVE NON-FEATURE / LEAKAGE COLUMNS
# ============================================================
#
# PP:
# Participant identifier.
#
# Blok:
# Experimental block identifier.
#
# Condition:
# Experimental condition.
#
# timestamp:
# Time information.
#
# Stress:
# Target variable.
#
# We initially exclude these from the ML features.
#
# ============================================================

columns_to_remove = [
    "PP",
    "Blok",
    "Condition",
    "timestamp",
    "Stress"
]

feature_columns = [
    column
    for column in df_ml.columns
    if column not in columns_to_remove
]


# ============================================================
# 13. KEEP ONLY NUMERIC FEATURES
# ============================================================

feature_columns = [
    column
    for column in feature_columns
    if pd.api.types.is_numeric_dtype(
        df_ml[column]
    )
]

print("\n" + "=" * 70)
print("FEATURE SELECTION")
print("=" * 70)

print("\nNumber of selected features:")

print(
    len(feature_columns)
)

print("\nSelected features:")

for feature in feature_columns:
    print(feature)


# ============================================================
# 14. CREATE X AND y
# ============================================================

X = df_ml[
    feature_columns
].copy()

y = df_ml[
    "Stress"
].copy()

groups = df_ml[
    "PP"
].copy()


print("\nFeature matrix shape:")

print(X.shape)

print("\nTarget shape:")

print(y.shape)


# ============================================================
# 15. REMOVE FEATURES WITH ALL VALUES MISSING
# ============================================================

all_missing_features = [
    column
    for column in X.columns
    if X[column].isna().all()
]

if len(all_missing_features) > 0:

    print("\nRemoving completely empty features:")

    print(all_missing_features)

    X = X.drop(
        columns=all_missing_features
    )


# ============================================================
# 16. REMOVE CONSTANT FEATURES
# ============================================================

constant_features = [
    column
    for column in X.columns
    if X[column].nunique(dropna=True) <= 1
]

if len(constant_features) > 0:

    print("\nRemoving constant features:")

    print(constant_features)

    X = X.drop(
        columns=constant_features
    )


# ============================================================
# 17. CORRELATION ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("CORRELATION ANALYSIS")
print("=" * 70)

correlations = (
    df_ml[
        X.columns.tolist() + ["Stress"]
    ]
    .corr(numeric_only=True)["Stress"]
    .drop("Stress")
    .abs()
    .sort_values(ascending=False)
)

print("\nTop 20 features correlated with Stress:")

print(
    correlations.head(20)
)


# ============================================================
# 18. PLOT STRESS DISTRIBUTION
# ============================================================

plt.figure(
    figsize=(8, 5)
)

sns.histplot(
    y,
    bins=20,
    kde=True
)

plt.title(
    "Distribution of Stress"
)

plt.xlabel(
    "Stress"
)

plt.ylabel(
    "Frequency"
)

plt.tight_layout()

plt.savefig(
    "stress_distribution.png",
    dpi=300
)

plt.show()


# ============================================================
# 19. CORRELATION HEATMAP
# ============================================================
#
# Display only top 15 correlated features so that the graph
# remains readable.
#
# ============================================================

top_features = correlations.head(15).index.tolist()

heatmap_columns = top_features + ["Stress"]

plt.figure(
    figsize=(12, 8)
)

sns.heatmap(
    df_ml[heatmap_columns].corr(),
    annot=True,
    fmt=".2f",
    cmap="coolwarm"
)

plt.title(
    "Top Features Correlated with Stress"
)

plt.tight_layout()

plt.savefig(
    "stress_correlation_heatmap.png",
    dpi=300
)

plt.show()


# ============================================================
# 20. PARTICIPANT-LEVEL TRAIN/TEST SPLIT
# ============================================================
#
# IMPORTANT:
#
# We do NOT randomly split individual rows.
#
# Observations from the same participant must not appear in
# both train and test sets.
#
# ============================================================

print("\n" + "=" * 70)
print("PARTICIPANT-LEVEL TRAIN / TEST SPLIT")
print("=" * 70)


gss = GroupShuffleSplit(
    n_splits=1,
    test_size=0.20,
    random_state=42
)


train_indices, test_indices = next(
    gss.split(
        X,
        y,
        groups=groups
    )
)


X_train = X.iloc[
    train_indices
].copy()

X_test = X.iloc[
    test_indices
].copy()

y_train = y.iloc[
    train_indices
].copy()

y_test = y.iloc[
    test_indices
].copy()

groups_train = groups.iloc[
    train_indices
]

groups_test = groups.iloc[
    test_indices
]


print("\nTraining rows:", len(X_train))

print("Testing rows :", len(X_test))

print(
    "\nTraining participants:"
)

print(
    sorted(groups_train.unique())
)

print(
    "\nTesting participants:"
)

print(
    sorted(groups_test.unique())
)


# ============================================================
# 21. CHECK FOR PARTICIPANT LEAKAGE
# ============================================================

overlap = set(
    groups_train.unique()
).intersection(
    set(groups_test.unique())
)

print(
    "\nParticipant overlap:"
)

print(overlap)

if len(overlap) == 0:

    print(
        "GOOD: No participant leakage."
    )

else:

    print(
        "WARNING: Participant leakage detected!"
    )


# ============================================================
# 22. DEFINE ML MODELS
# ============================================================

models = {

    "Linear Regression":
        LinearRegression(),

    "KNN Regression":
        KNeighborsRegressor(
            n_neighbors=5
        ),

    "Random Forest":
        RandomForestRegressor(
            n_estimators=200,
            random_state=42,
            n_jobs=-1
        ),

    "Gradient Boosting":
        GradientBoostingRegressor(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=3,
            random_state=42
        )
}


# ============================================================
# 23. TRAIN AND EVALUATE MODELS
# ============================================================

print("\n" + "=" * 70)
print("MODEL TRAINING")
print("=" * 70)


results = []

trained_models = {}


for model_name, model in models.items():

    print(
        f"\nTraining: {model_name}"
    )

    # Pipeline:
    #
    # 1. Fill missing values
    # 2. Scale features
    # 3. Train model

    pipeline = Pipeline(
        steps=[

            (
                "imputer",
                SimpleImputer(
                    strategy="median"
                )
            ),

            (
                "scaler",
                StandardScaler()
            ),

            (
                "model",
                model
            )
        ]
    )


    # Train
    pipeline.fit(
        X_train,
        y_train
    )


    # Predict
    predictions = pipeline.predict(
        X_test
    )


    # Metrics

    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_test,
            predictions
        )
    )

    r2 = r2_score(
        y_test,
        predictions
    )


    results.append({

        "Model": model_name,

        "MAE": mae,

        "RMSE": rmse,

        "R2": r2

    })


    trained_models[
        model_name
    ] = pipeline


# ============================================================
# 24. MODEL COMPARISON
# ============================================================

results_df = pd.DataFrame(
    results
)

results_df = results_df.sort_values(
    by="RMSE"
)


print("\n" + "=" * 70)
print("MODEL PERFORMANCE")
print("=" * 70)

print(
    results_df.to_string(
        index=False
    )
)


# ============================================================
# 25. SELECT MODEL BASED ON TEST RMSE
# ============================================================

best_model_name = results_df.iloc[
    0
]["Model"]

best_model = trained_models[
    best_model_name
]


print(
    "\nModel with lowest test RMSE:"
)

print(
    best_model_name
)


# ============================================================
# 26. FINAL PREDICTIONS
# ============================================================

best_predictions = best_model.predict(
    X_test
)


prediction_comparison = pd.DataFrame({

    "Actual_Stress":
        y_test.values,

    "Predicted_Stress":
        best_predictions

})


print("\n" + "=" * 70)
print("ACTUAL VS PREDICTED")
print("=" * 70)

print(
    prediction_comparison.head(20)
)


# ============================================================
# 27. PREDICTION PLOT
# ============================================================

plt.figure(
    figsize=(8, 6)
)

plt.scatter(
    y_test,
    best_predictions,
    alpha=0.6
)

# Ideal prediction line

min_value = min(
    y_test.min(),
    best_predictions.min()
)

max_value = max(
    y_test.max(),
    best_predictions.max()
)

plt.plot(
    [min_value, max_value],
    [min_value, max_value],
    linestyle="--"
)

plt.xlabel(
    "Actual Stress"
)

plt.ylabel(
    "Predicted Stress"
)

plt.title(
    f"Actual vs Predicted Stress\n{best_model_name}"
)

plt.tight_layout()

plt.savefig(
    "actual_vs_predicted_stress.png",
    dpi=300
)

plt.show()


# ============================================================
# 28. RANDOM FOREST FEATURE IMPORTANCE
# ============================================================

if "Random Forest" in trained_models:

    rf_pipeline = trained_models[
        "Random Forest"
    ]

    rf_model = rf_pipeline.named_steps[
        "model"
    ]

    importances = rf_model.feature_importances_

    importance_df = pd.DataFrame({

        "Feature":
            X.columns,

        "Importance":
            importances

    })

    importance_df = importance_df.sort_values(
        by="Importance",
        ascending=False
    )


    print("\n" + "=" * 70)
    print("TOP 20 RANDOM FOREST FEATURES")
    print("=" * 70)

    print(
        importance_df.head(20).to_string(
            index=False
        )
    )


    # Plot

    plt.figure(
        figsize=(10, 7)
    )

    top_importance = importance_df.head(
        15
    ).sort_values(
        "Importance"
    )

    plt.barh(
        top_importance["Feature"],
        top_importance["Importance"]
    )

    plt.xlabel(
        "Feature Importance"
    )

    plt.ylabel(
        "Feature"
    )

    plt.title(
        "Top Features for Stress Prediction"
    )

    plt.tight_layout()

    plt.savefig(
        "feature_importance.png",
        dpi=300
    )

    plt.show()


# ============================================================
# 29. SAVE MODEL
# ============================================================

model_path = os.path.join(
    MODEL_DIR,
    "stress_prediction_model.pkl"
)

joblib.dump(
    best_model,
    model_path
)

print(
    "\nBest model saved at:"
)

print(
    model_path
)


# ============================================================
# 30. SAVE RESULTS
# ============================================================

results_df.to_csv(
    "model_results.csv",
    index=False
)

prediction_comparison.to_csv(
    "stress_predictions.csv",
    index=False
)


# ============================================================
# 31. FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("PROJECT SUMMARY")
print("=" * 70)

print(
    f"""
Dataset:
    SWELL-KW Behavioral Features

Original dataset:
    {df.shape[0]} rows
    {df.shape[1]} columns

ML dataset:
    {df_ml.shape[0]} rows

Features used:
    {X.shape[1]}

Target:
    Stress

Task:
    Stress Regression

Train/Test strategy:
    Participant-level split

Best model:
    {best_model_name}

Results:
"""

)

print(
    results_df.to_string(
        index=False
    )
)

print("\nPipeline completed successfully!")

print("=" * 70)