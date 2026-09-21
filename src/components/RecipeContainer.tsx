import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api/api';
import { toast } from 'react-hot-toast';

interface IngredientItem {
  ingredient?: {
    name: string;
    unit_of_measure: string;
  };
  quantity: number;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: IngredientItem[];
  createdAt: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  onRefresh?: () => void;
}

const RecipeContainer: React.FC<RecipeCardProps> = ({ recipe }) => {

  const [quantity, setQuantity] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = (value: string) => {
    if (value === '' || /^\d*$/.test(value)) setQuantity(value);
  };

  const handlePrepare = async () => {
    const qty = parseInt(quantity, 10);
    if (!quantity.trim() || isNaN(qty)) { toast.error('Debe ingresar una cantidad'); return; }
    if (qty < 1) { toast.error('La cantidad debe ser mayor a 0'); return; }

    try {
      setLoading(true);
      const { data } = await axios.post(`${API_URL}/recipes/${recipe.id}/prepare`, { quantity: qty });
      toast.success(data.message);
      setQuantity('');
    } catch (error: any) {
      const backendError = error?.response?.data;
      if (backendError?.ingredient) {
        toast.error(`${backendError.ingredient}: necesita ${backendError.required}, disponible ${backendError.available}`);
      } else {
        toast.error(backendError?.message || 'Error al preparar la receta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recipe-card">
      {/* Name */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.3 }}>
        {recipe.name}
      </h3>

      {/* Description */}
      {recipe.description && (
        <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: 12, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {recipe.description}
        </p>
      )}

      {/* Ingredients */}
      <div style={{ flex: 1, marginBottom: 16 }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4F46E5', marginBottom: 8 }}>
          Ingredientes
        </p>
        {recipe.ingredients.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: '#9CA3AF', fontStyle: 'italic' }}>Sin ingredientes</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recipe.ingredients.slice(0, 5).map((item, idx) => (
              <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                  {item.ingredient?.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', flexShrink: 0 }}>
                  {item.quantity} {item.ingredient?.unit_of_measure}
                </span>
              </li>
            ))}
            {recipe.ingredients.length > 5 && (
              <li style={{ fontSize: '0.75rem', color: '#9CA3AF', fontStyle: 'italic' }}>
                +{recipe.ingredients.length - 5} más
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Prepare row */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: '1px solid #F3F4F6', marginTop: 'auto' }}>
        <input
          type="text"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          disabled={loading}
          placeholder="Cant."
          className="input-small"
          style={{ flexShrink: 0 }}
        />
        <button
          onClick={handlePrepare}
          disabled={loading || !quantity.trim()}
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: 'center', padding: '0.45rem 0.75rem' }}
        >
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              Preparando...
            </span>
          ) : 'Preparar'}
        </button>
      </div>
    </div>
  );
};

export default RecipeContainer;