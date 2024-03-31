export interface IPriceData {
  id: string;
  lastSeen: string | null | undefined;
  guildName: string | null | undefined;
  location: string | null | undefined;
  playerID: string | null | undefined;
  itemName: string | null | undefined;
  totalPrice: number;
  unitPrice: number;
  amount: number;
}
