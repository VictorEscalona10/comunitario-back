import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api/api';
import AddRecipeModal from '../components/AddRecipeModal';
import RecipeContainer from '../components/RecipeContainer';
import toast from 'react-hot-toast';

interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: any[];
  createdAt: string;
}

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getRecipes = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/recipes`);
      setRecipes(response.data);

    } catch (error) {
      toast.error('Error al cargar las recetas');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { getRecipes(); }, []);

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Recetas</h1>
          <p className="page-subtitle">
            {recipes.length > 0
              ? `${recipes.length} receta${recipes.length !== 1 ? 's' : ''} guardadas`
              : 'Sin recetas aún'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Receta
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="empty-state">
          <div className="inline-block animate-spin rounded-full h-9 w-9 border-2 border-indigo-600 border-t-transparent" />
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Cargando recetas...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="24" height="24" fill="none" stroke="#4F46E5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>No hay recetas creadas</p>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Crea tu primera receta para comenzar</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear primera receta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map((recipe) => (
            <RecipeContainer key={recipe.id} recipe={recipe} onRefresh={getRecipes} />
          ))}
        </div>
      )}

      <AddRecipeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRecipeAdded={getRecipes}
      />
    </div>
  );
};

export default Recipes;