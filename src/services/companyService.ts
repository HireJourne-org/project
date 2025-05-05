import { supabase } from './supabaseService';
import { crunchbaseService } from './crunchbaseService';

interface Competitor {
  name: string;
  url?: string;
  description?: string;
}

interface Technology {
  name: string;
  category: string;
  description?: string;
}

interface FundingRound {
  date: string;
  round: string;
  amount: number;
  investors: string[];
}

interface Company {
  id?: string;
  submission_id: string;
  company_summary?: string;
  market_map?: Competitor[];
  tech_stack?: Technology[];
  funding_rounds?: FundingRound[];
  due_diligence_notes?: string;
  created_at?: string;
}

export const createCompany = async (data: Omit<Company, 'id' | 'created_at'>) => {
  const { data: result, error } = await supabase
    .from('companies')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating company:', error);
    throw error;
  }

  return result;
};

export const getCompany = async (submissionId: string) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('submission_id', submissionId)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    throw error;
  }

  return data;
};

export const updateCompany = async (id: string, updates: Partial<Company>) => {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    throw error;
  }

  return data;
};

export const fetchCompanyData = async (companyName: string): Promise<Partial<Company>> => {
  try {
    // Fetch company data from Crunchbase
    const company = await crunchbaseService.getCompanyByName(companyName);
    
    if (!company) {
      throw new Error(`Company "${companyName}" not found in Crunchbase`);
    }

    // Fetch additional data in parallel
    const [fundingRounds, competitors] = await Promise.all([
      crunchbaseService.getFundingRounds(companyName),
      crunchbaseService.getCompetitors(companyName)
    ]);

    // Transform funding rounds data
    const transformedFundingRounds: FundingRound[] = fundingRounds.map(round => ({
      date: round.node.announced_on,
      round: round.node.investment_type,
      amount: round.node.money_raised?.value || 0,
      investors: round.node.investors?.map((inv: any) => inv.name) || []
    }));

    // Transform competitors data
    const transformedCompetitors: Competitor[] = competitors.map(comp => ({
      name: comp.node.name,
      url: comp.node.website_url,
      description: comp.node.short_description
    }));

    // Construct company summary
    const summary = [
      `${companyName} - ${company.properties.description || 'No description available'}`,
      `Founded: ${company.properties.founded_on || 'Unknown'}`,
      `Employees: ${company.properties.num_employees_enum || 'Unknown'}`,
      `Website: ${company.properties.website_url || 'Not available'}`,
      `LinkedIn: ${company.properties.linkedin_url || 'Not available'}`
    ].join('\n\n');

    // Construct due diligence notes
    const dueDigilence = [
      '## Company Overview',
      company.properties.description || 'No description available',
      '\n## Key Metrics',
      `- Founded: ${company.properties.founded_on || 'Unknown'}`,
      `- Size: ${company.properties.num_employees_enum || 'Unknown'} employees`,
      `- Total Funding: ${company.properties.funding_total?.value || 0} ${company.properties.funding_total?.currency || 'USD'}`,
      '\n## Online Presence',
      `- Website: ${company.properties.website_url || 'Not available'}`,
      `- LinkedIn: ${company.properties.linkedin_url || 'Not available'}`
    ].join('\n');

    return {
      company_summary: summary,
      market_map: transformedCompetitors,
      funding_rounds: transformedFundingRounds,
      due_diligence_notes: dueDigilence
    };
  } catch (error) {
    console.error('Error fetching company data:', error);
    // Return basic structure with error information
    return {
      company_summary: `Unable to fetch detailed information for ${companyName}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      market_map: [],
      funding_rounds: [],
      due_diligence_notes: 'Data fetch failed - please try again later'
    };
  }
};

export const enrichCompanyData = async (submissionId: string, companyName: string) => {
  try {
    // Fetch enriched data from Crunchbase
    const enrichedData = await fetchCompanyData(companyName);

    // Create or update company record
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('submission_id', submissionId)
      .single();

    let companyId;
    
    if (existingCompany) {
      // Update existing company
      const { data: updatedCompany } = await supabase
        .from('companies')
        .update(enrichedData)
        .eq('id', existingCompany.id)
        .select('id')
        .single();
      
      companyId = updatedCompany?.id || existingCompany.id;
    } else {
      // Create new company
      const { data: newCompany } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          submission_id: submissionId,
          ...enrichedData
        })
        .select('id')
        .single();
      
      companyId = newCompany?.id;
    }

    // Update the submission to reference the company
    if (companyId) {
      await supabase
        .from('submissions')
        .update({ company_id: companyId })
        .eq('submission_id', submissionId);
    }

    return companyId;
  } catch (error) {
    console.error('Error enriching company data:', error);
    throw error;
  }
};