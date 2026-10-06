import pandas as pd
import numpy as np

FILE_PATH = "data/Behavioral-features - per minute.xlsx"

df = pd.read_excel(
    FILE_PATH,
    sheet_name="SWELLdata"
)

# Remove rows without Stress
df = df.dropna(subset=["Stress"])

# --------------------------------------------------
# Define groups
# --------------------------------------------------

questionnaire = [
    "Stress",
    "MentalEffort",
    "MentalDemand",
    "PhysicalDemand",
    "TemporalDemand",
    "Effort",
    "Frustration",
    "NasaTLX",
    "Valence_rc",
    "Arousal_rc",
    "Dominance",
    "Performance_rc"
]

physiological_keywords = [
    "HR",
    "RMSSD",
    "SCL",
    "EDA",
    "ECG",
    "BVP",
    "IBI",
    "TEMP",
    "Temperature"
]

behavioral_keywords = [
    "mouse",
    "Mouse",
    "keyboard",
    "Keyboard",
    "key",
    "Key",
    "click",
    "Click"
]

posture_keywords = [
    "Shoulder",
    "Elbow",
    "Wrist",
    "Spine",
    "Head",
    "Neck",
    "posture",
    "Posture"
]

facial_keywords = [
    "AU",
    "au",
    "Lid",
    "Brow",
    "Lip",
    "Mouth",
    "Cheek",
    "Eye"
]


def contains_keyword(column, keywords):
    return any(
        keyword.lower() in column.lower()
        for keyword in keywords
    )


# --------------------------------------------------
# Categorize features
# --------------------------------------------------

groups = {
    "Questionnaire / Task": [],
    "Physiological": [],
    "Behavioral": [],
    "Posture": [],
    "Facial": [],
    "Other": []
}

excluded = [
    "PP",
    "Blok",
    "Condition",
    "timestamp",
    "Stress"
]

for column in df.columns:

    if column in excluded:
        continue

    if not pd.api.types.is_numeric_dtype(df[column]):
        continue

    if column in questionnaire:
        groups["Questionnaire / Task"].append(column)

    elif contains_keyword(column, physiological_keywords):
        groups["Physiological"].append(column)

    elif contains_keyword(column, behavioral_keywords):
        groups["Behavioral"].append(column)

    elif contains_keyword(column, posture_keywords):
        groups["Posture"].append(column)

    elif contains_keyword(column, facial_keywords):
        groups["Facial"].append(column)

    else:
        groups["Other"].append(column)


# --------------------------------------------------
# Print results
# --------------------------------------------------

print("\n" + "=" * 70)
print("FEATURE GROUP ANALYSIS")
print("=" * 70)

for group, features in groups.items():

    print(f"\n{group}: {len(features)} features")

    for feature in features:
        print("   ", feature)


# --------------------------------------------------
# Save feature groups
# --------------------------------------------------

rows = []

for group, features in groups.items():

    for feature in features:

        rows.append({
            "Feature": feature,
            "Group": group
        })


group_df = pd.DataFrame(rows)

group_df.to_csv(
    "feature_groups.csv",
    index=False
)


print("\nFeature groups saved to:")
print("feature_groups.csv")

print("\nDONE!")