import { AlertTriangle } from 'lucide-react';
import Modal from './Modal.jsx';

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      busy={busy}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm">
        <span className={`confirm__icon ${danger ? 'confirm__icon--danger' : ''}`}>
          <AlertTriangle size={24} />
        </span>
        <div>{message}</div>
      </div>
    </Modal>
  );
}
