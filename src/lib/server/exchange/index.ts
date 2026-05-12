import { ExchangeProvider } from '@/lib/shared/types/exchange-provider'
import type { Config } from '@/lib/shared/types/expense'
import { ExchangeRateApiProvider } from './exchangerate-api'
import { FrankfurterProvider } from './frankfurter'
import type { ExchangeRateProvider } from './types'

export function createExchangeProvider(config: Config): ExchangeRateProvider {
  switch (config.exchangeProvider) {
    case ExchangeProvider.ExchangeRateApi: {
      const apiKey = config.exchangeApiKey || process.env.EXCHANGE_RATE_API_KEY
      if (!apiKey) throw new Error('ExchangeRate-API key is not configured')
      return new ExchangeRateApiProvider(apiKey)
    }
    default:
      return new FrankfurterProvider()
  }
}

export type { ExchangeRateProvider }
