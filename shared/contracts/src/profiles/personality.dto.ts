export enum TravelStyle {
  AVENTURA = 'Aventura',
  RELAX = 'Relax',
  CULTURAL = 'Cultural',
  INVERSION = 'Inversión',
  GASTRONOMICO = 'Gastronómico',
  ECO_TURISMO = 'Eco-Turismo',
}

export enum BudgetCategory {
  ECONOMICO = 'Económico',
  ESTANDAR = 'Estándar',
  LUJO = 'Lujo',
  PERSONALIZADO = 'Personalizado',
}

export enum PacePreference {
  RELAJADO = 'Relajado',
  MODERADO = 'Moderado',
  INTENSO = 'Intenso',
}

export interface PsychologicalAssessment {
  spontaneityScore: number;     // 1 (muy planificador) a 5 (completamente espontáneo)
  comfortPriority: number;      // 1 (rústico/aventurero) a 5 (máximo confort/lujo)
  culturalCuriosity: number;    // 1 (baja) a 5 (alta inmersión local)
  socialPreference: 'solo' | 'couple' | 'family' | 'friends' | 'group';
  physicalActivityLevel: 'low' | 'moderate' | 'high';
  interests: string[];          // e.g. ["senderismo", "museos", "cafeterías de especialidad"]
}
