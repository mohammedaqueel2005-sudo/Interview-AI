import {createBrowserRouter} from 'react-router';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import Protected from './features/auth/components/Protected';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import InterviewReport from './pages/InterviewReport';
import History from './pages/History';
import { Navigate } from 'react-router';

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/",
        element: <Protected ><Dashboard/></Protected>
    },
    { path: "/new-interview", element: <Protected><InterviewSetup/></Protected> },
    { path: "/history", element: <Protected><History/></Protected> },
    {
        path: "/interview/:interviewId",
        element: <Protected><InterviewReport/></Protected>
    },
    { path: "*", element: <Navigate to="/" replace /> }
]);
