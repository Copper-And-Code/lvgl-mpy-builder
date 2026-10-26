import { useShallow } from 'zustand/react/shallow';
import useStore from '../core/store';
import { showConfirm } from '../core/dialogs';
import '../styles/Variables.css';

/** Project variables (integer LVGL subjects) that widgets can be bound to. */
export default function VariablesDialog({ onClose }) {
  const { variables, pages, addVariable, updateVariable, deleteVariable } = useStore(
    useShallow((state) => ({
      variables: state.variables,
      pages: state.pages,
      addVariable: state.addVariable,
      updateVariable: state.updateVariable,
      deleteVariable: state.deleteVariable,
    }))
  );

  const usage = (id) => pages.reduce((count, page) => count + page.widgets.filter((w) => w.binding?.variableId === id).length, 0);

  const remove = async (variable) => {
    const used = usage(variable.id);
    const message = used
      ? `Delete variable "${variable.name}"? ${used} widget binding(s) will be removed.`
      : `Delete variable "${variable.name}"?`;
    if (await showConfirm(message, { confirmLabel: 'Delete', danger: true })) deleteVariable(variable.id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content variables-dialog" role="dialog" aria-labelledby="variables-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="variables-title">Variables</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="variables-help">
            Integer values shared by the UI and the application (LVGL subjects). Bind them to sliders, arcs, dropdowns,
            rollers, switches, checkboxes and labels in the Properties panel: the widgets follow the variable and, for
            inputs, update it.
          </p>
          {variables.length === 0 ? (
            <p className="variables-empty">No variables yet</p>
          ) : (
            <table className="variables-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Initial value</th>
                  <th>Bound widgets</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {variables.map((variable) => (
                  <tr key={variable.id}>
                    <td>
                      <input
                        aria-label="Variable name"
                        value={variable.name}
                        onChange={(e) => updateVariable(variable.id, { name: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Initial value"
                        type="number"
                        value={variable.initial}
                        onChange={(e) => updateVariable(variable.id, { initial: e.target.value })}
                      />
                    </td>
                    <td className="variables-usage">{usage(variable.id)}</td>
                    <td>
                      <button className="btn-danger" onClick={() => remove(variable)} title={`Delete ${variable.name}`}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => addVariable('value', 0)}>
            + Add variable
          </button>
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
