# Stress Prediction Using Machine Learning

## 📌 Project Overview

This project focuses on predicting human stress levels using machine learning techniques applied to the SWELL-KW (SWELL Knowledge Work) dataset.

The project analyzes behavioral, physiological, facial, posture, and other sensing-related features collected during different working conditions. Multiple machine learning regression models are trained and evaluated to understand how effectively these features can estimate stress levels.

A major focus of the project is to avoid data leakage by using participant-level train-test splitting rather than randomly splitting individual records.

---

## 🎯 Objectives

- Analyze the SWELL-KW dataset.
- Perform data preprocessing and exploratory data analysis.
- Identify features strongly related to stress.
- Categorize features into meaningful groups.
- Build machine learning models for stress prediction.
- Compare different regression algorithms.
- Evaluate sensing-based features separately from questionnaire/task-related features.
- Prevent participant-level data leakage during model evaluation.
- Identify the most useful feature groups for stress prediction.

---

## 📊 Dataset

The project uses the **SWELL-KW (SWELL Knowledge Work) dataset**.

Dataset Source:

DANS Data Stations  
DOI: `10.17026/DANS-X55-69ZP`

Dataset Link:

https://ssh.datastations.nl/dataset.xhtml?persistentId=doi:10.17026/DANS-X55-69ZP

The processed dataset used in this project contains approximately:

- **3139 records**
- **172 variables**
- **25 participants**
- Multiple working conditions
- Minute-level behavioral and physiological measurements

---

## 🧠 Working Conditions

The dataset contains different experimental conditions:

| Condition | Description |
|-----------|-------------|
| R | Relaxation |
| N | Normal Working |
| I | Interruption |
| T | Time Pressure |

The `Stress` value is not available for the relaxation condition, therefore rows with missing stress values are removed before supervised machine learning.

---

## 🎯 Target Variable

The target variable used for prediction is:


Stress

The task is treated as a regression problem, where the machine learning models attempt to predict the stress score.
🔍 Feature Analysis
The dataset contains different categories of features.
Feature Groups
1. Questionnaire / Task Features
These features are related to self-reported or task-related measurements.
Examples:
- Valence
- Arousal
- Dominance
- Mental Effort
- Mental Demand
- Physical Demand
- Temporal Demand
- Effort
- Performance
- Frustration
- NASA-TLX
Total:
11 features

2. Physiological Features
These features represent physiological signals.
Examples:
- HR
- RMSSD
- SCL
- SAu43_EyesClosed
Total:
4 features

3. Behavioral Features
These features describe computer interaction and user behavior.
Examples:
- Mouse activity
- Mouse clicks
- Double clicks
- Mouse distance
- Keystrokes
- Special keys
- Direction keys
- Error keys
- Shortcut keys
- Error key ratio
Total:
11 features

4. Posture Features
These features represent body posture and movement information obtained from different body joints and axes.
Examples include features related to:
- Head
- Shoulder
- Spine
- Elbow
- Wrist
- Hand
- Body orientation
- Joint coordinates
- Joint movement statistics
Total used in sensing experiments:
91 features

5. Facial Features
These features describe facial expressions and facial action units.
Examples:
- Mouth Open
- Left Eye Closed
- Right Eye Closed
- Eyebrow Raised
- Eyebrow Lowered
- Inner Brow Raiser
- Outer Brow Raiser
- Upper Lid Raiser
- Cheek Raiser
- Lid Tightener
- Nose Wrinkler
- Upper Lip Raiser
- Lip Corner Puller
- Chin Raiser
- Lip Stretcher
- Lip Tightener
- Jaw Drop
- Mouth Stretch
Total:
25 features

6. Other Sensing / Derived Features
This group contains additional behavioral, facial, gaze, and derived measurements.
Examples:
- Happy
- Sad
- Angry
- Surprised
- Scared
- Disgusted
- Gaze Direction
- Mouse Wheel
- Dragged
- Characters
- Spaces
- Application Changes
- Tab Focus Changes
- Characters Ratio
- Depth statistics
- Lean angle statistics
Total:
23 features





⚙️ Machine Learning Workflow
The overall workflow followed in this project is:
Dataset
   ↓
