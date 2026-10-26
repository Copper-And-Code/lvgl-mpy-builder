import { EXPERIMENTAL_FEATURES, setFeatureEnabled, useFeatures } from '../core/features';
import { ExperimentalBadge } from './ExperimentalNotice';
import '../styles/Experimental.css';

/** Editor settings: currently the experimental features. */
export default function SettingsDialog({ onClose }) {
  const enabled = useFeatures((state) => state.enabled);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-dialog" role="dialog" aria-labelledby="settings-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="settings-title">Settings</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <h3>
            Experimental features <ExperimentalBadge />
          </h3>
          <p className="settings-help">
            These features are incomplete and disabled by default. Enable them only to try them out.
          </p>
          <ul className="settings-features">
            {EXPERIMENTAL_FEATURES.map((feature) => (
              <li key={feature.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={enabled[feature.id]}
                    onChange={(e) => setFeatureEnabled(feature.id, e.target.checked)}
                  />
                  <span className="settings-feature-name">{feature.name}</span>
                </label>
                <p className="settings-feature-limits">{feature.limitations}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
