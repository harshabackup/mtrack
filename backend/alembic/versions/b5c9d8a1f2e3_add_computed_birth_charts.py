"""Add ComputedBirthChart

Revision ID: b5c9d8a1f2e3
Revises: e01352f73292
Create Date: 2026-08-20 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b5c9d8a1f2e3'
down_revision: Union[str, None] = 'e01352f73292'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from sqlalchemy.engine.reflection import Inspector
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    if 'computed_birth_charts' not in inspector.get_table_names():
        op.create_table('computed_birth_charts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('proposal_id', sa.Integer(), nullable=False),
        sa.Column('chart_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['proposal_id'], ['proposals.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('proposal_id')
        )
        op.create_index(op.f('ix_computed_birth_charts_id'), 'computed_birth_charts', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_computed_birth_charts_id'), table_name='computed_birth_charts')
    op.drop_table('computed_birth_charts')
