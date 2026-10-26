import { EXPERIMENTAL_FEATURES } from '../core/features';
import '../styles/Experimental.css';

/** "Experimental" badge for panel titles. */
export function ExperimentalBadge() {
  return <span className="experimental-badge">Experimental</span>;
}

/** Limitations of an experimental feature, shown at the top of its panel. */
export function ExperimentalNotice({ feature }) {
  const info = EXPERIMENTAL_FEATURES.find((f) => f.id === feature);
  return (
    <p className="experimental-notice" role="note">
      <strong>Experimental.</strong> {info?.limitations}
    </p>
  );
}
