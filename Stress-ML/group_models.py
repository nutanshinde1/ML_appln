# ============================================================
# SWELL-KW - GROUP-WISE STRESS PREDICTION
# ============================================================

import os
import warnings
import numpy as np
import pandas as pd

from sklearn.model_selection import GroupShuffleSplit
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from sklearn.neighbors import KNeighborsRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

warnings.filterwarnings("ignore")


# ============================================================
# 1. LOAD DATA
# ============================================================

FILE_PATH = "data/Behavioral-features - per minute.xlsx"

df = pd.read_excel(
    FILE_PATH,
    sheet_name="SWELLdata"
)

df = df.dropna(
    subset=["Stress"]
).copy()

print("Dataset:", df.shape)


# ============================================================
# 2. FEATURE GROUPS
# ============================================================

questionnaire = [
    "Valence_rc",
    "Arousal_rc",
    "Dominance",
    "MentalEffort",
    "MentalDemand",
    "PhysicalDemand",
    "TemporalDemand",
    "Effort",
    "Performance_rc",
    "Frustration",
    "NasaTLX"
]

physiological = [
    "HR",
    "RMSSD",
    "SCL",
    "SAu43_EyesClosed"
]

behavioral = [
    "SnMouseAct",
    "SnLeftClicked",
    "SnRightClicked",
    "SnDoubleClicked",
    "SnMouseDistance",
    "SnKeyStrokes",
    "SnSpecialKeys",
    "SnDirectionKeys",
    "SnErrorKeys",
    "SnShortcutKeys",
    "ErrorKeyRatio"
]

