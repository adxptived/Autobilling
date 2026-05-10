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
  { brand: 'UnionPay', prefix: '623358637', length: 16 },
  // Well-known public Stripe test BINs (documented at https://stripe.com/docs/testing).
  // Useful for predictable QA flows and tax/region checks on sandbox checkouts.
  { brand: 'Visa', prefix: '424242', length: 16 },
  { brand: 'Mastercard', prefix: '555555', length: 16 },
  { brand: 'Mastercard', prefix: '222300', length: 16 },
  { brand: 'Amex', prefix: '378282', length: 15 },
  { brand: 'Discover', prefix: '601111', length: 16 },
  { brand: 'Diners', prefix: '305693', length: 14 },
  { brand: 'JCB', prefix: '353011', length: 16 },
  { brand: 'UnionPay', prefix: '620000', length: 16 },
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
  '623358637': { bank: 'China UnionPay', country: 'CN', countryName: 'China', type: 'DEBIT', category: 'STANDARD' },
  // Stripe public test BIN references (no real issuer — sandbox only).
  '424242': { bank: 'Stripe Test (Visa)', country: 'US', countryName: 'USA', type: 'CREDIT', category: 'TEST' },
  '555555': { bank: 'Stripe Test (Mastercard)', country: 'US', countryName: 'USA', type: 'CREDIT', category: 'TEST' },
  '222300': { bank: 'Stripe Test (Mastercard 2-BIN)', country: 'US', countryName: 'USA', type: 'CREDIT', category: 'TEST' },
  '378282': { bank: 'Stripe Test (Amex)', country: 'US', countryName: 'USA', type: 'CREDIT', category: 'TEST' },
  '601111': { bank: 'Stripe Test (Discover)', country: 'US', countryName: 'USA', type: 'CREDIT', category: 'TEST' },
  '305693': { bank: 'Stripe Test (Diners)', country: 'US', countryName: 'USA', type: 'CREDIT', category: 'TEST' },
  '353011': { bank: 'Stripe Test (JCB)', country: 'JP', countryName: 'Japan', type: 'CREDIT', category: 'TEST' },
  '620000': { bank: 'Stripe Test (UnionPay)', country: 'CN', countryName: 'China', type: 'CREDIT', category: 'TEST' },
};
