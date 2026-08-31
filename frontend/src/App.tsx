import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VendorRoute, AdminRoute, InvitedUserRoute } from './routes/ProtectedRoute';
import { Layout } from './components/Layout/Layout';

// Auth Pages
import Login from './pages/Login/Login';
import VerifyOTP from './pages/Login/VerifyOTP';
import AcceptInvite from './pages/Login/AcceptInvite';

// Vendor Pages
import Dashboard from './pages/Dashboard/Dashboard';
import ProposalList from './pages/Proposals/ProposalList';
import AddProposal from './pages/AddProposal/AddProposal';
import ProposalDetails from './pages/Proposals/ProposalDetails';
import EditProposal from './pages/Proposals/EditProposal';
import ProposalCompare from './pages/Proposals/ProposalCompare';
import CompareProposals from './pages/Compare/CompareProposals';
import Pipeline from './pages/Pipeline/Pipeline';
import Settings from './pages/Settings/Settings';
import WeddingPlanner from './pages/WeddingPlanner/WeddingPlanner';
import MyProfile from './pages/Profile/MyProfile';

import AdminUsers from './pages/Admin/Users';
import AdminDashboard from './pages/Admin/AdminDashboard';


// Layout Wrappers
const VendorLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

const AdminLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

// Minimal layout for invited users - only logo + logout, no nav tabs
const InvitedLayout = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
          <img src="/logo.png" alt="MAPP Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          MAPP
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px' }}>
          Logout
        </button>
      </div>
    </header>
    <main style={{ margin: '0 auto', width: '100%', maxWidth: '1440px', padding: '24px' }}>
      <Outlet />
    </main>
  </div>
);

const router = createBrowserRouter([
  // Public Routes
  { path: "/login", element: <Login /> },
  { path: "/verify-otp", element: <VerifyOTP /> },
  { path: "/accept-invite", element: <AcceptInvite /> },
  
  // Invited User Routes — minimal layout, only AddProposal form
  {
    path: "/invited",
    element: <InvitedUserRoute />,
    children: [
      {
        element: <InvitedLayout />,
        children: [
          { path: "proposals/add", element: <AddProposal /> },
          { path: "", element: <Navigate to="/invited/proposals/add" replace /> }
        ]
      }
    ]
  },
  
  // Vendor Routes
  { 
    path: "/vendor", 
    element: <VendorRoute />, 
    children: [
      {
        element: <VendorLayout />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "proposals", element: <ProposalList /> },
          { path: "pipeline", element: <Pipeline /> },
          { path: "proposals/add", element: <AddProposal /> },
          { path: "proposals/compare", element: <ProposalCompare /> },
          { path: "proposals/:id", element: <ProposalDetails /> },
          { path: "proposals/:id/edit", element: <EditProposal /> },
          { path: "proposals/:id/planner", element: <WeddingPlanner /> },
          { path: "compare", element: <CompareProposals /> },
          { path: "settings", element: <Settings /> },
          { path: "profile", element: <MyProfile /> },
          { path: "", element: <Navigate to="/vendor/dashboard" replace /> }
        ]
      }
    ]
  },
  
  // Admin Routes
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "users", element: <AdminUsers /> },
          { path: "", element: <Navigate to="/admin/dashboard" replace /> }
        ]
      }
    ]
  },

  // Fallback
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "*", element: <Navigate to="/login" replace /> }
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
