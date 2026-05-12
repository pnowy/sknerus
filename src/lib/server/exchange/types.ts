export interface ExchangeRateProvider {
  fetchRate(date: string, from: string, to: string): Promise<number>
}
