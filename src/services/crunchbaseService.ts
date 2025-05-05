import { supabase } from './supabaseService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface CrunchbaseCompany {
  properties: {
    name: string;
    description: string;
    website_url?: string;
    linkedin_url?: string;
    founded_on?: string;
    num_employees_enum?: string;
    funding_total?: {
      value: number;
      currency: string;
    };
  };
}

interface CrunchbaseError {
  message: string;
  status: number;
}

export class CrunchbaseService {
  private static instance: CrunchbaseService;
  private requestQueue: Promise<any>[] = [];
  private requestsThisMinute = 0;
  private lastRequestTime = Date.now();

  private constructor() {}

  public static getInstance(): CrunchbaseService {
    if (!CrunchbaseService.instance) {
      CrunchbaseService.instance = new CrunchbaseService();
    }
    return CrunchbaseService.instance;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session');
    }

    const url = `${SUPABASE_URL}/functions/v1/crunchbase${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error: CrunchbaseError = await response.json();
        throw new Error(`Crunchbase API error: ${error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Crunchbase API request failed:', error);
      throw error;
    }
  }

  public async getCompanyByName(companyName: string): Promise<CrunchbaseCompany | null> {
    try {
      const encodedName = encodeURIComponent(companyName);
      const endpoint = `/entities/organizations/${encodedName}?card_ids=fields`;
      
      const response = await this.makeRequest<{ data: CrunchbaseCompany }>(endpoint);
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  public async getFundingRounds(companyName: string): Promise<any[]> {
    try {
      const encodedName = encodeURIComponent(companyName);
      const endpoint = `/entities/organizations/${encodedName}?card_ids=raised_funding_rounds`;
      
      const response = await this.makeRequest<{ data: any }>(endpoint);
      return response.data.cards.raised_funding_rounds.edges || [];
    } catch (error) {
      console.error('Error fetching funding rounds:', error);
      return [];
    }
  }

  public async getCompetitors(companyName: string): Promise<any[]> {
    try {
      const encodedName = encodeURIComponent(companyName);
      const endpoint = `/entities/organizations/${encodedName}?card_ids=competitors`;
      
      const response = await this.makeRequest<{ data: any }>(endpoint);
      return response.data.cards.competitors.edges || [];
    } catch (error) {
      console.error('Error fetching competitors:', error);
      return [];
    }
  }
}

export const crunchbaseService = CrunchbaseService.getInstance();