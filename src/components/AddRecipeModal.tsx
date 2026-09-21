import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api/api';
import toast from 'react-hot-toast';
import { validateName, validateDescription, validateQuantity, sanitizeText, sanitizeSearchQuery } from '../utils/security';

interface Ingredient {
  id: string;
  name: string;
  unit_of_measure: string;
  currentStock: number;
}

interface SelectedIngredient {
  id: string;
  name: string;
  quantity: string;
  unit_of_measure: string;
}

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeAdded?: () => void;
}

const AddRecipeModal = ({ isOpen, onClose, onRecipeAdded }: AddRecipeModalProps) => {
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [filterText, setFilterText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) loadIngredients();
  }, [isOpen]);

  const loadIngredients = async () => {
    try {
      const response = await axios.get(`${API_URL}/ingredients/getAll`);
      setIngredients(response.data || []);
    } catch (error) {
      toast.error('Error al cargar ingredientes');
      console.error(error);
    }
  };

  const filteredIngredients = ingredients.filter(i =>
    i.name.toLowerCase().includes(filterText.toLowerCase()) &&
    !selectedIngredients.find(s => s.id === i.id)
  );

  const handleAddIngredient = (ingredient: Ingredient) => {
    setSelectedIngredients([...selectedIngredients, {
      id: ingredient.id,
      name: ingredient.name,
      quantity: '',
      unit_of_measure: ingredient.unit_of_measure,
    }]);
    setFilterText('');
  };

  const handleRemoveIngredient = (id: string) => {
    setSelectedIngredients(selectedIngredients.filter(i => i.id !== id));
  };

  const handleQuantityChange = (id: string, quantity: string) => {
    // Aceptar solo números enteros positivos hasta 6 dígitos
    if (quantity === '' || /^\d*$/.test(quantity)) {
      setSelectedIngredients(selectedIngredients.map(item =>
        item.id === id ? { ...item, quantity: quantity.slice(0, 6) } : item
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validar nombre de la receta
    const nameValidation = validateName(recipeName, 'nombre de la receta', 2, 80);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error || 'Nombre de receta inválido');
      return;
    }

    // 2. Validar descripción
    const descValidation = validateDescription(description, 300);
    if (!descValidation.isValid) {
      toast.error(descValidation.error || 'Descripción inválida');
      return;
    }

    // 3. Validar ingredientes seleccionados
    if (selectedIngredients.length === 0) {
      toast.error('Debe agregar al menos un ingrediente a la receta');
      return;
    }

    const cleanIngredientsPayload: { ingredientId: string; quantity: number }[] = [];

    for (const item of selectedIngredients) {
      const qtyValidation = validateQuantity(item.quantity, 1, 100000, `La cantidad para "${item.name}"`);
      if (!qtyValidation.isValid) {
        toast.error(qtyValidation.error || `Cantidad inválida para "${item.name}"`);
        return;
      }
      cleanIngredientsPayload.push({
        ingredientId: item.id,
        quantity: qtyValidation.cleanNumber,
      });
    }

    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/recipes`, {
        name: nameValidation.cleanValue,
        description: descValidation.cleanValue,
        ingredients: cleanIngredientsPayload,
      });
      toast.success('¡Receta creada exitosamente!');
      setRecipeName('');
      setDescription('');
      setSelectedIngredients([]);
      onClose();
      if (onRecipeAdded) onRecipeAdded();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear la receta');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Nueva Receta</h2>
          <button onClick={onClose} className="modal-close-btn">×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Recipe name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nombre de la receta *</label>
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(sanitizeText(e.target.value, 80))}
                maxLength={80}
                className="input-field"
                placeholder="Ej: Pasta Carbonara"
                required
              />
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(sanitizeText(e.target.value, 300))}
                maxLength={300}
                className="input-field"
                style={{ resize: 'none' }}
                placeholder="Describe brevemente esta receta..."
                rows={2}
              />
            </div>

            {/* Selected ingredients */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Ingredientes seleccionados</label>
                {selectedIngredients.length > 0 && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', background: '#EEF2FF', borderRadius: 999, padding: '2px 8px' }}>
                    {selectedIngredients.length}
                  </span>
                )}
              </div>

              {selectedIngredients.length === 0 ? (
                <div style={{ padding: '20px', border: '2px dashed #E5E7EB', borderRadius: 10, textAlign: 'center' }}>
                  <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Busca y agrega ingredientes abajo</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedIngredients.map((ingredient) => (
                    <div key={ingredient.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px',
                      background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB', flexWrap: 'wrap',
                    }}>
                      <span style={{ flex: '1 1 120px', fontSize: '0.875rem', fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ingredient.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <input
                          type="text"
                          value={ingredient.quantity}
                          onChange={(e) => handleQuantityChange(ingredient.id, e.target.value)}
                          className="input-small"
                          style={{ width: '56px' }}
                          placeholder="0"
                        />
                        <span style={{ fontSize: '0.75rem', color: '#9CA3AF', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ingredient.unit_of_measure}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(ingredient.id)}
                          className="btn-ghost-red"
                          aria-label={`Quitar ${ingredient.name}`}
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ingredient search */}
            <div>
              <label className="form-label">Agregar ingredientes</label>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <svg width="15" height="15" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(sanitizeSearchQuery(e.target.value, 60))}
                  maxLength={60}
                  className="input-field"
                  style={{ paddingLeft: 36 }}
                  placeholder="Buscar ingrediente..."
                />
              </div>
              <div style={{ maxHeight: 180, overflowY: 'auto', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                {filteredIngredients.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
                    {filterText ? 'No se encontraron ingredientes' : 'No hay ingredientes disponibles'}
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {filteredIngredients.map((ingredient) => (
                      <li key={ingredient.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F3F4F6' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>{ingredient.name}</p>
                          <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                            Stock: {ingredient.currentStock} {ingredient.unit_of_measure}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddIngredient(ingredient)}
                          style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4F46E5', background: '#EEF2FF', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}
                        >
                          + Agregar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={isLoading} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading || selectedIngredients.length === 0} className="btn btn-primary">
              {isLoading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  Creando...
                </span>
              ) : 'Crear Receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecipeModal;