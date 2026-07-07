import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { useMarketStore } from '@/store/marketStore'

export default function Layout() {
  const { fetchRealPrices, updatePrices } = useMarketStore()

  useEffect(() => {
    fetchRealPrices()

    const priceInterval = setInterval(() => {
      updatePrices()
    }, 3000)

    const realPriceInterval = setInterval(() => {
      fetchRealPrices()
    }, 30000)

    return () => {
      clearInterval(priceInterval)
      clearInterval(realPriceInterval)
    }
  }, [fetchRealPrices, updatePrices])

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
