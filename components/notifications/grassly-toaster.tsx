'use client'

import { Toaster } from 'sileo'

export function GrasslyToaster() {
  return (
    <Toaster
      position="top-right"
      offset={{ top: 16, right: 16, left: 16 }}
      options={{
        fill: 'oklch(0.165 0.028 145)',
        roundness: 16,
        duration: 5200,
        styles: {
          title: 'font-sans font-bold normal-case! text-sidebar-foreground!',
          description: 'font-sans text-sidebar-foreground/70!',
          badge: 'bg-sidebar-foreground/10!',
          button: 'font-sans font-bold!',
        },
      }}
    />
  )
}
