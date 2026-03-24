import { useEffect } from 'react';
import { useGetUsers } from './api/adapters/react/useUsers';

function App() {
  const { data: users, error, isLoading, execute } = useGetUsers();

  useEffect(() => {
    execute();
  }, [execute]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Generated Architecture SDK - React Hooks Demo</h1>
      <ul>
        {users?.map(user => (
          <li key={user.id}>
            <strong>{user.profile?.fullName || "No Name"}</strong> 
            <br />
            Joined: {user.createdAt?.toLocaleDateString() || "Unknown"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
