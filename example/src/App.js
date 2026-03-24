"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const useUsers_1 = require("./api/adapters/react/useUsers");
function App() {
    const { data: users, error, isLoading, execute } = (0, useUsers_1.useGetUsers)();
    (0, react_1.useEffect)(() => {
        execute();
    }, [execute]);
    if (isLoading)
        return <div>Loading...</div>;
    if (error)
        return <div>Error: {error.message}</div>;
    return (<div>
      <h1>Generated Architecture SDK - React Hooks Demo</h1>
      <ul>
        {users?.map(user => (<li key={user.id}>
            <strong>{user.profile?.fullName || "No Name"}</strong> 
            <br />
            Joined: {user.createdAt?.toLocaleDateString() || "Unknown"}
          </li>))}
      </ul>
    </div>);
}
exports.default = App;
//# sourceMappingURL=App.js.map