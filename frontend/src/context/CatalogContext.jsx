import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { CATEGORIES as INITIAL_CATEGORIES, categoryName as fallbackCategory, departmentName as fallbackDepartment } from '../lib/config.js';

const CatalogContext = createContext(null);
const initialDepartments = [...new Map(INITIAL_CATEGORIES.map(item => [item.value, { value: item.value, label: item.department }])).values()];

export function CatalogProvider({ children }) {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [departments, setDepartments] = useState(initialDepartments);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [categoryData, departmentData] = await Promise.all([
      api.get('/api/meta/categories'), api.get('/api/meta/departments'),
    ]);
    setCategories(categoryData.categories.map(item => ({ value: item.key, label: item.label,
      department: item.department, departmentName: item.departmentName })));
    setDepartments(departmentData.departments.map(item => ({ value: item.key, label: item.name })));
    setLoading(false);
  }, []);

  useEffect(() => { refresh().catch(() => setLoading(false)); }, [refresh]);
  const value = useMemo(() => ({ categories, departments, loading, refresh,
    categoryName: key => categories.find(c => c.value === key)?.label || fallbackCategory(key),
    departmentName: key => departments.find(d => d.value === key)?.label || fallbackDepartment(key),
  }), [categories, departments, loading, refresh]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error('useCatalog must be used inside CatalogProvider');
  return value;
}
