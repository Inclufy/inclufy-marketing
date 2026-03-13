// src/hooks/useCampaignReadiness.ts
// Campaign Readiness Checker — checks all setup modules and calculates a readiness score

import { useMemo } from 'react';
import { useBrandMemory } from '@/hooks/queries/useBrandMemory';
import { useContentLibrary } from '@/hooks/queries/useContentLibrary';
import { useSocialAccounts } from '@/hooks/queries/useSocialAccounts';
import { useContacts } from '@/hooks/queries/useContacts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────

interface I18nLabel {
  en: string;
  nl: string;
  fr: string;
}

export interface ReadinessItem {
  id: string;
  label: I18nLabel;
  description: I18nLabel;
  completed: boolean;
  weight: number;
  fixRoute: string;
  aiFixable: boolean;
  aiSystemPrompt?: string;
  aiFirstMessage?: string;
}

export interface ReadinessResult {
  score: number;
  items: ReadinessItem[];
  missingItems: ReadinessItem[];
  completedItems: ReadinessItem[];
  isReady: boolean;
  isLoading: boolean;
}

// ─── AI prompts per readiness item ──────────────────────────────────

const AI_PROMPTS: Record<string, { systemPrompt: string; firstMessage: string }> = {
  brand: {
    systemPrompt:
      'Je bent een marketing setup assistent voor het Inclufy Marketing platform. Help de gebruiker hun merkidentiteit in te vullen. Gebruik eventueel beschikbare Growth Blueprint data als basis. Geef praktische suggesties voor merknaam-beschrijving, missie, en visie. Antwoord in het Nederlands. Houd het beknopt en actiegericht.',
    firstMessage:
      'Help me mijn merkidentiteit in te vullen. Analyseer mijn bedrijf en stel een merkbeschrijving, missie en visie voor.',
  },
  audience: {
    systemPrompt:
      'Je bent een marketing doelgroep specialist voor het Inclufy Marketing platform. Help de gebruiker hun doelgroep(en) te definiëren op basis van hun bedrijfsprofiel en industrie. Geef concrete doelgroep persona\'s met naam, leeftijdsrange, functietitels, pijnpunten en kanaalvoorkeur. Antwoord in het Nederlands.',
    firstMessage:
      'Stel 2-3 doelgroep persona\'s voor gebaseerd op mijn bedrijfstype. Geef per persona een naam, leeftijdsrange, functie, pijnpunten en beste marketingkanaal.',
  },
  goals: {
    systemPrompt:
      'Je bent een marketing strategie expert voor het Inclufy Marketing platform. Help de gebruiker SMART marketing doelen opstellen met bijbehorende KPIs. Baseer de doelen op de industrie en het huidige marketing niveau. Antwoord in het Nederlands.',
    firstMessage:
      'Stel 3 SMART marketing doelen voor met bijbehorende KPIs. Geef per doel een titel, beschrijving, meetbare KPI, en een realistisch tijdframe.',
  },
  content: {
    systemPrompt:
      'Je bent een content strategie expert voor het Inclufy Marketing platform. Help de gebruiker starter content te bedenken voor hun eerste campagne. Geef concrete content ideeën met titels, formats en kanalen. Antwoord in het Nederlands.',
    firstMessage:
      'Genereer 3 concrete content ideeën voor mijn eerste marketing campagne. Geef per idee een titel, format (blog/social/email), beschrijving en doelgroep.',
  },
};

// ─── Hook ───────────────────────────────────────────────────────────

