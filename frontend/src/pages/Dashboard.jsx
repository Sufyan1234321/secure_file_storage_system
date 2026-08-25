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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');

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

  function chooseUpload(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setPendingUpload({ file, folder: folders.includes('General') ? 'General' : folders[0] || 'General', isNewFolder: false });
    event.target.value = '';
  }

  async function uploadFile(isPublic) {
    const file = pendingUpload?.file;

    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setNotice('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isPublic', String(isPublic));
      formData.append('folder', pendingUpload.folder);
      await api.post('/files/upload', formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        }
      });

      await loadFiles();
      setNotice(isPublic ? 'File uploaded and shared' : 'File uploaded privately');
    } catch (error) {
      setNotice(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setPendingUpload(null);
    }
  }

  function updatePendingFolder(event) {
    setPendingUpload((current) => current && {
      ...current,
      folder: event.target.value === '__new__' ? '' : event.target.value,
      isNewFolder: event.target.value === '__new__'
    });
  }

  async function changeVisibility(file) {
    try {
      await api.patch(`/files/${file._id}`, { isPublic: !file.isPublic });
      await loadFiles();
    } catch (error) {
      setNotice(error.response?.data?.message || 'Could not update file');
    }
  }

  async function shareFile(file) {
    const apiUrl = api.defaults.baseURL.replace(/\/$/, '');
    const shareUrl = `${apiUrl}/share/${file.shareToken}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice('Share link copied');
    } catch {
      setNotice('Could not copy share link');
    }
  }

  async function previewFile(file) {
    const previewable = file.mimeType === 'application/pdf'
      || file.mimeType.startsWith('image/')
      || file.mimeType === 'text/plain'
      || file.mimeType === 'text/csv';

    if (!previewable) {
      setNotice('Preview is not available for this file type. Use Download instead.');
      return;
    }

    try {
      const response = await api.get(`/files/${file._id}/download`, { responseType: 'blob' });
      setPreview({ file, url: URL.createObjectURL(response.data) });
    } catch (error) {
      setNotice(error.response?.data?.message || 'Could not preview file');
    }
  }

  function closePreview() {
    if (preview) {
      URL.revokeObjectURL(preview.url);
    }

    setPreview(null);
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

  function requestDelete(file) {
    setPendingDelete(file);
  }

  async function deleteFile() {
    if (!pendingDelete) {
      return;
    }

    try {
      await api.delete(`/files/${pendingDelete._id}`);
      setFiles(files.filter((item) => item._id !== pendingDelete._id));
      setNotice('File deleted');
      setPendingDelete(null);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Could not delete file');
    }
  }

  function getVisibleFiles() {
    const normalizedSearch = search.trim().toLowerCase();

    return files.filter((file) => {
      const matchesAccess = filter === 'all'
        || (filter === 'public' && file.isPublic)
        || (filter === 'private' && !file.isPublic);
      const matchesFolder = folderFilter === 'all' || (file.folder || 'General') === folderFilter;
      const matchesSearch = !normalizedSearch
        || file.originalName.toLowerCase().includes(normalizedSearch)
        || (file.folder || 'General').toLowerCase().includes(normalizedSearch);

      return matchesAccess && matchesFolder && matchesSearch;
    });
  }

  const folders = [...new Set(['General', ...files.map((file) => file.folder || 'General')])].sort();
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
              onChange={chooseUpload}
              disabled={isUploading}
            />
            {isUploading ? 'Uploading...' : '+ Add a file'}
          </label>
        </div>

        {notice && <div className="notice">{notice}</div>}

        {pendingUpload && (
          <div className="upload-modal-backdrop" role="presentation">
            <section className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-choice-title">
              <p className="eyebrow">UPLOAD SETTINGS</p>
              <h2 id="upload-choice-title">Who should access this file?</h2>
              <p className="upload-modal-file">{pendingUpload.file.name}</p>
              <p className="upload-modal-help">Choose public to create a shareable link. Choose private to keep access limited to you.</p>
              <label className="folder-input">
                Choose a folder
                <select value={pendingUpload.isNewFolder ? '__new__' : pendingUpload.folder} onChange={updatePendingFolder} disabled={isUploading}>
                  {folders.map((folder) => <option key={folder} value={folder}>{folder}</option>)}
                  <option value="__new__">+ Create new folder</option>
                </select>
                {pendingUpload.isNewFolder && (
                  <input value={pendingUpload.folder} onChange={(event) => setPendingUpload((current) => current && { ...current, folder: event.target.value.slice(0, 60) })} maxLength="60" placeholder="Enter a new folder name" disabled={isUploading} autoFocus />
                )}
              </label>
              <div className="upload-modal-actions">
                <button className="modal-private" onClick={() => uploadFile(false)} disabled={isUploading}>
                  Keep private
                </button>
                <button className="modal-public" onClick={() => uploadFile(true)} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Make public'}
                </button>
              </div>
              {isUploading && (
                <div className="upload-progress" aria-live="polite">
                  <div className="upload-progress-label">
                    <span>Uploading file</span>
                    <strong>{uploadProgress}%</strong>
                  </div>
                  <div className="upload-progress-track" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin="0" aria-valuemax="100">
                    <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
              {!isUploading && (
                <button className="modal-cancel" onClick={() => setPendingUpload(null)}>
                  Cancel upload
                </button>
              )}
            </section>
          </div>
        )}

        <div className="toolbar">
          <div className="file-filters">
            <label className="search-box">
              <span>Search files</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or folder" />
            </label>
            <label className="folder-filter">
              <span>Folder</span>
              <select value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)}>
                <option value="all">All folders</option>
                {folders.map((folder) => <option key={folder} value={folder}>{folder}</option>)}
              </select>
            </label>
          </div>
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
          <span className="storage-note">{visibleFiles.length} result{visibleFiles.length === 1 ? '' : 's'}</span>
        </div>

        {visibleFiles.length > 0 ? (
          <div className="file-list">
            {visibleFiles.map((file) => (
              <FileRow
                key={file._id}
                file={file}
                isAdmin={user.role === 'admin'}
                onVisibilityChange={changeVisibility}
                onShare={shareFile}
                onPreview={previewFile}
                onDownload={downloadFile}
                onDelete={requestDelete}
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

        {preview && (
          <div className="preview-modal-backdrop" role="presentation" onClick={closePreview}>
            <section className="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title" onClick={(event) => event.stopPropagation()}>
              <header className="preview-header">
                <div>
                  <p className="eyebrow">FILE PREVIEW</p>
                  <h2 id="preview-title">{preview.file.originalName}</h2>
                </div>
                <button className="preview-close" onClick={closePreview} aria-label="Close preview">×</button>
              </header>
              <div className="preview-content">
                {preview.file.mimeType.startsWith('image/') && (
                  <img src={preview.url} alt={preview.file.originalName} />
                )}
                {preview.file.mimeType === 'application/pdf' && (
                  <iframe src={preview.url} title={preview.file.originalName} />
                )}
                {(preview.file.mimeType === 'text/plain' || preview.file.mimeType === 'text/csv') && (
                  <iframe src={preview.url} title={preview.file.originalName} />
                )}
              </div>
            </section>
          </div>
        )}

        {pendingDelete && (
          <div className="delete-modal-backdrop" role="presentation">
            <section className="delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
              <p className="eyebrow">DELETE FILE</p>
              <h2 id="delete-title">Remove this file?</h2>
              <p className="delete-modal-file">{pendingDelete.originalName}</p>
              <p className="delete-modal-help">This permanently removes the file and its metadata. This action cannot be undone.</p>
              <div className="delete-modal-actions">
                <button className="modal-cancel" onClick={() => setPendingDelete(null)}>
                  Cancel
                </button>
                <button className="modal-delete" onClick={deleteFile}>
                  Delete file
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