posture = [
    "SyHeadOrientation",
    "SxHeadOrientation",
    "SzHeadOrientation",
    "leftShoulderAngleavg",
    "rightShoulderAngleavg",
    "HipCenter_SpineSpine_ShoulderCenteravg",
    "Spine_ShoulderCenterShoulderCenter_Headavg",
    "Spine_ShoulderCenterShoulderCenter_ShoulderLeftavg",
    "Spine_ShoulderCenterShoulderCenter_ShoulderRightavg",
    "ShoulderCenter_ShoulderLeftShoulderLeft_ElbowLeftavg",
    "ShoulderLeft_ElbowLeftElbowLeft_WristLeftavg",
    "ElbowLeft_WristLeftWristLeft_HandLeftavg",
    "ShoulderCenter_ShoulderRightShoulderRight_ElbowRightavg",
    "ShoulderRight_ElbowRightElbowRight_WristRightavg",
    "ElbowRight_WristRightWristRight_HandRightavg",
    "HipCenter_SpinePlaneZXAxisXavg",
    "HipCenter_SpinePlaneXYAxisYavg",
    "HipCenter_SpinePlaneYZAxisZavg",
    "Spine_ShoulderCenterPlaneZXAxisXavg",
    "Spine_ShoulderCenterPlaneXYAxisYavg",
    "Spine_ShoulderCenterPlaneYZAxisZavg",
    "ShoulderCenter_HeadPlaneZXAxisXavg",
    "ShoulderCenter_HeadPlaneXYAxisYavg",
    "ShoulderCenter_HeadPlaneYZAxisZavg",
    "ShoulderCenter_ShoulderLeftPlaneZXAxisXavg",
    "ShoulderCenter_ShoulderLeftPlaneXYAxisYavg",
    "ShoulderCenter_ShoulderLeftPlaneYZAxisZavg",
    "ShoulderCenter_ShoulderRightPlaneZXAxisXavg",
    "ShoulderCenter_ShoulderRightPlaneXYAxisYavg",
    "ShoulderCenter_ShoulderRightPlaneYZAxisZavg",
    "ShoulderLeft_ElbowLeftPlaneZXAxisXavg",
    "ShoulderLeft_ElbowLeftPlaneXYAxisYavg",
    "ShoulderLeft_ElbowLeftPlaneYZAxisZavg",
    "ElbowLeft_WristLeftPlaneZXAxisXavg",
    "ElbowLeft_WristLeftPlaneXYAxisYavg",
    "ElbowLeft_WristLeftPlaneYZAxisZavg",
    "WristLeft_HandLeftPlaneZXAxisXavg",
    "WristLeft_HandLeftPlaneXYAxisYavg",
    "WristLeft_HandLeftPlaneYZAxisZavg",
    "ShoulderRight_ElbowRightPlaneZXAxisXavg",
    "ShoulderRight_ElbowRightPlaneXYAxisYavg",
    "ShoulderRight_ElbowRightPlaneYZAxisZavg",
    "ElbowRight_WristRightPlaneZXAxisXavg",
    "ElbowRight_WristRightPlaneXYAxisYavg",
    "ElbowRight_WristRightPlaneYZAxisZavg",
    "WristRight_HandRightPlaneZXAxisXavg",
    "WristRight_HandRightPlaneXYAxisYavg",
    "WristRight_HandRightKinectZAxisavg",
    "leftShoulderAnglestdv",
    "rightShoulderAnglestdv",
    "HipCenter_SpineSpine_ShoulderCenterstdv",
    "Spine_ShoulderCenterShoulderCenter_Headstdv",
    "Spine_ShoulderCenterShoulderCenter_ShoulderLeftstdv",
    "Spine_ShoulderCenterShoulderCenter_ShoulderRightstdv",
    "ShoulderCenter_ShoulderLeftShoulderLeft_ElbowLeftstdv",
    "ShoulderLeft_ElbowLeftElbowLeft_WristLeftstdv",
    "ElbowLeft_WristLeftWristLeft_HandLeftstdv",
    "ShoulderCenter_ShoulderRightShoulderRight_ElbowRightstdv",
    "ShoulderRight_ElbowRightElbowRight_WristRightstdv",
    "ElbowRight_WristRightWristRight_HandRightstdv",
    "HipCenter_SpinePlaneZXAxisXstdv",
    "HipCenter_SpinePlaneXYAxisYstdv",
    "HipCenter_SpinePlaneYZAxisZstdv",
    "Spine_ShoulderCenterPlaneZXAxisXstdv",
    "Spine_ShoulderCenterPlaneXYAxisYstdv",
    "Spine_ShoulderCenterPlaneYZAxisZstdv",
    "ShoulderCenter_HeadPlaneZXAxisXstdv",
    "ShoulderCenter_HeadPlaneXYAxisYstdv",
    "ShoulderCenter_HeadPlaneYZAxisZstdv",
    "ShoulderCenter_ShoulderLeftPlaneZXAxisXstdv",
    "ShoulderCenter_ShoulderLeftPlaneXYAxisYstdv",
    "ShoulderCenter_ShoulderLeftPlaneYZAxisZstdv",
    "ShoulderCenter_ShoulderRightPlaneZXAxisXstdv",
    "ShoulderCenter_ShoulderRightPlaneXYAxisYstdv",
    "ShoulderCenter_ShoulderRightPlaneYZAxisZstdv",
    "ShoulderLeft_ElbowLeftPlaneZXAxisXstdv",
    "ShoulderLeft_ElbowLeftPlaneXYAxisYstdv",
    "ShoulderLeft_ElbowLeftPlaneYZAxisZstdv",
    "ElbowLeft_WristLeftPlaneZXAxisXstdv",
    "ElbowLeft_WristLeftPlaneXYAxisYstdv",
    "ElbowLeft_WristLeftPlaneYZAxisZstdv",
    "WristLeft_HandLeftPlaneZXAxisXstdv",
    "WristLeft_HandLeftPlaneXYAxisYstdv",
    "WristLeft_HandLeftPlaneYZAxisZstdv",
    "ShoulderRight_ElbowRightPlaneZXAxisXstdv",
    "ShoulderRight_ElbowRightPlaneXYAxisYstdv",
    "ShoulderRight_ElbowRightPlaneYZAxisZstdv",
    "ElbowRight_WristRightPlaneZXAxisXstdv",
    "ElbowRight_WristRightPlaneYZAxisZstdv",
    "WristRight_HandRightPlaneZXAxisXstdv",
    "WristRight_HandRightPlaneYZAxisZstdv",
    "WristRight_HandRightKinectZAxisstdv"
]