export function useCampaignReadiness(): ReadinessResult {
  // Fetch all data sources in parallel
  const { data: brandMemory, isLoading: loadingBrand } = useBrandMemory();
  const { data: contentData, isLoading: loadingContent } = useContentLibrary({ limit: 1 });
  const { data: socialAccounts, isLoading: loadingSocial } = useSocialAccounts();
  const { data: contactsData, isLoading: loadingContacts } = useContacts({ limit: 1 });

  // Blueprint check via Supabase (strategic_plans or recommendations table)
  const { data: blueprintData, isLoading: loadingBlueprint } = useQuery<any[]>({
    queryKey: ['growth-blueprint-list'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data } = await supabase.from('strategic_plans').select('id').eq('user_id', user.id).limit(1);
        return data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const isLoading = loadingBrand || loadingContent || loadingSocial || loadingContacts || loadingBlueprint;

  const items = useMemo<ReadinessItem[]>(() => {
    // 1. Brand Identity
    const brandComplete = !!(
      brandMemory?.brand_name &&
      brandMemory?.brand_description &&
      brandMemory?.mission
    );

    // 2. Target Audience
    const audienceComplete = !!(brandMemory?.audiences && brandMemory.audiences.length > 0);

    // 3. Goals & KPIs
    const goalsComplete = !!(brandMemory?.marketing_goals && brandMemory.marketing_goals.length > 0);

    // 4. Content
    const contentItems = Array.isArray(contentData) ? contentData : ((contentData as any)?.items || []);
    const contentComplete = contentItems.length > 0;

    // 5. Social Media
    const socialComplete = !!(socialAccounts && socialAccounts.length > 0);

    // 6. Contacts
    const contacts = (contactsData as any)?.contacts || (Array.isArray(contactsData) ? contactsData : []);
    const contactsTotal = (contactsData as any)?.total ?? contacts.length;
    const contactsComplete = contactsTotal > 0;

    // 7. Growth Blueprint
    const hasBlueprint = !!(blueprintData && blueprintData.length > 0);

    return [
      {
        id: 'brand',
        label: { en: 'Brand Identity', nl: 'Merkidentiteit', fr: 'Identité de Marque' },
        description: {
          en: 'Company name, description, and mission defined',
          nl: 'Bedrijfsnaam, beschrijving en missie ingevuld',
          fr: 'Nom de l\'entreprise, description et mission définis',
        },
        completed: brandComplete,
        weight: 20,
        fixRoute: '/app/setup/brand',
        aiFixable: true,
        aiSystemPrompt: AI_PROMPTS.brand.systemPrompt,
        aiFirstMessage: AI_PROMPTS.brand.firstMessage,
      },
      {
        id: 'audience',
        label: { en: 'Target Audience', nl: 'Doelgroep', fr: 'Public Cible' },
        description: {
          en: 'At least one target audience defined',
          nl: 'Minimaal één doelgroep gedefinieerd',
          fr: 'Au moins un public cible défini',
        },
        completed: audienceComplete,
        weight: 15,
        fixRoute: '/app/setup/audience',
        aiFixable: true,
        aiSystemPrompt: AI_PROMPTS.audience.systemPrompt,
        aiFirstMessage: AI_PROMPTS.audience.firstMessage,
      },
      {
        id: 'goals',
        label: { en: 'Goals & KPIs', nl: 'Doelen & KPIs', fr: 'Objectifs & KPIs' },
        description: {
          en: 'At least one marketing goal defined',
          nl: 'Minimaal één marketing doel gedefinieerd',
          fr: 'Au moins un objectif marketing défini',
        },
        completed: goalsComplete,
        weight: 15,
        fixRoute: '/app/setup/goals',
        aiFixable: true,
        aiSystemPrompt: AI_PROMPTS.goals.systemPrompt,
        aiFirstMessage: AI_PROMPTS.goals.firstMessage,
      },
      {
        id: 'content',
        label: { en: 'Content', nl: 'Content', fr: 'Contenu' },
        description: {
          en: 'At least one content piece created',
          nl: 'Minimaal één content item aangemaakt',
          fr: 'Au moins un contenu créé',
        },
        completed: contentComplete,
        weight: 15,
        fixRoute: '/app/content',
        aiFixable: true,
        aiSystemPrompt: AI_PROMPTS.content.systemPrompt,
        aiFirstMessage: AI_PROMPTS.content.firstMessage,
      },
      {
        id: 'social',
        label: { en: 'Social Media', nl: 'Social Media', fr: 'Réseaux Sociaux' },
        description: {
          en: 'At least one social account connected',
          nl: 'Minimaal één social media account verbonden',
          fr: 'Au moins un compte social connecté',
        },
        completed: socialComplete,
        weight: 10,
        fixRoute: '/app/settings',
        aiFixable: false,
      },
      {
        id: 'contacts',
        label: { en: 'Contacts', nl: 'Contacten', fr: 'Contacts' },
        description: {
          en: 'At least one contact imported',
          nl: 'Minimaal één contact geïmporteerd',
          fr: 'Au moins un contact importé',
        },
        completed: contactsComplete,
        weight: 15,
        fixRoute: '/app/analytics/contacts',
        aiFixable: false,
      },
      {
        id: 'blueprint',
        label: { en: 'Growth Blueprint', nl: 'Groei Blauwdruk', fr: 'Plan de Croissance' },
        description: {
          en: 'At least one website scan completed',
          nl: 'Minimaal één website scan voltooid',
          fr: 'Au moins un scan de site web complété',
        },
        completed: hasBlueprint,
        weight: 10,
        fixRoute: '/app/intelligence/growth-blueprint',
        aiFixable: false,
      },
    ];
  }, [brandMemory, contentData, socialAccounts, contactsData, blueprintData]);

  const score = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.completed ? item.weight : 0), 0);
  }, [items]);

  const missingItems = useMemo(() => items.filter(i => !i.completed), [items]);
  const completedItems = useMemo(() => items.filter(i => i.completed), [items]);

  return {
    score,
    items,
    missingItems,
    completedItems,
    isReady: score >= 60,
    isLoading,
  };
}
