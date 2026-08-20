import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VendorRoute, AdminRoute } from './routes/ProtectedRoute';
import { Layout } from './components/Layout/Layout';

// Auth Pages
import Login from './pages/Login/Login';
import Register from './pages/Login/Register';
import VerifyOTP from './pages/Login/VerifyOTP';

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

// Admin Pages (Assuming similar placeholders for now)
const AdminDashboard = () => <div style={{padding: '24px'}}><h2>Admin Dashboard</h2><p>Platform wide statistics will go here.</p></div>;
const AdminUsers = () => <div style={{padding: '24px'}}><h2>Users Management</h2><p>Manage users here.</p></div>;
const AdminVendors = () => <div style={{padding: '24px'}}><h2>Vendors Management</h2><p>Manage vendors here.</p></div>;

// Layout Wrappers
const VendorLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

const AdminLayout = () => (
  // In a real app, AdminLayout would have a different sidebar.
  // We reuse Layout for now, but it could conditionally render admin links
  <Layout>
    <Outlet />
  </Layout>
);

const router = createBrowserRouter([
  // Public Routes
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify-otp", element: <VerifyOTP /> },
  
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
          { path: "vendors", element: <AdminVendors /> },
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
