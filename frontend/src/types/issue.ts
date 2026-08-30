/**
 * Types for Reporting Issues, Recalculation, and General Alternative Options
 */

export type IssueScenarioType = 
  | 'missed_train'
  | 'stay_longer_rome'
  | 'museum_closed'
  | 'preference_change'
  | 'custom';

export interface IssueScenario {
  id: IssueScenarioType;
  title: string;
  description: string;
  iconName: string;
}

export type AlternativeType = 'transit' | 'activity' | 'accommodation' | 'combined';

export interface AlternativeOption {
  id: string;
  type: AlternativeType;
  title: string;
  subtitle: string;
  iconName: string;
  isFastest?: boolean;
  isRecommended?: boolean;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  price?: string;
  priceDiff?: string;
  description: string;
  additionalActivities?: string[];
  newItemsToInject?: Array<{
    title: string;
    description: string;
    time: string;
    type: 'activity' | 'transit' | 'accommodation' | 'dining';
    typeLabel: string;
  }>;
}

export type TimelinePhase = 
  | 'normal'
  | 'recalculating'
  | 'alternatives_ready'
  | 'updated';
