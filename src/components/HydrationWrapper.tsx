// src/components/HydrationWrapper.tsx
'use client'
import { useEffect, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'

interface HydrationWrapperProps {
  children: React.ReactNode
}

export default function HydrationWrapper({ children }: HydrationWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Rehydrate the store
    if (typeof window !== 'undefined') {
      useEditorStore.persist.rehydrate()
    }
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    // Return a loading state or skeleton that matches your app
    return (
      <div className="grid grid-cols-9 grid-rows-5 bg-neutral-900 min-h-screen">
        {/* Skeleton layout */}
        <div className="col-span-2 row-span-5 bg-neutral-800 border-r border-neutral-700">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-700 rounded mt-3 mx-4"></div>
            <div className="mt-4 mx-3 space-y-4">
              <div className="h-24 bg-neutral-700 rounded"></div>
              <div className="h-24 bg-neutral-700 rounded"></div>
            </div>
          </div>
        </div>
        <div className="col-span-5 row-span-5 col-start-3 flex items-center justify-center">
          <div className="w-full aspect-[9/16] bg-neutral-700 animate-pulse rounded-xl max-w-md"></div>
        </div>
        <div className="col-span-2 row-span-5 col-start-8 p-3">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-neutral-700 rounded-2xl"></div>
            <div className="h-32 bg-neutral-700 rounded-2xl"></div>
            <div className="h-24 bg-neutral-700 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}