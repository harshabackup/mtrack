import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  paid_by: string;
  date: string;
  created_at: string;
}

interface Proposal {
  id: number;
  name: string;
  status: string;
  expenses: Expense[];
}

const CATEGORIES = [
  'Engagement',
  'Marriage',
  'Food & Catering',
  'Katnam / Dowry',
  'Miscellaneous',
  'Honeymoon',
  'Shopping',
  'Venue',
  'Decorations',
  'Photography'
];

const PAID_BY_OPTIONS = [
  "Bride's Side",
  "Groom's Side",
  "Shared"
];

const WeddingPlanner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  // New Expense Form State
  const [date, setDate] = useState<Date | null>(new Date());
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paidBy, setPaidBy] = useState(PAID_BY_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Expense State
  const [editExpenseId, setEditExpenseId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState<Date | null>(new Date());
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState<number | ''>('');
  const [editPaidBy, setEditPaidBy] = useState('');

  const fetchProposal = async () => {
    try {
      const response = await api.get(`/api/v1/proposals/${id}`);
      setProposal(response.data);
    } catch (error) {
      console.error("Error fetching proposal", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposal();
  }, [id]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return alert("Please enter a valid amount");
    if (!date) return alert("Please select a date");

    setIsSubmitting(true);
    try {
      await api.post(`/api/v1/proposals/${id}/expenses`, {
        category,
        description,
        amount: Number(amount),
        paid_by: paidBy,
        date: date.toISOString()
      });
      fetchProposal();
      setDescription('');
      setAmount('');
    } catch (error) {
      console.error("Error adding expense", error);
      alert("Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpenseSubmit = async () => {
    if (!editExpenseId || !editAmount || isNaN(Number(editAmount)) || !editDate) return;
    try {
      await api.put(`/api/v1/proposals/${id}/expenses/${editExpenseId}`, {
        category: editCategory,
        description: editDescription,
        amount: Number(editAmount),
        paid_by: editPaidBy,
        date: editDate.toISOString()
      });
      fetchProposal();
      setEditExpenseId(null);
    } catch (error) {
      console.error("Error updating expense", error);
      alert("Failed to update expense");
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.delete(`/api/v1/proposals/${id}/expenses/${expenseId}`);
      fetchProposal();
    } catch (error) {
      console.error("Error deleting expense", error);
      alert("Failed to delete expense");
    }
  };

  const openEditModal = (expense: Expense) => {
    setEditExpenseId(expense.id);
    setEditDate(new Date(expense.date));
    setEditCategory(expense.category);
    setEditDescription(expense.description);
    setEditAmount(expense.amount);
    setEditPaidBy(expense.paid_by);
  };

  if (loading) return <div className="animate-in" style={{ padding: '40px', textAlign: 'center' }}>Loading Wedding Planner...</div>;
  if (!proposal) return <div className="animate-in" style={{ padding: '40px', textAlign: 'center' }}>Proposal not found.</div>;

  const totalExpenses = proposal.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  // Group by category for a simple breakdown
  const categoryTotals = proposal.expenses?.reduce((acc: Record<string, number>, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {}) || {};

  return (
    <div className="animate-in" style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '16px' }}>
        <button 
          onClick={() => navigate(`/vendor/proposals/${id}`)}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '8px 12px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Proposal
        </button>
      </div>

      <div style={{ marginBottom: '32px', background: 'var(--bg-body)', padding: '32px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '8px' }}>
            Wedding Planner
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Tracking expenses for <strong style={{ color: 'var(--accent-primary)' }}>{proposal.name}</strong></p>
        </div>
        <div style={{ textAlign: 'right', background: 'rgba(16, 185, 129, 0.1)', padding: '16px 24px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Total Spent</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', lineHeight: 1 }}>
            ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        {/* Left Side: Form and Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Add Expense Form */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Log New Expense
            </h3>
            
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Date</label>
                <CustomDateTimePicker value={date} onChange={setDate} />
              </div>
              
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Category</label>
                <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Description</label>
                <input type="text" className="input-field" placeholder="e.g. Venue Booking Advance" value={description} onChange={e => setDescription(e.target.value)} required />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Amount ($)</label>
                <input type="number" step="0.01" className="input-field" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} required />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Paid By</label>
                <select className="input-field" value={paidBy} onChange={e => setPaidBy(e.target.value)}>
                  {PAID_BY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
                {isSubmitting ? 'Adding...' : 'Add Expense'}
              </button>
            </form>
          </div>

          {/* Breakdown Summary */}
          {Object.keys(categoryTotals).length > 0 && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Breakdown by Category</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(categoryTotals).sort((a,b) => b[1] - a[1]).map(([cat, total]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{cat}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Expense List */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            Expense Log
          </h3>
          
          {proposal.expenses && proposal.expenses.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                    <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</th>
                    <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</th>
                    <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Paid By</th>
                    <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal.expenses.map(exp => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 12px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{exp.category}</span>
                      </td>
                      <td style={{ padding: '16px 12px', color: 'var(--text-primary)' }}>{exp.description}</td>
                      <td style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>{exp.paid_by}</td>
                      <td style={{ padding: '16px 12px', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>
                        ${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <button onClick={() => openEditModal(exp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginRight: '8px' }} title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                        <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '60px 32px', textAlign: 'center', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>No expenses logged yet.</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Use the form on the left to start tracking wedding expenses.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Expense Modal */}
      {editExpenseId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-in" style={{ width: '90%', maxWidth: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Edit Expense</h3>
              <button onClick={() => setEditExpenseId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Date</label>
                <CustomDateTimePicker value={editDate} onChange={setEditDate} />
              </div>
              
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Category</label>
                <select className="input-field" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Description</label>
                <input type="text" className="input-field" value={editDescription} onChange={e => setEditDescription(e.target.value)} required />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Amount ($)</label>
                <input type="number" step="0.01" className="input-field" value={editAmount} onChange={e => setEditAmount(e.target.value === '' ? '' : Number(e.target.value))} required />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Paid By</label>
                <select className="input-field" value={editPaidBy} onChange={e => setEditPaidBy(e.target.value)}>
                  {PAID_BY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button className="btn btn-outline" onClick={() => setEditExpenseId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEditExpenseSubmit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeddingPlanner;
