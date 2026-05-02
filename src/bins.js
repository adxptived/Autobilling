// Autobilling BIN data

var BINS = [
  { brand: 'Mastercard', prefix: '515462002112', length: 16 },
  { brand: 'Mastercard', prefix: '5154620022', length: 16 },
  { brand: 'Mastercard', prefix: '515462', length: 16 },
  { brand: 'Mastercard', prefix: '559888039', length: 16 },
  { brand: 'Mastercard', prefix: '559888', length: 16 },
  { brand: 'Mastercard', prefix: '528929', length: 16 },
  { brand: 'Mastercard', prefix: '537100', length: 16 },
  { brand: 'Visa', prefix: '409636', length: 16 },
];

var BIN_DB = {
  '515462002112': { bank: 'The Bancorp Bank', country: 'US', countryName: 'USA', type: 'DEBIT', category: 'GIFT' },
  '5154620022': { bank: 'The Bancorp Bank', country: 'US', countryName: 'USA', type: 'DEBIT', category: 'GIFT' },
  '515462': { bank: 'The Bancorp Bank', country: 'US', countryName: 'USA', type: 'DEBIT', category: 'GIFT' },
  '559888039': { bank: 'Bangkok Bank', country: 'TH', countryName: 'Thailand', type: 'DEBIT', category: 'STANDARD' },
  '559888': { bank: 'Bangkok Bank', country: 'TH', countryName: 'Thailand', type: 'DEBIT', category: 'STANDARD' },
  '528929': { bank: 'Scotiabank (Barbados)', country: 'BB', countryName: 'Barbados', type: 'DEBIT', category: 'PLATINUM' },
  '537100': { bank: 'Sutton Bank', country: 'US', countryName: 'USA', type: 'CREDIT', category: 'CORPORATE PURCHASING' },
  '409636': { bank: 'DBS Bank', country: 'SG', countryName: 'Singapore', type: 'DEBIT', category: 'BUSINESS ENHANCED' },
};

