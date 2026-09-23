import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router';

const Protected = ({children}) => {
    const {loading, user} = useAuth();


    if(loading) {
        return (<main className="state state-loading" role="status"><span className="spinner" />Restoring your session…</main>);
    }

    if(!user) {
        return <Navigate to={'/login'} replace />
    }
  return children;
}

export default Protected;
