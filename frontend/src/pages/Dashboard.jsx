import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from '../components/DashboardHeader';
import EmptyState from '../components/EmptyState';
import FileRow from '../components/FileRow';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');

  async function loadFiles() {
    const response = await api.get('/files');
    setFiles(response.data.data.files);

    if (user.role === 'admin') {
      const usersResponse = await api.get('/files/users');
      setUsers(usersResponse.data.data.users);
    }
  }

  useEffect(() => {
    loadFiles().catch((error) => {
      setNotice(error.response?.data?.message || 'Could not load files');
    });
  }, [user.role]);

  async function uploadFile(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setIsUploading(true);
    setNotice('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/files/upload', formData);

      await loadFiles();
      setNotice('File uploaded');
    } catch (error) {
      setNotice(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  async function changeVisibility(file) {
    try {
      await api.patch(`/files/${file._id}`, { isPublic: !file.isPublic });
      await loadFiles();
    } catch (error) {
      setNotice(error.response?.data?.message || 'Could not update file');
    }
  }

  async function downloadFile(file) {
    try {
      const response = await api.get(`/files/${file._id}/download`, {
        responseType: 'blob'
      });
      const downloadUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Could not download file');
    }
  }

  async function deleteFile(file) {
    const shouldDelete = window.confirm(`Delete ${file.originalName}?`);

    if (!shouldDelete) {
      return;
    }

    try {
      await api.delete(`/files/${file._id}`);
      setFiles(files.filter((item) => item._id !== file._id));
    } catch (error) {
      setNotice(error.response?.data?.message || 'Could not delete file');
    }
  }

  function getVisibleFiles() {
    if (filter === 'public') {
      return files.filter((file) => file.isPublic);
    }

    if (filter === 'private') {
      return files.filter((file) => !file.isPublic);
    }

    return files;
  }

  const visibleFiles = getVisibleFiles();

  return (
    <main className="dashboard">
      <DashboardHeader user={user} onLogout={logout} />

      <section className="dash-inner">
        <div className="welcome">
          <div>
            <p className="eyebrow">
              {user.role === 'admin' ? 'ADMIN CONSOLE' : 'YOUR PERSONAL VAULT'}
            </p>
            <h1>Good to see you, {user.name.split(' ')[0]}.</h1>
            <p className="lead">Keep the important things close. Share only what you choose.</p>
          </div>

          <label className={`upload-button ${isUploading ? 'disabled' : ''}`}>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
              onChange={uploadFile}
              disabled={isUploading}
            />
            {isUploading ? 'Uploading...' : '+ Add a file'}
          </label>
        </div>

        {notice && <div className="notice">{notice}</div>}

        <div className="toolbar">
          <div className="tabs">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              All files <b>{files.length}</b>
            </button>
            <button className={filter === 'private' ? 'active' : ''} onClick={() => setFilter('private')}>
              Private
            </button>
            <button className={filter === 'public' ? 'active' : ''} onClick={() => setFilter('public')}>
              Shared
            </button>
          </div>
          <span className="storage-note">Encrypted metadata · Local storage</span>
        </div>

        {visibleFiles.length > 0 ? (
          <div className="file-list">
            {visibleFiles.map((file) => (
              <FileRow
                key={file._id}
                file={file}
                isAdmin={user.role === 'admin'}
                onVisibilityChange={changeVisibility}
                onDownload={downloadFile}
                onDelete={deleteFile}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        {user.role === 'admin' && (
          <section className="admin-section">
            <p className="eyebrow">ADMIN VIEW</p>
            <h2>People with access</h2>
            <div className="user-list">
              {users.map((item) => (
                <div key={item._id}>
                  <span className="avatar small">{item.name[0]}</span>
                  <strong>{item.name}</strong>
                  <span>{item.email}</span>
                  <em>{item.role}</em>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