Data Loading
   ↓
Data Cleaning
   ↓
Missing Value Analysis
   ↓
Feature Analysis
   ↓
Feature Grouping
   ↓
Participant-Level Train/Test Split
   ↓
Feature Scaling & Imputation
   ↓
Model Training
   ↓
Model Evaluation
   ↓
Feature Group Comparison
   ↓
Future Feature Selection & Optimization


```text

🧹 Data Preprocessing
The following preprocessing steps are performed:
- Load the SWELLdata sheet.
- Inspect dataset shape and columns.
- Check missing values.
- Remove records where Stress is missing.
- Remove non-predictive metadata columns.
- Remove constant and all-missing features.
- Select numerical features.
- Handle missing values using median imputation.
- Apply feature scaling where required.
- Separate input features and target variable.


🔐 Preventing Data Leakage
A random row-level train-test split can cause data leakage because multiple records belong to the same participant.
Instead, the project uses participant-level splitting.
The participant identifier:
PP

is used as the grouping variable.
This ensures that records from the same participant do not appear in both training and testing datasets.
This provides a more realistic evaluation of how well the model can generalize to unseen participants.
🤖 Machine Learning Models
The following regression algorithms were evaluated:
1. Linear Regression
A basic linear model used as a baseline.
2. K-Nearest Neighbors Regression
Predicts stress based on nearby observations in feature space.
3. Random Forest Regression
An ensemble learning method based on multiple decision trees.
4. Gradient Boosting Regression
An ensemble technique that builds models sequentially to reduce prediction errors.
📏 Evaluation Metrics
The models are evaluated using:
Mean Absolute Error (MAE)
Measures the average absolute difference between actual and predicted stress values.
Lower MAE is better.
Root Mean Squared Error (RMSE)
Measures the square root of the average squared prediction error.
Lower RMSE is better.
R² Score
Measures how much variance in the target variable is explained by the model.
Higher R² is better.
📊 Baseline Model Results
The initial baseline experiment produced the following results:
Model	MAE	RMSE	R²
KNN Regression	1.514	1.774	0.110
Gradient Boosting	1.631	1.841	0.042
Random Forest	1.890	2.147	-0.302
Linear Regression	1.927	2.285	-0.476


Best Baseline Model
The best-performing baseline model was:
KNN Regression

with:
MAE  = 1.514
RMSE = 1.774
R²   = 0.110




The results show that the initial model has limited predictive power, indicating that further feature engineering and feature selection are required.
🔎 Feature Correlation Analysis
Correlation analysis was performed to identify features that have a strong relationship with stress.
The strongest correlations observed were:
Feature	Correlation with Stress
Frustration	+0.546
NasaTLX	+0.537
TemporalDemand	+0.494
MentalDemand	+0.461
Valence_rc	-0.414
Arousal_rc	+0.382
MentalEffort	+0.371
Ssurprised	-0.310
SAu05_UpperLidRaiser	-0.281
PhysicalDemand	+0.277


These results show that questionnaire and task-related variables have some of the strongest relationships with the stress target.
🧪 Sensing-Only Experiment
To investigate whether stress can be predicted using automatically measurable features, questionnaire/task features were excluded.
The sensing-only experiment used:
- Physiological features
- Behavioral features
- Posture features
- Facial features
- Other sensing features
The purpose was to determine whether stress prediction can be achieved using measurable sensing and behavioral information rather than relying mainly on self-reported questionnaire variables.
📊 Sensing Feature Group Results
The best results obtained from the sensing-only experiments included:
Feature Group	Model	MAE	RMSE	R²
Behavioral	Linear Regression	1.740	2.092	-0.236
Other	KNN	1.739	2.163	-0.322
Other	Gradient Boosting	1.749	2.145	-0.300
Facial	Linear Regression	1.803	2.153	-0.310
All Sensing Features	KNN	1.773	2.143	-0.298


The best sensing-only result based on RMSE was obtained using:
Behavioral Features + Linear Regression

with:
MAE  = 1.740
RMSE = 2.092
R²   = -0.236

The experiment shows that simply combining all sensing features does not automatically improve prediction performance.
📌 Key Findings
Finding 1 — Questionnaire Features Are Strongly Related to Stress
Features such as:
- Frustration
- NASA-TLX
- Temporal Demand
- Mental Demand
- Mental Effort
show relatively strong correlations with the stress target.
Finding 2 — Sensing-Only Prediction Is More Challenging
When questionnaire/task features are removed, prediction performance decreases.
This indicates that automatically measurable behavioral, physiological, facial, and posture signals alone are not sufficient in the current baseline setup.
Finding 3 — More Features Do Not Always Mean Better Performance
Using all sensing features did not produce better performance than smaller feature groups.
This suggests that irrelevant or noisy features may negatively affect model performance.
Finding 4 — Participant-Level Evaluation Is Important
Because the dataset contains repeated observations from the same participants, random row-level splitting can produce overly optimistic results.
Participant-level splitting provides a more realistic evaluation.
```text
📁 Project Structure
Stress-ML/
│
├── data/
│   └── Behavioral-features - per minute.xlsx
│
├── feature_analysis_results/
│   ├── feature_correlations.csv
│   ├── missing_values.csv
│   └── generated plots
│
├── group_results/
│   └── model comparison results
│
├── stress_ml.py
├── feature_analysis.py
├── feature_groups.py
├── group_models.py
│
├── README.md
└── requirements.txt

