import { useState, useEffect, useCallback } from 'react';
import { getServices, createService, updateService, deleteService } from '../api';

/**
 * Hook personnalisé pour gérer les services
 * Best practice React: https://react.dev/learn/reusing-logic-with-custom-hooks
 */
export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les services
  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage du composant
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Créer un service
  const create = useCallback(async (serviceData) => {
    setError(null);
    try {
      await createService(serviceData);
      await loadServices(); // Recharger la liste
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [loadServices]);

  // Mettre à jour un service
  const update = useCallback(async (id, serviceData) => {
    setError(null);
    try {
      await updateService(id, serviceData);
      await loadServices(); // Recharger la liste
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [loadServices]);

  // Supprimer un service
  const remove = useCallback(async (id) => {
    setError(null);
    try {
      await deleteService(id);
      await loadServices(); // Recharger la liste
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [loadServices]);

  // Trouver un service par ID
  const findById = useCallback((id) => {
    return services.find(s => s.id === id);
  }, [services]);

  // Grouper par type
  const groupByType = useCallback(() => {
    return services.reduce((acc, service) => {
      const type = service.type || 'Unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(service);
      return acc;
    }, {});
  }, [services]);

  return {
    services,
    loading,
    error,
    loadServices,
    create,
    update,
    remove,
    findById,
    groupByType
  };
}
