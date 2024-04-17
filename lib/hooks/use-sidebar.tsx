'use client'

import { createContext, useContext, useEffect, useState } from 'react'
// import { createContext } from 'vm'

const LOCAL_STORAGE_KEY = 'sidebar'

interface SidebarContext {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  isLoading: boolean
}

// const MySidebarContext = React.createContext<SidebarContext | undefined>(
//   undefined
// )
const MySidebarContext = createContext<SidebarContext | undefined>(undefined)

export function useSidebar() {
  const context = useContext(MySidebarContext)
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider')
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    const value = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (value) {
      setSidebarOpen(JSON.parse(value))
    }
    setLoading(false)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(value => {
      const newState = !value
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState))
      return newState
    })
  }

  if (isLoading) {
    return null
  }

  return (
    <MySidebarContext.Provider
      value={{ isSidebarOpen, toggleSidebar, isLoading }}
    >
      {children}
    </MySidebarContext.Provider>
  )
}