🛠️ Technologies Used
- Python
- Pandas
- NumPy
- Scikit-learn
- Matplotlib
- Seaborn
- Jupyter / VS Code
- Git
- GitHub
💻 Installation
Clone the repository:
git clone https://github.com/your-username/Stress-ML.git

Move into the project directory:
cd Stress-ML

Create a virtual environment:
python -m venv .venv

Activate the environment on Windows:
.venv\Scripts\activate

Install dependencies:
pip install -r requirements.txt

▶️ Running the Project
Run the baseline machine learning experiment:
python stress_ml.py

Run feature analysis:
python feature_analysis.py

Run feature grouping:
python feature_groups.py

Run feature-group model comparison:
python group_models.py

📈 Generated Outputs
The project generates analysis results such as:
- Dataset information
- Missing-value statistics
- Feature correlations
- Stress distribution plots
- Correlation heatmaps
- Model performance comparisons
- Feature-group performance comparisons
- CSV result files
- Trained model files
🚀 Future Work
The current results provide a baseline for further improvement.
Future work includes:
- Feature selection
- Selecting top sensing features
- Feature engineering
- Hyperparameter tuning
- Cross-validation using participant groups
- Advanced regression models
- Ensemble models
- Temporal stress forecasting
- Personalized stress prediction
- Handling noisy and incomplete sensor data
- Investigating adaptive sensing
- Improving generalization to unseen participants
🔬 Project Context
This project is part of an academic research project focused on machine-learning-based stress prediction.
The long-term objective is to investigate how behavioral and physiological sensing information can be used to estimate stress reliably while reducing dependence on manually reported information.
The current experiments establish a baseline and identify the limitations of directly using the available sensing features.
📚 Dataset Reference
SWELL-KW Dataset:
SWELL Knowledge Work Dataset
DANS Data Stations
DOI: 10.17026/DANS-X55-69ZP

Dataset:
https://ssh.datastations.nl/dataset.xhtml?persistentId=doi:10.17026/DANS-X55-69ZP
👨‍💻 Author
Nutan Shinde
B.Tech – Electronics & Telecommunication Engineering
Pimpri Chinchwad College of Engineering (PCCOE)
⚠️ Disclaimer
This project is intended for academic and research purposes.
The current results represent baseline experiments on the SWELL-KW dataset. The model performance should not be interpreted as a clinically validated or production-ready stress detection system.
⭐ Project Status
Data Analysis          ✅ Completed
Preprocessing          ✅ Completed
Baseline ML            ✅ Completed
Feature Analysis       ✅ Completed
Feature Grouping       ✅ Completed
Sensing Experiments    ✅ Completed
Feature Selection      🔄 Next
Model Optimization     🔄 Planned
Stress Forecasting     🔄 Planned
Personalization        🔄 Planned
