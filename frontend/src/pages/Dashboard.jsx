import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from '../components/DashboardHeader';
import EmptyState from '../components/EmptyState';
import FileRow from '../components/FileRow';

const storageLimit = 5 * 1024 * 1024 * 1024;

function formatStorage(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [folderRecords, setFolderRecords] = useState([]);
  const [trashFiles, setTrashFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingPermanentDelete, setPendingPermanentDelete] = useState(null);
  const [pendingEdit, setPendingEdit] = useState(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');

  async function loadFiles() {
    const response = await api.get('/files');
    setFiles(response.data.data.files);
    const foldersResponse = await api.get('/files/folders');
    setFolderRecords(foldersResponse.data.data.folders);

    if (user.role === 'admin') {
      const usersResponse = await api.get('/files/users');
      setUsers(usersResponse.data.data.users);
    }
  }

  async function loadTrash() {
    const response = await api.get('/files/trash');
    setTrashFiles(response.data.data.files);
  }

  useEffect(() => {
    loadFiles().catch((error) => {
      setNotice(error.response?.data?.message || 'Could not load files');
    });
  }, [user.role]);

  useEffect(() => {
    if (filter === 'trash') {
      loadTrash().catch((error) => {
        setNotice(error.response?.data?.message || 'Could not load trash');
      });
    }
  }, [filter]);

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

  async function createFolder() {
    const name = newFolderName.trim();
    if (!name) return;

    try {
      await api.post('/files/folders', { name });
      setNewFolderName('');
      setIsCreatingFolder(false);
      await loadFiles();
      setFolderFilter(name);
      setNotice(`Folder "${name}" created`);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Could not create folder');
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

  async function updateFile(file, updates) {
    try {
      await api.patch(`/files/${file._id}`, updates);
      await loadFiles();
      setNotice('File updated');
    } catch (error) {
      setNotice(error.response?.data?.message || 'Could not update file');
    }
  }

  function renameFile(file) {
    setPendingEdit({ type: 'rename', file, value: file.originalName });
  }

  function moveFile(file) {
    setPendingEdit({ type: 'move', file, value: file.folder || 'General', isNewFolder: false });
  }

  async function saveEdit() {
    if (!pendingEdit || !pendingEdit.value.trim()) {
      return;
    }

    const updates = pendingEdit.type === 'rename'
      ? { originalName: pendingEdit.value.trim() }
      : { folder: pendingEdit.value.trim() };
    const unchanged = pendingEdit.type === 'rename'
      ? updates.originalName === pendingEdit.file.originalName
      : updates.folder === (pendingEdit.file.folder || 'General');

    if (unchanged) {
      setPendingEdit(null);
      return;
    }

    await updateFile(pendingEdit.file, updates);
    setPendingEdit(null);
  }

  function updateMoveFolder(event) {
    setPendingEdit((current) => current && {
      ...current,
      value: event.target.value === '__new__' ? '' : event.target.value,
      isNewFolder: event.target.value === '__new__'
    });
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

  async function restoreFile(file) {
    try {
      await api.patch(`/files/${file._id}/restore`);
      await Promise.all([loadFiles(), loadTrash()]);
      setNotice('File restored');
    } catch (error) {
      setNotice(error.response?.data?.message || 'Could not restore file');
    }
  }

  async function permanentlyDeleteFile(file) {
    setPendingPermanentDelete(file);
  }

  async function confirmPermanentDelete() {
    if (!pendingPermanentDelete) return;

    try {
      await api.delete(`/files/${pendingPermanentDelete._id}/permanent`);
      setTrashFiles((current) => current.filter((item) => item._id !== pendingPermanentDelete._id));
      setNotice('File permanently deleted');
      setPendingPermanentDelete(null);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Could not permanently delete file');
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

  const folders = [...new Set(['General', ...folderRecords.map((folder) => folder.name), ...files.map((file) => file.folder || 'General')])].sort();
  const usedStorage = files.reduce((total, file) => total + (file.size || 0), 0);
  const storagePercent = Math.min(100, (usedStorage / storageLimit) * 100);
  const visibleFiles = filter === 'trash' ? trashFiles : getVisibleFiles();

  return (
    <main className="dashboard">
      <DashboardHeader user={user} onLogout={logout} />

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar" aria-label="File navigation">
          <nav className="sidebar-nav">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              <span aria-hidden="true">▣</span> My files
            </button>
            <button className={filter === 'public' ? 'active' : ''} onClick={() => setFilter('public')}>
              <span aria-hidden="true">⌯</span> Public
            </button>
            <button className={filter === 'private' ? 'active' : ''} onClick={() => setFilter('private')}>
              <span aria-hidden="true">◌</span> Private
            </button>
            <button className={filter === 'trash' ? 'active' : ''} onClick={() => setFilter('trash')}>
              <span aria-hidden="true">⌫</span> Trash
            </button>
          </nav>
          <div className="sidebar-folders">
            <p className="sidebar-label">FOLDERS</p>
            <button className="new-folder-button" onClick={() => setIsCreatingFolder(true)}>
              <span aria-hidden="true">+</span> New folder
            </button>
            {folders.map((folder) => (
              <button className={folderFilter === folder && filter !== 'trash' ? 'active' : ''} key={folder} onClick={() => { setFilter('all'); setFolderFilter(folder); }}>
                <span aria-hidden="true">▱</span> {folder}
              </button>
            ))}
          </div>
          <section className="storage-summary" aria-label="Storage usage">
            <div className="storage-summary-label">
              <strong>{formatStorage(usedStorage)} used</strong>
              <span>of {formatStorage(storageLimit)}</span>
            </div>
            <div className="storage-summary-track" role="progressbar" aria-valuenow={Math.round(storagePercent)} aria-valuemin="0" aria-valuemax="100" aria-label="Storage used">
              <div className="storage-summary-bar" style={{ width: `${storagePercent}%` }} />
            </div>
          </section>
        </aside>

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

        {isCreatingFolder && (
          <div className="edit-modal-backdrop" role="presentation">
            <section className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="new-folder-title">
              <p className="eyebrow">NEW FOLDER</p>
              <h2 id="new-folder-title">Create a folder</h2>
              <p className="edit-modal-file">Create it now, then choose it when uploading files.</p>
              <label className="edit-modal-field">
                Folder name
                <input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value.slice(0, 60))} maxLength="60" placeholder="e.g. Work or Personal" autoFocus onKeyDown={(event) => event.key === 'Enter' && createFolder()} />
              </label>
              <div className="edit-modal-actions">
                <button className="modal-cancel" onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}>Cancel</button>
                <button className="modal-public" onClick={createFolder}>Create folder</button>
              </div>
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
          <span className="storage-note">{visibleFiles.length} result{visibleFiles.length === 1 ? '' : 's'}</span>
        </div>

        {visibleFiles.length > 0 ? (
          <div className="file-list">
            {visibleFiles.map((file) => (
              filter === 'trash' ? (
                <article className="file-row trash-row" key={file._id}>
                  <div className="file-info">
                    <strong>{file.originalName}</strong>
                    <span>{file.folder || 'General'} · Deleted {new Date(file.deletedAt).toLocaleDateString()}</span>
                  </div>
                  <button className="visibility shared" onClick={() => restoreFile(file)}>Restore</button>
                  <button className="visibility danger-button" onClick={() => permanentlyDeleteFile(file)}>Delete forever</button>
                </article>
              ) : (
                <FileRow
                  key={file._id}
                  file={file}
                  isAdmin={user.role === 'admin'}
                  onVisibilityChange={changeVisibility}
                  onRename={renameFile}
                  onMove={moveFile}
                  onShare={shareFile}
                  onPreview={previewFile}
                  onDownload={downloadFile}
                  onDelete={requestDelete}
                />
              )
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

        {pendingEdit && (
          <div className="edit-modal-backdrop" role="presentation">
            <section className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
              <p className="eyebrow">{pendingEdit.type === 'rename' ? 'RENAME FILE' : 'MOVE FILE'}</p>
              <h2 id="edit-title">{pendingEdit.type === 'rename' ? 'Choose a new name' : 'Choose a folder'}</h2>
              <p className="edit-modal-file">{pendingEdit.file.originalName}</p>
              <label className="edit-modal-field">
                {pendingEdit.type === 'rename' ? 'File name' : 'Folder name'}
                {pendingEdit.type === 'move' ? (
                  <>
                    <select value={pendingEdit.isNewFolder ? '__new__' : pendingEdit.value} onChange={updateMoveFolder} autoFocus>
                      {folders.map((folder) => <option key={folder} value={folder}>{folder}</option>)}
                      <option value="__new__">+ Create new folder</option>
                    </select>
                    {pendingEdit.isNewFolder && (
                      <input value={pendingEdit.value} onChange={(event) => setPendingEdit((current) => current && { ...current, value: event.target.value.slice(0, 60) })} maxLength="60" placeholder="Enter a new folder name" onKeyDown={(event) => event.key === 'Enter' && saveEdit()} />
                    )}
                  </>
                ) : (
                  <input
                    value={pendingEdit.value}
                    onChange={(event) => setPendingEdit((current) => current && { ...current, value: event.target.value })}
                    maxLength="120"
                    autoFocus
                    onKeyDown={(event) => event.key === 'Enter' && saveEdit()}
                  />
                )}
              </label>
              <div className="edit-modal-actions">
                <button className="modal-cancel" onClick={() => setPendingEdit(null)}>Cancel</button>
                <button className="modal-public" onClick={saveEdit}>Save changes</button>
              </div>
            </section>
          </div>
        )}

        {pendingPermanentDelete && (
          <div className="delete-modal-backdrop" role="presentation">
            <section className="delete-modal" role="dialog" aria-modal="true" aria-labelledby="permanent-delete-title">
              <p className="eyebrow">DELETE FOREVER</p>
              <h2 id="permanent-delete-title">Permanently remove this file?</h2>
              <p className="delete-modal-file">{pendingPermanentDelete.originalName}</p>
              <p className="delete-modal-help">This permanently deletes the file from storage and removes its metadata. You cannot restore it later.</p>
              <div className="delete-modal-actions">
                <button className="modal-cancel" onClick={() => setPendingPermanentDelete(null)}>Keep in Trash</button>
                <button className="modal-delete" onClick={confirmPermanentDelete}>Delete forever</button>
              </div>
            </section>
          </div>
        )}
        </section>
      </div>
    </main>
  );
}