facial = [
    "SmouthOpen",
    "SleftEyeClosed",
    "SrightEyeClosed",
    "SleftEyebrowLowered",
    "SleftEyebrowRaised",
    "SrightEyebrowLowered",
    "SrightEyebrowRaised",
    "SAu01_InnerBrowRaiser",
    "SAu02_OuterBrowRaiser",
    "SAu04_BrowLowerer",
    "SAu05_UpperLidRaiser",
    "SAu06_CheekRaiser",
    "SAu07_LidTightener",
    "SAu09_NoseWrinkler",
    "SAu10_UpperLipRaiser",
    "SAu12_LipCornerPuller",
    "SAu14_Dimpler",
    "SAu15_LipCornerDepressor",
    "SAu17_ChinRaiser",
    "SAu20_LipStretcher",
    "SAu23_LipTightener",
    "SAu24_LipPressor",
    "SAu25_LipsPart",
    "SAu26_JawDrop",
    "SAu27_MouthStretch"
]

other = [
    "Squality",
    "Sneutral",
    "Shappy",
    "Ssad",
    "Sangry",
    "Ssurprised",
    "Sscared",
    "Sdisgusted",
    "Svalence",
    "SgazeDirectionForward",
    "SgazeDirectionLeft",
    "SgazeDirectionRight",
    "SnWheel",
    "SnDragged",
    "SnChars",
    "SnSpaces",
    "SnAppChange",
    "SnTabfocusChange",
    "CharactersRatio",
    "avgDepthavg",
    "leanAngleavg",
    "avgDepthstdv",
    "leanAnglestdv"
]


# ============================================================
# 3. CREATE GROUP DICTIONARY
# ============================================================

feature_groups = {

    "Physiological": physiological,

    "Behavioral": behavioral,

    "Posture": posture,

    "Facial": facial,

    "Other": other,

    "Physiological + Behavioral":
        physiological + behavioral,

    "All Sensing Features":
        physiological +
        behavioral +
        posture +
        facial +
        other
}


# ============================================================
# 4. REMOVE NON-EXISTING COLUMNS
# ============================================================

for group_name in feature_groups:

    feature_groups[group_name] = [
        col
        for col in feature_groups[group_name]
        if col in df.columns
    ]


# ============================================================
# 5. PARTICIPANT-LEVEL SPLIT
# ============================================================

groups = df["PP"]

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.20,
    random_state=42
)

train_idx, test_idx = next(
    splitter.split(
        df,
        df["Stress"],
        groups=groups
    )
)


# ============================================================
# 6. MODELS
# ============================================================

models = {

    "Linear Regression":
        LinearRegression(),

    "KNN":
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
# 7. TRAIN GROUP-WISE MODELS
# ============================================================

results = []


for group_name, features in feature_groups.items():

    print("\n" + "=" * 70)
    print("FEATURE GROUP:", group_name)
    print("Number of features:", len(features))
    print("=" * 70)

    if len(features) == 0:
        continue

    X = df[features]
    y = df["Stress"]

    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]

    y_train = y.iloc[train_idx]
    y_test = y.iloc[test_idx]


    for model_name, model in models.items():

        pipeline = Pipeline([
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
        ])


        pipeline.fit(
            X_train,
            y_train
        )

        predictions = pipeline.predict(
            X_test
        )


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

            "Feature_Group": group_name,

            "Features": len(features),

            "Model": model_name,

            "MAE": mae,

            "RMSE": rmse,

            "R2": r2

        })


        print(
            f"{model_name:20s} "
            f"MAE={mae:.3f}  "
            f"RMSE={rmse:.3f}  "
            f"R2={r2:.3f}"
        )


# ============================================================
# 8. RESULTS
# ============================================================

results_df = pd.DataFrame(
    results
)

results_df = results_df.sort_values(
    by="RMSE"
)


print("\n" + "=" * 70)
print("FINAL GROUP-WISE RESULTS")
print("=" * 70)

print(
    results_df.to_string(
        index=False
    )
)


# ============================================================
# 9. SAVE RESULTS
# ============================================================

results_df.to_csv(
    "group_model_results.csv",
    index=False
)


print("\nResults saved to:")

print(
    "group_model_results.csv"
)

print("\nDONE!") 