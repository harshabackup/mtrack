"""add matching engine fields and proposal preferences

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('proposals', sa.Column('diet', sa.String(), nullable=True))
    op.add_column('proposals', sa.Column('mother_tongue', sa.String(), nullable=True))
    op.add_column('proposals', sa.Column('family_type', sa.String(), nullable=True))
    op.add_column('proposals', sa.Column('marital_status', sa.String(), nullable=True))
    op.add_column('proposals', sa.Column('physical_status', sa.String(), nullable=True))
    op.add_column('proposals', sa.Column('hobbies', sa.String(), nullable=True))

    op.create_table(
        'proposal_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('proposal_id', sa.Integer(), sa.ForeignKey('proposals.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('min_age', sa.Integer(), nullable=True),
        sa.Column('max_age', sa.Integer(), nullable=True),
        sa.Column('min_height_cm', sa.Integer(), nullable=True),
        sa.Column('max_height_cm', sa.Integer(), nullable=True),
        sa.Column('preferred_cities', sa.String(), nullable=True),
        sa.Column('preferred_religions', sa.String(), nullable=True),
        sa.Column('preferred_castes', sa.String(), nullable=True),
        sa.Column('preferred_diets', sa.String(), nullable=True),
        sa.Column('preferred_education_levels', sa.String(), nullable=True),
        sa.Column('preferred_family_types', sa.String(), nullable=True),
        sa.Column('min_income_lpa', sa.Float(), nullable=True),
        sa.Column('must_be_working', sa.Boolean(), nullable=True),
        sa.Column('manglik_preference', sa.String(), nullable=True),
        sa.Column('deal_breakers', sa.JSON(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_proposal_preferences_id', 'proposal_preferences', ['id'])


def downgrade() -> None:
    op.drop_table('proposal_preferences')
    op.drop_column('proposals', 'hobbies')
    op.drop_column('proposals', 'physical_status')
    op.drop_column('proposals', 'marital_status')
    op.drop_column('proposals', 'family_type')
    op.drop_column('proposals', 'mother_tongue')
    op.drop_column('proposals', 'diet')
