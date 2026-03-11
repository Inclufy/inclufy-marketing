// src/hooks/useAttribution.ts
import { useState, useEffect, useCallback } from 'react';
import attributionService, {
  type AttributionModelConfig,
  type AttributionModelType,
  type AttributionDashboardData,
  type ModelComparison,
  type JourneyPath,
} from '@/services/context-marketing/attribution.service';

export interface AttributionState {
  dashboardData: AttributionDashboardData | null;
  models: AttributionModelConfig[];
  selectedModel: AttributionModelType;
  modelComparison: ModelComparison[];
  journeyPaths: JourneyPath[];
  isLoading: boolean;
  error: string | null;
  selectModel: (model: AttributionModelType) => void;
  refetch: () => void;
}

export function useAttribution(): AttributionState {
  const [dashboardData, setDashboardData] = useState<AttributionDashboardData | null>(null);
  const [models, setModels] = useState<AttributionModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<AttributionModelType>('data_driven_shapley');
  const [modelComparison, setModelComparison] = useState<ModelComparison[]>([]);
  const [journeyPaths, setJourneyPaths] = useState<JourneyPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (model: AttributionModelType) => {
    try {
      setIsLoading(true);
      setError(null);
      const [modelsRes, dashRes, compRes, pathsRes] = await Promise.all([
        attributionService.getModels(),
        attributionService.runAttribution(model),
        attributionService.getModelComparison(),
        attributionService.getJourneyPaths(),
      ]);
      setModels(modelsRes);
      setDashboardData(dashRes);
      setModelComparison(compRes);
      setJourneyPaths(pathsRes);
    } catch (err: any) {
      console.error('Attribution fetch error:', err);
      setError(err.message || 'Failed to load attribution data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(selectedModel); }, [fetchData, selectedModel]);

  const selectModel = useCallback((model: AttributionModelType) => {
    setSelectedModel(model);
  }, []);

  return { dashboardData, models, selectedModel, modelComparison, journeyPaths, isLoading, error, selectModel, refetch: () => fetchData(selectedModel) };
}
