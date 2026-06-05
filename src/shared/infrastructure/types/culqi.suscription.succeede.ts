export interface DataSuscriptionSucceeded {
  object: string;
  id: string;
  creationDate: number;
  amount: number;
  amountRefunded: number;
  currentAmount: number;
  installments: number;
  installmentsAmount: number;
  currencyCode: string;
  email: string;
  description: string;
  source: Source;
  outcome: Outcome;
  fraudScore: number;
  antifraudDetails: AntifraudDetails;
  dispute: boolean;
  capture: boolean;
  partial: any;
  captureDate: number;
  referenceCode: string;
  authorizationCode: string;
  duplicated: boolean;
  metadata: Metadata3;
  totalFee: number;
  netAmount: number;
  feeDetails: FeeDetails;
  totalFeeTaxes: number;
  transferAmount: number;
  paid: boolean;
  statementDescriptor: string;
  transferId: any;
  paymentProcessorId: string;
  chargeHash: string;
  chargeFingerprint: string;
}

export interface Source {
  object: string;
  id: string;
  active: boolean;
  creationDate: number;
  customerId: string;
  source: Source2;
  metadata: Metadata2;
}

export interface Source2 {
  object: string;
  id: string;
  type: string;
  creationDate: number;
  email: string;
  cardNumber: string;
  lastFour: string;
  active: boolean;
  iin: Iin;
  client: Client;
  metadata: Metadata;
}

export interface Iin {
  bin: string;
  issuer: Issuer;
  object: string;
  cardType: string;
  cardBrand: string;
  cardCategory: string;
  installmentsAllowed: number[];
}

export interface Issuer {
  name: string;
  country: string;
  website: string;
  countryCode: string;
  phoneNumber: string;
}

export interface Client {
  ip: string;
  browser: string;
  ipCountry: string;
  deviceType: string;
  ipCountryCode: string;
  deviceFingerprint: string;
}

export interface Metadata {
  installments: number;
}

export interface Metadata2 {
  email: string;
  document_number: string;
}

export interface Outcome {
  type: string;
  code: string;
  merchantMessage: string;
  userMessage: string;
}

export interface AntifraudDetails {
  object: string;
  countryCode: string;
  firstName: string;
  lastName: string;
  addressCity: string;
  address: string;
  phone: string;
}

export interface Metadata3 {}

export interface FeeDetails {
  fixedFee: FixedFee;
  variableFee: VariableFee;
}

export interface FixedFee {
  amount: number;
  currencyCode: string;
  exchangeRate: number;
  exchangeRateCurrencyCode: string;
  total: number;
}

export interface VariableFee {
  currencyCode: string;
  commission: number;
  total: number;
}
