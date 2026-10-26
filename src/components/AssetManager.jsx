import { useState, useRef } from 'react';
import useStore from '../core/store';
import { Image, Type, Upload, Trash2, X, FileImage, FileText } from 'lucide-react';
import '../styles/AssetManager.css';
import { showConfirm } from '../core/dialogs';

function AssetManager({ onClose }) {
  const assets = useStore((state) => state.assets);
  const addAsset = useStore((state) => state.addAsset);
  const removeAsset = useStore((state) => state.removeAsset);
  const [activeTab, setActiveTab] = useState('images');
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const asset = {
        name: file.name,
        path: file.name,
        data: e.target.result,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      };

      if (activeTab === 'images') {
        addAsset('images', asset);
      } else if (activeTab === 'fonts') {
        addAsset('fonts', asset);
      }
    };

    if (activeTab === 'images') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsDataURL(file);
    }

    event.target.value = '';
  };

  const handleAddAssetClick = () => {
    fileInputRef.current.click();
  };

  const handleDeleteAsset = async (type, assetId) => {
    if (await showConfirm('Delete this asset?', { confirmLabel: 'Delete', danger: true })) {
      removeAsset(type, assetId);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const currentAssets = assets[activeTab] || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content asset-manager" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <FileImage size={20} />
            Asset Manager
          </h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="asset-tabs">
          <button
            className={`tab-button ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            <Image size={16} />
            Images ({assets.images?.length || 0})
          </button>
          <button
            className={`tab-button ${activeTab === 'fonts' ? 'active' : ''}`}
            onClick={() => setActiveTab('fonts')}
          >
            <Type size={16} />
            Fonts ({assets.fonts?.length || 0})
          </button>
        </div>

        <div className="modal-body">
          <div className="asset-toolbar">
            <button className="btn btn-primary" onClick={handleAddAssetClick}>
              <Upload size={16} />
              Upload {activeTab === 'images' ? 'Image' : 'Font'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={activeTab === 'images' ? 'image/*' : '.ttf,.otf,.woff,.woff2'}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          {currentAssets.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <p>No {activeTab} uploaded yet</p>
              <p className="empty-hint">
                Click “Upload” to add {activeTab === 'images' ? 'images' : 'fonts'} to your project
              </p>
            </div>
          ) : (
            <div className="asset-grid">
              {currentAssets.map((asset) => (
                <div key={asset.id} className="asset-item">
                  <div className="asset-preview">
                    {activeTab === 'images' ? (
                      <img src={asset.data} alt={asset.name} />
                    ) : (
                      <div className="font-preview">
                        <Type size={32} />
                      </div>
                    )}
                  </div>
                  <div className="asset-info">
                    <div className="asset-name" title={asset.name}>
                      {asset.name}
                    </div>
                    <div className="asset-details">
                      {formatFileSize(asset.size)}
                    </div>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteAsset(activeTab, asset.id)}
                    title="Delete asset"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="asset-stats">
            Total: {currentAssets.length} {activeTab}
            {currentAssets.length > 0 && (
              <span className="stats-divider">
                | Size: {formatFileSize(currentAssets.reduce((sum, a) => sum + a.size, 0))}
              </span>
            )}
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssetManager;
