import React from 'react';

function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileIcon({ type }) {
  const [category, extension] = type?.split('/') || [];
  const label = extension?.slice(0, 4) || 'FILE';

  return (
    <div className={`file-icon ${category || 'file'}`}>
      <span>{label}</span>
    </div>
  );
}

export default function FileRow({ file, isAdmin, onVisibilityChange, onRename, onMove, onShare, onPreview, onDownload, onDelete }) {
  const isShared = file.isPublic;
  const ownerName = file.owner?.name || 'Unknown';
  const fileDate = new Date(file.createdAt).toLocaleDateString();

  return (
    <article className="file-row">
      <FileIcon type={file.mimeType} />

      <div className="file-info">
        <strong>{file.originalName}</strong>
        <span>
          {file.folder || 'General'} · {formatSize(file.size)} · {fileDate}
        </span>
      </div>

      {isAdmin && (
        <span className="owner">{ownerName}</span>
      )}

      <div className="file-access">
        <span className={`access-status ${isShared ? 'shared' : ''}`}>
          {isShared ? 'Public' : 'Private'}
        </span>
        <button
          className={`visibility ${isShared ? 'shared' : ''}`}
          onClick={() => onVisibilityChange(file)}
          title={isShared ? 'Stop sharing this file' : 'Create a link to share this file'}
        >
          {isShared ? 'Make private' : 'Make public'}
        </button>
      </div>
      {isShared && file.shareToken && (
        <button className="visibility shared" onClick={() => onShare(file)}>
          Copy link
        </button>
      )}
      <button className="visibility" onClick={() => onRename(file)}>Rename</button>
      <button className="visibility" onClick={() => onMove(file)}>Move</button>
      <button className="visibility" onClick={() => onPreview(file)}>
        Preview
      </button>
      <button className="row-action" onClick={() => onDownload(file)} title="Download">↓</button>
      <button className="row-action danger" onClick={() => onDelete(file)} title="Delete">×</button>
    </article>
  );
}
