const JUPITER_BASE = 'https://price.jup.ag/v6'

export interface JupiterPrice {
  data: Record<string, {
    id: string
    mintSymbol: string
    vsToken: string
    vsTokenSymbol: string
    price: number
  }>
  timeTaken: number
}

export async function getTokenPrice(mintAddress: string, vsToken: string = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'): Promise<number | null> {
  try {
    const url = `${JUPITER_BASE}/price?ids=${mintAddress}&vsToken=${vsToken}`
    const response = await fetch(url)
    if (!response.ok) return null
    const data: JupiterPrice = await response.json()
    if (data.data && data.data[mintAddress]) {
      return data.data[mintAddress].price
    }
    return null
  } catch (error) {
    console.error('Failed to fetch price from Jupiter:', error)
    return null
  }
}

export async function getMultipleTokenPrices(mintAddresses: string[], vsToken: string = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'): Promise<Record<string, number>> {
  const result: Record<string, number> = {}
  if (mintAddresses.length === 0) return result
  
  const ids = mintAddresses.join(',')
  try {
    const url = `${JUPITER_BASE}/price?ids=${ids}&vsToken=${vsToken}`
    const response = await fetch(url)
    if (!response.ok) return result
    const data: JupiterPrice = await response.json()
    if (data.data) {
      for (const [mint, info] of Object.entries(data.data)) {
        result[mint] = info.price
      }
    }
  } catch (error) {
    console.error('Failed to fetch multiple prices from Jupiter:', error)
  }
  return result
}
