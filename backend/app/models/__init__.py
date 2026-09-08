# Initialization of app models module
from .role import Role
from .vendor import Vendor
from .user import User
from .proposal import Proposal, ProposalPhoto, ProposalMedicalRecord, ProposalDiscussion, ProposalQuestion, ProposalFeedback
from .match import ProposalMatch
from .ai import ChatSession, ChatMessage, ProposalField, FamilyPreference, SemanticEmbedding, ProposalAnalysisRecord, ComputedBirthChart
