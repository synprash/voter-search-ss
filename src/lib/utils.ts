import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Voter } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function exportVotersToCsv(voters: Voter[], filename = 'voter-search-results.csv') {
  if (!voters.length) return;

  const headers = [
    'Part No',
    'Family ID',
    'Serial No',
    'Voter Name (EN)',
    'Voter Name (MR)',
    'Relation Type',
    'Relative Name (EN)',
    'Relative Name (MR)',
    'EPIC No',
    'Age',
    'Gender',
    'Family Role',
    'Address (EN)',
    'Address (MR)',
    'Polling Station'
  ];

  const escapeCsv = (val: unknown) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = voters.map((v) => [
    v.part_no,
    v.family_id,
    v.serial_no,
    escapeCsv(v.voter_name_en),
    escapeCsv(v.voter_name_mr),
    escapeCsv(v.relation_type_en),
    escapeCsv(v.relative_name_en),
    escapeCsv(v.relative_name_mr),
    escapeCsv(v.epic_no),
    v.age,
    escapeCsv(v.gender_en),
    escapeCsv(v.family_role_en),
    escapeCsv(v.address_en),
    escapeCsv(v.address_mr),
    escapeCsv(v.polling_station_en)
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
