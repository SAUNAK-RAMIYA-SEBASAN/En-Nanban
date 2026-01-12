from enum import Enum
from typing import List

from pydantic import BaseModel, Field, validator


class DifficultyLevel(str, Enum):
    NOT_DIFFICULT = "not_difficult"
    SOMEWHAT_DIFFICULT = "somewhat_difficult"
    VERY_DIFFICULT = "very_difficult"
    EXTREMELY_DIFFICULT = "extremely_difficult"


# Exact GAD-7 Questions
GAD7_QUESTIONS = [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it's hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid as if something awful might happen",
]

GAD7_OPTIONS = [
    "Not at all (0)",
    "Several days (1)",
    "Over half the days (2)",
    "Nearly every day (3)",
]


# Exact PHQ-9 Questions (Teen version)
PHQ9_QUESTIONS = [
    "Feeling down, depressed, irritable, or hopeless?",
    "Little interest or pleasure in doing things?",
    "Trouble falling asleep, staying asleep, or sleeping too much?",
    "Poor appetite, weight loss, or overeating?",
    "Feeling tired, or having little energy?",
    "Feeling bad about yourself – or feeling that you are a failure, or that you have let yourself or your family down?",
    "Trouble concentrating on things like school work, reading, or watching TV?",
    "Moving or speaking so slowly that other people could have noticed? Or the opposite – being so fidgety or restless that you were moving around a lot more than usual?",
    "Thoughts that you would be better off dead, or of hurting yourself in some way?",
]

PHQ9_OPTIONS = [
    "Not at all (0)",
    "Several days (1)",
    "More than half the days (2)",
    "Nearly every day (3)",
]


class AssessmentQuestionsResponse(BaseModel):
    questions: List[str]
    options: List[str]
    instructions: str


class AssessmentRequest(BaseModel):
    responses: List[int]

    @validator("responses")
    def validate_responses(cls, v):
        if len(v) < 7 or len(v) > 9:
            raise ValueError("Responses must contain 7-9 answers (GAD-7: 7, PHQ-9: 9)")
        if not all(isinstance(score, int) and 0 <= score <= 3 for score in v):
            raise ValueError("Each response must be an integer between 0 and 3")
        return v


class DifficultyRequest(BaseModel):
    difficulty: DifficultyLevel


class AssessmentResult(BaseModel):
    total_score: int
    severity: str
    interpretation: str
    recommendations: List[str]
    difficulty_impact: str
    crisis_alert: bool = False
    crisis_message: str | None = None


def get_gad7_questions() -> AssessmentQuestionsResponse:
    """Return GAD-7 questions and options exactly as specified."""
    return AssessmentQuestionsResponse(
        questions=GAD7_QUESTIONS,
        options=GAD7_OPTIONS,
        instructions="Over the last 2 weeks, how often have you been bothered by the following problems?",
    )


def get_phq9_questions() -> AssessmentQuestionsResponse:
    """Return PHQ-9 questions and options exactly as specified."""
    return AssessmentQuestionsResponse(
        questions=PHQ9_QUESTIONS,
        options=PHQ9_OPTIONS,
        instructions="How often have you been bothered by each of the following symptoms during the past two weeks?",
    )


