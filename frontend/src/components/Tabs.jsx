import { useId, useState } from 'react';

/**
 * Tab strip with a crossfade between panels.
 * `tabs` is [{ id, label, render }].
 */
export default function Tabs({ tabs, initialId }) {
  const groupId = useId();
  const available = tabs.filter(Boolean);
  const [activeId, setActiveId] = useState(initialId || available[0]?.id);
  const active = available.find((tab) => tab.id === activeId) || available[0];

  if (!active) return null;

  return (
    <div>
      <div className="tabs" role="tablist">
        {available.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${groupId}-${tab.id}`}
            aria-selected={tab.id === active.id}
            aria-controls={`${groupId}-${tab.id}-panel`}
            className={`tab${tab.id === active.id ? ' is-active' : ''}`}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* keyed so the crossfade animation restarts on every tab change */}
      <div
        key={active.id}
        id={`${groupId}-${active.id}-panel`}
        role="tabpanel"
        aria-labelledby={`${groupId}-${active.id}`}
        className="tab-panel"
      >
        {active.render()}
      </div>
    </div>
  );
}
