export interface ICheckItems {
  server: 'eu' | 'us';
  platform: 'pc' | 'xb' | 'ps';
  items: Array<{ name: string; price: number }>;
}