def calculate_gad7_score(
    responses: List[int], difficulty: DifficultyLevel
) -> AssessmentResult:
    """Calculate GAD-7 score with exact severity ranges."""
    total_score = sum(responses)

    # Exact severity ranges
    if total_score <= 4:
        severity = "Minimal Anxiety"
        interpretation = "Minimal anxiety symptoms"
        recommendations = [
            "Continue healthy lifestyle habits",
            "Practice mindfulness",
            "Maintain social connections",
        ]
    elif total_score <= 9:
        severity = "Mild Anxiety"
        interpretation = "Mild anxiety symptoms - monitor and use self-care"
        recommendations = [
            "Daily relaxation techniques",
            "Regular exercise",
            "Consider counseling if persistent",
        ]
    elif total_score <= 14:
        severity = "Moderate Anxiety"
        interpretation = "Moderate anxiety - professional support recommended"
        recommendations = [
            "Schedule counseling appointment",
            "Cognitive Behavioral Therapy (CBT)",
            "Stress management training",
        ]
    else:
        severity = "Severe Anxiety"
        interpretation = "Severe anxiety - immediate professional help needed"
        recommendations = [
            "Contact psychiatrist immediately",
            "Consider medication + therapy",
            "Crisis hotline if overwhelmed",
        ]

    difficulty_impact = {
        DifficultyLevel.NOT_DIFFICULT: "Minimal impact",
        DifficultyLevel.SOMEWHAT_DIFFICULT: "Some impact",
        DifficultyLevel.VERY_DIFFICULT: "Significant impact",
        DifficultyLevel.EXTREMELY_DIFFICULT: "Severe impact",
    }[difficulty]

    crisis_alert = difficulty in [
        DifficultyLevel.VERY_DIFFICULT,
        DifficultyLevel.EXTREMELY_DIFFICULT,
    ]
    crisis_message = (
        "Your anxiety is significantly impacting daily life. National Mental Health Helpline: 1800-599-0019"
        if crisis_alert
        else None
    )

    return AssessmentResult(
        total_score=total_score,
        severity=severity,
        interpretation=interpretation,
        recommendations=recommendations,
        difficulty_impact=difficulty_impact,
        crisis_alert=crisis_alert,
        crisis_message=crisis_message,
    )


def calculate_phq9_score(
    responses: List[int],
    difficulty: DifficultyLevel,
    felt_depressed_past_year: bool = False,
    serious_thoughts_past_month: bool = False,
) -> AssessmentResult:
    """Calculate PHQ-9 score with suicide risk screening."""
    total_score = sum(responses)
    q9_score = responses[8]  # Suicidal ideation question

    # Exact severity ranges
    if total_score <= 4:
        severity = "Minimal Depression"
        interpretation = "Minimal depression symptoms"
        recommendations = [
            "Maintain healthy routines",
            "Stay socially active",
            "Monitor mood changes",
        ]
    elif total_score <= 9:
        severity = "Mild Depression"
        interpretation = "Mild depression - self-care strategies"
        recommendations = [
            "Increase exercise",
            "Practice mindfulness",
            "Talk to trusted friend",
            "Monitor symptoms",
        ]
    elif total_score <= 14:
        severity = "Moderate Depression"
        interpretation = "Moderate depression - seek professional help"
        recommendations = [
            "Schedule therapy appointment",
            "Consider CBT",
            "Maintain daily routine",
        ]
    elif total_score <= 19:
        severity = "Moderately Severe Depression"
        interpretation = "Moderately severe - urgent professional treatment"
        recommendations = [
            "See psychiatrist immediately",
            "Therapy + medication likely needed",
        ]
    else:
        severity = "Severe Depression"
        interpretation = "Severe depression - emergency treatment required"
        recommendations = [
            "Immediate psychiatric care",
            "Hospitalization may be needed",
            "Emergency services if suicidal",
        ]

    difficulty_impact = {
        DifficultyLevel.NOT_DIFFICULT: "Minimal impact",
        DifficultyLevel.SOMEWHAT_DIFFICULT: "Some impact",
        DifficultyLevel.VERY_DIFFICULT: "Significant impact",
        DifficultyLevel.EXTREMELY_DIFFICULT: "Severe impact",
    }[difficulty]

    # Crisis checks
    crisis_alert = False
    crisis_message = None

    if q9_score > 0 or serious_thoughts_past_month:
        crisis_alert = True
        crisis_message = (
            "🚨 EMERGENCY: Suicidal thoughts detected. Call NOW:\n"
            "• National Mental Health Helpline: 1800-599-0019\n"
            "• iCall: 9152987821\n"
            "• Emergency: 108\n"
            "TELL SOMEONE IMMEDIATELY."
        )
    elif difficulty == DifficultyLevel.EXTREMELY_DIFFICULT and total_score >= 15:
        crisis_alert = True
        crisis_message = "Severe impact on daily life. Contact mental health professional immediately."

    return AssessmentResult(
        total_score=total_score,
        severity=severity,
        interpretation=interpretation,
        recommendations=recommendations,
        difficulty_impact=difficulty_impact,
        crisis_alert=crisis_alert,
        crisis_message=crisis_message,
    )
