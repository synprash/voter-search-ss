export type LanguageMode = 'en' | 'mr' | 'bilingual';

export interface Voter {
  id: string;
  part_no: number;
  assembly_no: number;
  assembly_name_en: string;
  assembly_name_mr: string;
  parliamentary_no?: number;
  parliamentary_name_en?: string;
  parliamentary_name_mr?: string;
  polling_station_en: string;
  polling_station_mr: string;
  section_no: number;
  section_name_en: string;
  section_name_mr: string;
  serial_no: number;
  epic_no: string;
  voter_name_en: string;
  voter_name_mr: string;
  relation_type_en: string;
  relation_type_mr: string;
  relative_name_en: string;
  relative_name_mr: string;
  house_no: string;
  address_en: string;
  address_mr: string;
  age: number;
  gender_en: 'Male' | 'Female' | 'Third Gender';
  gender_mr: 'पुरुष' | 'महिला' | 'तृतीय पंथी';
  family_id: number;
  family_role_en: 'Head' | 'Spouse' | 'Son/Daughter' | 'Member';
  family_role_mr: 'प्रमुख' | 'पत्नी' | 'मुलगा/मुलगी' | 'सदस्य';
  photo_available: boolean;
  pdf_page_no: number;
  audit_notes?: string;
  mobile_no?: string;
}

export interface Booth {
  part_no: number;
  assembly_constituency_no: number;
  assembly_name_en: string;
  assembly_name_mr: string;
  parliamentary_constituency_no: number;
  parliamentary_name_en: string;
  parliamentary_name_mr: string;
  polling_station_name_en: string;
  polling_station_name_mr: string;
  polling_station_address_en: string;
  polling_station_address_mr: string;
  town_village_en: string;
  town_village_mr: string;
  taluka_en: string;
  taluka_mr: string;
  district_en: string;
  district_mr: string;
  pincode: string;
  total_electors: number;
  male_electors: number;
  female_electors: number;
  third_gender_electors: number;
}

export interface VoterFilters {
  query: string;
  partNo: number | 'all';
  gender: string;
  ageBracket: string;
  familyId: string;
}

export interface VoterStats {
  total: number;
  male: number;
  female: number;
  families: number;
  boothCount: number;
}
