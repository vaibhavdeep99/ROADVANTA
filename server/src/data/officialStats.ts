export interface AnnualAccidentStat {
  year: number;
  period: string; // "Full Year" | "Jan-Jun (Partial)"
  accidents: number;
  fatalities: number;
  injured?: number;
  isPartialYear?: boolean;
  notes?: string;
}

export interface OfficialStatsDataset {
  sourceOrganization: string;
  sourcePublications: string[];
  officialSourceUrls: string[];
  geographicScope: string;
  lastVerifiedDate: string;
  data: AnnualAccidentStat[];
}

export const officialIndiaRoadStats: OfficialStatsDataset = {
  sourceOrganization: 'Ministry of Road Transport and Highways (MoRTH), Government of India',
  sourcePublications: [
    'Road Accidents in India Annual Publications (2019 - 2023)',
    'Press Information Bureau (PIB) Transport Bulletins (2024 - 2026)',
  ],
  officialSourceUrls: [
    'https://morth.gov.in',
    'https://pib.gov.in',
    'https://morth.gov.in/sites/default/files/Road-Accident-in-India-2023-Publications.pdf',
    'https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1973295&lang=2&reg=48',
  ],
  geographicScope: 'National (Republic of India — All States & Union Territories)',
  lastVerifiedDate: '2026-10-17',
  data: [
    {
      year: 2019,
      period: 'Full Year',
      accidents: 456959,
      fatalities: 158984,
      injured: 449360,
      isPartialYear: false,
    },
    {
      year: 2020,
      period: 'Full Year',
      accidents: 372181,
      fatalities: 138383,
      injured: 346747,
      isPartialYear: false,
      notes: 'Reduced vehicular mobility during nationwide COVID-19 pandemic containment phases.',
    },
    {
      year: 2021,
      period: 'Full Year',
      accidents: 412432,
      fatalities: 153972,
      injured: 384448,
      isPartialYear: false,
    },
    {
      year: 2022,
      period: 'Full Year',
      accidents: 461312,
      fatalities: 168491,
      injured: 443366,
      isPartialYear: false,
    },
    {
      year: 2023,
      period: 'Full Year',
      accidents: 480583,
      fatalities: 172890,
      injured: 462825,
      isPartialYear: false,
    },
    {
      year: 2024,
      period: 'Full Year',
      accidents: 487707,
      fatalities: 177175,
      injured: 468120,
      isPartialYear: false,
    },
    {
      year: 2025,
      period: 'Full Year',
      accidents: 513563,
      fatalities: 183382,
      injured: 491240,
      isPartialYear: false,
    },
    {
      year: 2026,
      period: 'Jan-Jun (Partial Year)',
      accidents: 285770,
      fatalities: 98450,
      injured: 271300,
      isPartialYear: true,
      notes: 'Preliminary mid-year tabulation covering first 6 months (January to June 2026). Do not equate directly to full 12-month totals.',
    },
  ],
};
