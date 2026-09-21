import axios from 'axios';
import { API_URL } from '../api/api';
import { useEffect, useState } from 'react';
import IngredientContainer from '../components/IngredientContainer';
import AddIngredientModal from '../components/AddIngredientModal';
import toast from 'react-hot-toast';
import { sanitizeSearchQuery } from '../utils/security';

const Ingredients = () => {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  const getIngredients = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/ingredients/getAll`);
      setIngredients(response.data);

    } catch (error) {
      toast.error('Error al cargar los ingredientes');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { getIngredients(); }, []);

  const filtered = ingredients.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase())
  );
  const lowStockCount = ingredients.filter(i => i.currentStock <= i.minStock).length;

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ingredientes</h1>
          <p className="page-subtitle">
            {ingredients.length > 0
              ? `${ingredients.length} ingrediente${ingredients.length !== 1 ? 's' : ''}${lowStockCount > 0 ? ` · ${lowStockCount} con stock bajo` : ''}`
              : 'Sin ingredientes aún'}
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setIsModalOpen(true)}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Ingrediente
        </button>
      </div>

      {/* Search */}
      {ingredients.length > 0 && (
        <div className="mb-5 w-full sm:max-w-xs relative">
          <svg
            width="16" height="16" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(sanitizeSearchQuery(e.target.value, 50))}
            maxLength={50}
            placeholder="Buscar ingrediente..."
            className="input-field"
            style={{ paddingLeft: 36 }}
          />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="empty-state">
          <div className="inline-block animate-spin rounded-full h-9 w-9 border-2 border-indigo-600 border-t-transparent" />
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Cargando ingredientes...</p>
        </div>
      ) : ingredients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="24" height="24" fill="none" stroke="#4F46E5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>No hay ingredientes</p>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Agrega el primer ingrediente al inventario</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar ingrediente
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p style={{ color: '#374151', fontWeight: 600 }}>Sin resultados</p>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>No se encontró "{search}"</p>
          <button className="btn btn-secondary" onClick={() => setSearch('')}>Limpiar búsqueda</button>
        </div>
      ) : (
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filtered.map((ingredient) => (
            <IngredientContainer
              key={ingredient.id}
              name={ingredient.name}
              stock={ingredient.currentStock}
              id={ingredient.id}
              unit_of_measure={ingredient.unit_of_measure}
              minStock={ingredient.minStock}
              onUpdate={getIngredients}
            />
          ))}
        </section>
      )}

      <AddIngredientModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); getIngredients(); }}
      />
    </div>
  );
};

export default Ingredients;