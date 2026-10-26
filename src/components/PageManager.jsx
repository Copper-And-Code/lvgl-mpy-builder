import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../core/store';
import { Plus, Trash2, Edit2, Copy, Check, X } from 'lucide-react';
import '../styles/PageManager.css';

function PageManager() {
  const { pages, currentPageId, addPage, deletePage, renamePage, switchPage, duplicatePage } = useStore(
    useShallow((state) => ({
      pages: state.pages,
      currentPageId: state.currentPageId,
      addPage: state.addPage,
      deletePage: state.deletePage,
      renamePage: state.renamePage,
      switchPage: state.switchPage,
      duplicatePage: state.duplicatePage,
    }))
  );

  const [editingPageId, setEditingPageId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleAddPage = () => {
    const name = prompt('Enter page name:');
    if (name) {
      addPage(name);
    }
  };

  const handleDeletePage = (pageId) => {
    if (confirm('Are you sure you want to delete this page?')) {
      deletePage(pageId);
    }
  };

  const startEditing = (page) => {
    setEditingPageId(page.id);
    setEditingName(page.name);
  };

  const cancelEditing = () => {
    setEditingPageId(null);
    setEditingName('');
  };

  const saveEditing = () => {
    if (editingName.trim()) {
      renamePage(editingPageId, editingName.trim());
    }
    cancelEditing();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div className="page-manager">
      <div className="page-manager-header">
        <h3>Pages</h3>
        <button
          className="btn-icon"
          onClick={handleAddPage}
          title="Add new page"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="page-list">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`page-item ${page.id === currentPageId ? 'active' : ''}`}
          >
            {editingPageId === page.id ? (
              <div className="page-edit">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  autoFocus
                  className="page-name-input"
                />
                <button
                  className="btn-icon btn-success"
                  onClick={saveEditing}
                  title="Save"
                >
                  <Check size={14} />
                </button>
                <button
                  className="btn-icon btn-cancel"
                  onClick={cancelEditing}
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div
                  className="page-name"
                  onClick={() => switchPage(page.id)}
                >
                  {page.name}
                  <span className="page-widget-count">
                    ({page.widgets?.length || 0} widgets)
                  </span>
                </div>

                <div className="page-actions">
                  <button
                    className="btn-icon"
                    onClick={() => startEditing(page)}
                    title="Rename page"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => duplicatePage(page.id)}
                    title="Duplicate page"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDeletePage(page.id)}
                    title="Delete page"
                    disabled={pages.length <= 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PageManager;
