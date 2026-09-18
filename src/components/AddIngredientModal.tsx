import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddIngredientModal: React.FC<AddIngredientModalProps> = ({ isOpen, onClose }) => {
  const [ingredientName, setIngredientName] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [minStock, setMinStock] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [loading, setLoading] = useState(false);

  const handleIntInput = (setter: (v: string) => void) => (value: string) => {
    if (value === '' || /^\d*$/.test(value)) setter(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const minStockNum = minStock === "" ? 0 : parseInt(minStock, 10);
    const currentStockNum = currentStock === "" ? 0 : parseInt(currentStock, 10);

    if (minStock !== "" && isNaN(minStockNum)) {
      toast.error("El stock mínimo debe ser un número entero"); setLoading(false); return;
    }
    if (currentStock !== "" && isNaN(currentStockNum)) {
      toast.error("El stock actual debe ser un número entero"); setLoading(false); return;
    }

    try {
      await axios.post("http://localhost:3000/ingredients/create", {
        name: ingredientName.trim(),
        unit_of_measure: unitOfMeasure,
        minStock: minStockNum,
        currentStock: currentStockNum,
      }, { headers: { 'Content-Type': 'application/json' } });

      toast.success("¡Ingrediente creado con éxito!");
      handleClose();
    } catch (error: any) {
      const { message } = error.response?.data || {};
      toast.error(Array.isArray(message) ? message[0] : message || "Error al procesar la solicitud");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIngredientName(""); setUnitOfMeasure(""); setMinStock(""); setCurrentStock("");
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  const isLowPreview = currentStock !== "" && minStock !== "" && Number(currentStock) <= Number(minStock) && Number(minStock) > 0;

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ maxWidth: 440 }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Nuevo Ingrediente</h2>
          <button type="button" onClick={handleClose} className="modal-close-btn">×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="ing-name" className="form-label">Nombre *</label>
              <input
                id="ing-name"
                type="text"
                value={ingredientName}
                onChange={(e) => setIngredientName(e.target.value)}
                className="input-field"
                placeholder="Ej: Harina"
                required
              />
            </div>

            {/* Unit of measure */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="ing-unit" className="form-label">Unidad de medida *</label>
              <select
                id="ing-unit"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Seleccione una unidad</option>
                <option value="MILILITROS">Mililitros (ml)</option>
                <option value="GRAMOS">Gramos (g)</option>
                <option value="UNIDADES">Unidades (u)</option>
              </select>
            </div>

            {/* Stock fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="ing-min" className="form-label">Stock mínimo</label>
                <input
                  id="ing-min"
                  type="text"
                  value={minStock}
                  onChange={(e) => handleIntInput(setMinStock)(e.target.value)}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="ing-current" className="form-label">Stock actual</label>
                <input
                  id="ing-current"
                  type="text"
                  value={currentStock}
                  onChange={(e) => handleIntInput(setCurrentStock)(e.target.value)}
                  className="input-field"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Low stock preview */}
            {isLowPreview && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
              }}>
                <svg width="16" height="16" fill="#DC2626" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 500 }}>
                  El stock inicial está por debajo del mínimo
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={handleClose} disabled={loading} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  Guardando...
                </span>
              ) : 'Guardar ingrediente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIngredientModal;