import React from 'react';

export default function DashboardHeader({ user, onLogout }) {
  const userInitial = user.name[0];
  const userType = user.role === 'admin' ? 'Administrator' : 'Personal vault';

  return (
    <header className="topbar">
      <div className="brand-mark dark">keep<span>.</span></div>

      <div className="profile">
        <div className="avatar">{userInitial}</div>
        <div>
          <strong>{user.name}</strong>
          <small>{userType}</small>
        </div>
        <button className="logout" onClick={onLogout}>Log out</button>
      </div>
    </header>
  );
}
