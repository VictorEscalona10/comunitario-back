import axios from "axios";
import { API_URL } from "../api/api";
import { useState } from "react";

import toast from "react-hot-toast";
import DeleteIcon from "@mui/icons-material/Delete";

interface IngredientsProps {
  id: string;
  name: string;
  stock: number;
  unit_of_measure: string;
  minStock: number;
  onUpdate?: () => void;
}

const IngredientContainer = ({ id, name, unit_of_measure, onUpdate, stock, minStock }: IngredientsProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<{ isOpen: boolean; type: "add" | "subtract" | null }>({ isOpen: false, type: null });
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  const isLowStock = stock <= minStock;

  const handleInputChange = (value: string) => {
    if (value === "" || /^\d*$/.test(value)) setInputValue(value);
  };

  const initiateAction = (type: "add" | "subtract") => {
    if (!inputValue || inputValue.trim() === "") { toast.error("Ingresa una cantidad válida"); return; }
    const amount = parseInt(inputValue, 10);
    if (isNaN(amount) || amount <= 0) { toast.error("La cantidad debe ser un número entero mayor a 0"); return; }
    setConfirmation({ isOpen: true, type });
  };

  const handleConfirm = async () => {
    if (!confirmation.type) return;
    const amount = parseInt(inputValue, 10);
    setIsLoading(true);
    try {
      const endpoint = confirmation.type === "add" ? "addStock" : "restaStock";
      await axios.patch(`${API_URL}/ingredients/${endpoint}`, null, {
        params: { ingredientId: id, amount },
      });
      toast.success(confirmation.type === "add" ? "Stock agregado" : "Stock descontado");
      setInputValue("");
      setConfirmation({ isOpen: false, type: null });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el stock");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/ingredients/delete/${name}`);
      toast.success("Ingrediente eliminado");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el ingrediente");
    } finally {
      setIsLoading(false);
      setDeleteConfirmation(false);
    }
  };

  return (
    <>
      <div className="ingredient-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', lineHeight: 1.3,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {name}
            </h3>
            <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 500, display: 'block', marginTop: 2 }}>
              {unit_of_measure}
            </span>
          </div>
          <button
            onClick={() => setDeleteConfirmation(true)}
            className="btn-ghost-red"
            title="Eliminar ingrediente"
            style={{ flexShrink: 0 }}
          >
            <DeleteIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Stock number */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: isLowStock ? '#DC2626' : '#4F46E5', lineHeight: 1 }}>
            {stock}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: 3 }}>en stock</span>
          {isLowStock && (
            <div className="badge-low-stock" style={{ marginTop: 8 }}>
              ⚠ Mín: {minStock}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Cant."
            className="input-small"
            style={{ flexShrink: 0 }}
          />
          <button
            onClick={() => initiateAction("subtract")}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px 0', borderRadius: 8, border: '1px solid #E5E7EB', background: 'transparent',
              color: '#9CA3AF', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#FECACA'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            title="Restar stock"
          >
            −
          </button>
          <button
            onClick={() => initiateAction("add")}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px 0', borderRadius: 8, border: '1px solid #C7D2FE', background: 'transparent',
              color: '#4F46E5', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#4F46E5'; }}
            title="Agregar stock"
          >
            +
          </button>
        </div>
      </div>

      {/* Confirm action modal */}
      {confirmation.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h4 className="modal-title">¿Confirmar acción?</h4>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>
                Vas a {confirmation.type === "add" ? "agregar" : "restar"}{" "}
                <strong style={{ color: '#111827' }}>{inputValue}</strong> unidades de{" "}
                <strong style={{ color: '#111827' }}>{name}</strong>.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setConfirmation({ isOpen: false, type: null })}
                disabled={isLoading}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="btn"
                style={{
                  backgroundColor: confirmation.type === "subtract" ? '#EF4444' : '#4F46E5',
                  color: '#fff',
                }}
              >
                {isLoading ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmation && (
        <div className="modal-backdrop">
          <div className="modal-panel" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h4 className="modal-title">Eliminar ingrediente</h4>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" fill="#DC2626" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', color: '#374151' }}>
                    ¿Eliminar <strong>{name}</strong> del inventario?
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: 4 }}>Esta acción no se puede deshacer.</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteConfirmation(false)} disabled={isLoading} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={isLoading} className="btn btn-danger">
                {isLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IngredientContainer;
