import { useApp } from '../state/context';

export function Toast({ msg, undo, onClose }: { msg: string; undo?: boolean; onClose: () => void }) {
  const { dispatch } = useApp();
  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{msg}</span>
      {undo && <button type="button" onClick={() => { dispatch({ type: 'undo' }); onClose(); }}>Undo</button>}
    </div>
  );
}
