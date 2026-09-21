import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../api/api";
import toast from "react-hot-toast";
import { validateName, validateUnitOfMeasure, validateQuantity, sanitizeText } from "../utils/security";

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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitizar en tiempo real eliminando caracteres peligrosos
    const sanitized = sanitizeText(e.target.value, 60);
    setIngredientName(sanitized);
  };

  const handleIntInput = (setter: (v: string) => void) => (value: string) => {
    // Permitir solo dígitos numéricos enteros positivos
    if (value === '' || /^\d*$/.test(value)) {
      setter(value.slice(0, 8));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validar nombre del ingrediente
    const nameValidation = validateName(ingredientName, 'nombre del ingrediente', 2, 60);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error || 'Nombre de ingrediente inválido');
      return;
    }

    // 2. Validar unidad de medida (Whitelist)
    const unitValidation = validateUnitOfMeasure(unitOfMeasure);
    if (!unitValidation.isValid) {
      toast.error(unitValidation.error || 'Selecciona una unidad de medida válida');
      return;
    }

    // 3. Validar stock mínimo
    let minStockNum = 0;
    if (minStock.trim() !== '') {
      const minStockVal = validateQuantity(minStock, 0, 1000000, 'El stock mínimo');
      if (!minStockVal.isValid) {
        toast.error(minStockVal.error || 'Stock mínimo inválido');
        return;
      }
      minStockNum = minStockVal.cleanNumber;
    }

    // 4. Validar stock actual
    let currentStockNum = 0;
    if (currentStock.trim() !== '') {
      const currentStockVal = validateQuantity(currentStock, 0, 1000000, 'El stock actual');
      if (!currentStockVal.isValid) {
        toast.error(currentStockVal.error || 'Stock actual inválido');
        return;
      }
      currentStockNum = currentStockVal.cleanNumber;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/ingredients/create`, {
        name: nameValidation.cleanValue,
        unit_of_measure: unitValidation.cleanUnit,
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
                onChange={handleNameChange}
                maxLength={60}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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