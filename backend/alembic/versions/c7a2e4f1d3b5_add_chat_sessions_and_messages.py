"""add chat sessions and messages

Revision ID: c7a2e4f1d3b5
Revises: b5c9d8a1f2e3
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c7a2e4f1d3b5'
down_revision = 'b5c9d8a1f2e3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'chat_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vendor_id', sa.String(), nullable=False, index=True),
        sa.Column('proposal_id', sa.Integer(), sa.ForeignKey('proposals.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_active', sa.Integer(), default=1),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_chat_sessions_id', 'chat_sessions', ['id'])
    op.create_index('ix_chat_sessions_vendor_id', 'chat_sessions', ['vendor_id'])

    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), sa.ForeignKey('chat_sessions.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_chat_messages_id', 'chat_messages', ['id'])
    op.create_index('ix_chat_messages_session_id', 'chat_messages', ['session_id'])


def downgrade() -> None:
    op.drop_table('chat_messages')
    op.drop_table('chat_sessions')
