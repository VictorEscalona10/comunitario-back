import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Ingredient {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit_of_measure: string;
  createdAt?: string;
  isActive?: boolean;
}

interface StockMovement {
  id: string;
  type: 'ENTRADA' | 'SALIDA_MANUAL' | 'SALIDA_RECETA';
  quantity: number;
  reason?: string;
  createdAt: string;
  ingredient?: Ingredient;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: any[];
}

const Profile = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'movements'>('overview');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ingRes, recRes, movRes] = await Promise.all([
        axios.get('http://localhost:3000/ingredients/getAll').catch(() => ({ data: [] })),
        axios.get('http://localhost:3000/recipes').catch(() => ({ data: [] })),
        axios.get('http://localhost:3000/ingredients/movements').catch(() => ({ data: [] })),
      ]);
      setIngredients(ingRes.data || []);
      setRecipes(recRes.data || []);
      setMovements(movRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos del perfil:', error);
      toast.error('Error al sincronizar datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Totales en tiempo real
  const totalStockActual = ingredients.reduce((acc, curr) => acc + (curr.currentStock || 0), 0);
  const totalIngredientesCount = ingredients.length;
  const lowStockCount = ingredients.filter(i => (i.currentStock || 0) <= (i.minStock || 0)).length;

  // Totales reales calculados desde la lista de movimientos registrados en el backend
  const totalIngresadoReal = movements
    .filter(m => m.type === 'ENTRADA')
    .reduce((acc, m) => acc + Number(m.quantity || 0), 0);

  const totalUtilizadoReal = movements
    .filter(m => m.type === 'SALIDA_MANUAL' || m.type === 'SALIDA_RECETA')
    .reduce((acc, m) => acc + Number(m.quantity || 0), 0);

  // Si no hay movimientos en DB aún (base limpia), se calculan basándose en stock inicial
  const totalIngresado = totalIngresadoReal > 0 
    ? totalIngresadoReal 
    : ingredients.reduce((acc, i) => acc + (i.currentStock || 0), 0);

  const totalUtilizado = totalUtilizadoReal;

  const tasaUso = (totalIngresado + totalStockActual) > 0 
    ? Math.round((totalUtilizado / (totalIngresado + totalStockActual)) * 100) 
    : 0;

  // Mapeo de consumo por ingrediente
  const consumoPorIngrediente: Record<string, { utilizado: number; ingresado: number }> = {};
  movements.forEach(m => {
    const ingName = m.ingredient?.name || 'Otro';
    if (!consumoPorIngrediente[ingName]) {
      consumoPorIngrediente[ingName] = { utilizado: 0, ingresado: 0 };
    }
    if (m.type === 'ENTRADA') {
      consumoPorIngrediente[ingName].ingresado += Number(m.quantity);
    } else {
      consumoPorIngrediente[ingName].utilizado += Number(m.quantity);
    }
  });

  // Top ingredientes más utilizados dinámicamente
  const topIngredientes = ingredients
    .map(ing => {
      const stats = consumoPorIngrediente[ing.name] || { utilizado: 0, ingresado: ing.currentStock };
      const ingresadoTotal = stats.ingresado || ing.currentStock || 1;
      const pctUso = Math.min(100, Math.round((stats.utilizado / ingresadoTotal) * 100));
      return {
        ...ing,
        ingresado: ingresadoTotal,
        utilizado: stats.utilizado,
        pctUso,
      };
    })
    .sort((a, b) => b.utilizado - a.utilizado)
    .slice(0, 5);

  // Datos para la gráfica de 7 días distribuidos con timestamps reales o días de la semana
  const chartDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const chartData = chartDays.map((day, idx) => {
    // Agrupar movimientos reales por día de la semana (0 = Dom, 1 = Lun, etc.)
    const targetDayIndex = (idx + 1) % 7; 
    const movsOfDay = movements.filter(m => {
      if (!m.createdAt) return false;
      const d = new Date(m.createdAt);
      return d.getDay() === targetDayIndex;
    });

    const inVal = movsOfDay
      .filter(m => m.type === 'ENTRADA')
      .reduce((acc, m) => acc + Number(m.quantity), 0);

    const outVal = movsOfDay
      .filter(m => m.type !== 'ENTRADA')
      .reduce((acc, m) => acc + Number(m.quantity), 0);

    return { day, ingresados: inVal, utilizados: outVal };
  });

  const maxChartVal = Math.max(...chartData.map(d => Math.max(d.ingresados, d.utilizados)), 10);

  return (
    <div className="profile-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Perfil & Analíticas</h1>
          <p className="page-subtitle">
            Monitoreo general del flujo de ingredientes, estadísticas de inventario y consumos en tiempo real.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            className={`btn ${timeRange === 'week' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTimeRange('week')}
          >
            Esta Semana
          </button>
          <button 
            className={`btn ${timeRange === 'month' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTimeRange('month')}
          >
            Este Mes
          </button>
          <button 
            className="btn btn-secondary"
            onClick={fetchData}
            title="Actualizar datos"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* User Info Header Card */}
      <div className="profile-user-card mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="profile-avatar">
            <span>A</span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">Administrador de Almacén</h2>
              <span className="profile-badge-active">● Conectado a NestJS DB</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">admin@comunitario.org · Rol: Gestión & Control</p>
            <div className="flex gap-4 mt-2 text-xs text-gray-600 flex-wrap">
              <span> Total Ingredientes: <strong className="text-gray-800">{totalIngredientesCount}</strong></span>
              <span> Recetas Registradas: <strong className="text-gray-800">{recipes.length}</strong></span>
              <span> Stock Total Disponible: <strong className="text-gray-800">{totalStockActual} unidades/kg</strong></span>
              <span> Movimientos Registrados: <strong className="text-gray-800">{movements.length}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* KPI 1: Ingredientes Ingresados */}
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-green">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Ingresaron (Entradas)</span>
            <span className="stat-value text-emerald-600">+{totalIngresado}</span>
            <span className="stat-subtext">Unidades/Kg ingresados en DB</span>
          </div>
        </div>

        {/* KPI 2: Ingredientes Utilizados */}
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-amber">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Se Utilizaron (Salidas)</span>
            <span className="stat-value text-amber-600">-{totalUtilizado}</span>
            <span className="stat-subtext">Unidades/Kg consumidos en recetas/ajustes</span>
          </div>
        </div>

        {/* KPI 3: Tasa de Eficiencia */}
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-indigo">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Tasa de Rotación / Uso</span>
            <span className="stat-value text-indigo-600">{tasaUso}%</span>
            <span className="stat-subtext">Relación consumo / inventario</span>
          </div>
        </div>

        {/* KPI 4: Stock Mínimo Alertas */}
        <div className="stat-card">
          <div className={`stat-icon-wrapper ${lowStockCount > 0 ? 'stat-icon-red' : 'stat-icon-blue'}`}>
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Alertas de Stock Bajo</span>
            <span className={`stat-value ${lowStockCount > 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {lowStockCount}
            </span>
            <span className="stat-subtext">
              {lowStockCount > 0 ? 'Requieren reabastecimiento' : 'Stock en niveles óptimos'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Bar Chart: Entradas vs Salidas */}
        <div className="chart-card lg:col-span-2">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Flujo Diario: Ingresados vs Utilizados</h3>
              <p className="chart-subtitle">Movimientos reales de stock por día de la semana</p>
            </div>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-color bg-emerald-500" />
                Ingresados
              </span>
              <span className="legend-item">
                <span className="legend-color bg-amber-500" />
                Utilizados
              </span>
            </div>
          </div>

          <div className="chart-body">
            {isLoading ? (
              <div className="chart-loading">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
              </div>
            ) : (
              <div className="bar-chart-container">
                {chartData.map((d, i) => {
                  const heightIn = Math.round((d.ingresados / maxChartVal) * 100);
                  const heightOut = Math.round((d.utilizados / maxChartVal) * 100);
                  return (
                    <div key={i} className="chart-column">
                      <div className="bars-group">
                        <div
                          className="chart-bar bar-in"
                          style={{ height: `${Math.max(8, heightIn)}%` }}
                          title={`Ingresados (${d.day}): ${d.ingresados}`}
                        >
                          <span className="bar-tooltip">+{d.ingresados}</span>
                        </div>
                        <div
                          className="chart-bar bar-out"
                          style={{ height: `${Math.max(8, heightOut)}%` }}
                          title={`Utilizados (${d.day}): ${d.utilizados}`}
                        >
                          <span className="bar-tooltip">-{d.utilizados}</span>
                        </div>
                      </div>
                      <span className="chart-x-label">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Inventory Breakdown Side Panel */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Top Consumo por Ingrediente</h3>
              <p className="chart-subtitle">Volumen de salidas registradas</p>
            </div>
          </div>

          <div className="chart-body flex flex-col justify-between gap-4">
            {topIngredientes.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Sin datos de ingredientes</p>
            ) : (
              topIngredientes.map((ing) => (
                <div key={ing.id} className="top-ing-item">
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>{ing.name}</span>
                    <span className="text-gray-500">
                      -{ing.utilizado} {ing.unit_of_measure}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill bg-indigo-600"
                      style={{ width: `${Math.max(5, ing.pctUso)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>Stock actual: {ing.currentStock} {ing.unit_of_measure}</span>
                    <span>{ing.pctUso}% rotación</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tabs / Movement History Section */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div className="flex gap-4">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Resumen de Inventario ({ingredients.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'movements' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('movements')}
            >
              Historial Real de Movimientos ({movements.length})
            </button>
          </div>
        </div>

        <div className="chart-body p-0">
          {activeTab === 'overview' ? (
            <div className="overflow-x-auto">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Ingrediente</th>
                    <th>Unidad</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Ingresados</th>
                    <th>Utilizados</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ing) => {
                    const isLow = ing.currentStock <= ing.minStock;
                    const stats = consumoPorIngrediente[ing.name] || { utilizado: 0, ingresado: ing.currentStock };
                    return (
                      <tr key={ing.id}>
                        <td className="font-medium text-gray-900">{ing.name}</td>
                        <td>{ing.unit_of_measure || 'UNIDADES'}</td>
                        <td className="font-semibold text-gray-800">{ing.currentStock}</td>
                        <td className="text-gray-500">{ing.minStock}</td>
                        <td className="text-emerald-600 font-medium">+{stats.ingresado}</td>
                        <td className="text-amber-600 font-medium">-{stats.utilizado}</td>
                        <td>
                          {isLow ? (
                            <span className="badge badge-red">Stock Bajo</span>
                          ) : (
                            <span className="badge badge-green">Disponible</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {ingredients.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-500">
                        No hay ingredientes registrados en la base de datos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Ingrediente</th>
                    <th>Cantidad</th>
                    <th>Detalle / Motivo</th>
                    <th>Fecha / Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mov) => (
                    <tr key={mov.id}>
                      <td>
                        {mov.type === 'ENTRADA' ? (
                          <span className="badge badge-green flex items-center gap-1 w-fit">
                            ↑ Entrada
                          </span>
                        ) : mov.type === 'SALIDA_RECETA' ? (
                          <span className="badge badge-amber flex items-center gap-1 w-fit">
                            🍳 Receta
                          </span>
                        ) : (
                          <span className="badge badge-red flex items-center gap-1 w-fit">
                            ↓ Salida
                          </span>
                        )}
                      </td>
                      <td className="font-medium text-gray-900">
                        {mov.ingredient?.name || 'Ingrediente'}
                      </td>
                      <td className={mov.type === 'ENTRADA' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {mov.type === 'ENTRADA' ? `+${mov.quantity}` : `-${mov.quantity}`} {mov.ingredient?.unit_of_measure || ''}
                      </td>
                      <td className="text-gray-600 text-sm">{mov.reason || 'Sin motivo especificado'}</td>
                      <td className="text-gray-400 text-xs">
                        {mov.createdAt
                          ? new Date(mov.createdAt).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-500">
                        Aún no se han registrado movimientos de stock. (Prueba agregar stock o preparar una receta)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
