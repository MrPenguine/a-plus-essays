export interface Country {
  name: string;
  phone: number[];
  code: string;
  emoji: string;
}

export type TCountries = {
  [key: string]: Country;
} 