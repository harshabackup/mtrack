"""add proposal interests

Revision ID: d4e5f6a7b8c9
Revises: f1a2b3c4d5e6
Create Date: 2026-09-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd4e5f6a7b8c9'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'proposal_interests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('proposal_1_id', sa.Integer(), sa.ForeignKey('proposals.id', ondelete='CASCADE'), nullable=False),
        sa.Column('proposal_2_id', sa.Integer(), sa.ForeignKey('proposals.id', ondelete='CASCADE'), nullable=False),
        sa.Column('interest_1', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('interest_2', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('note_1', sa.Text(), nullable=True),
        sa.Column('note_2', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('proposal_1_id', 'proposal_2_id', name='uq_proposal_interest_pair'),
    )
    op.create_index('ix_proposal_interests_id', 'proposal_interests', ['id'])
    op.create_index('ix_proposal_interests_proposal_1_id', 'proposal_interests', ['proposal_1_id'])
    op.create_index('ix_proposal_interests_proposal_2_id', 'proposal_interests', ['proposal_2_id'])


def downgrade() -> None:
    op.drop_table('proposal_interests')
