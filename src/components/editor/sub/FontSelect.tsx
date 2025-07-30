'use client'

import react,{useEffect, useState} from 'react'
import axios from 'axios'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function FontSelect() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [fonts, setFonts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFonts() {
      try {
        const response = await axios.get(
          'https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyDMeLtGcregIBqn6BDB9vkJ2bqjZakOGrY'
        )
        const fontNames = response.data.items.map((font: any) => font.family)
        setFonts(fontNames.sort())
      } catch (error) {
        console.error('Error fetching fonts:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFonts()
  }, [])

  const handleFontSelect = (selectedFont: string) => {
    setValue(selectedFont === value ? '' : selectedFont)
    setOpen(false)

    const formattedFont = selectedFont.replace(/\s/g, '+')
    const existingLink = document.querySelector(`link[href*="${formattedFont}"]`)
    if (!existingLink) {
      const link = document.createElement('link')
      link.href = `https://fonts.googleapis.com/css2?family=${formattedFont}&display=swap`
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }

    const preview = document.getElementById('font-preview')
    if (preview) preview.style.fontFamily = `'${selectedFont}', sans-serif`
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-neutral-300 text-sm font-normal"
          >
            {value || 'Select font'}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={20}
          className="-mt-3  w-[220px] p-0"
        >
          <Command className="bg-neutral-800 MyScrollbar ">
            <CommandInput placeholder="Search font..." className="h-9" />
            <CommandList className=' '>
              {loading ? (
                <CommandEmpty>Loading fonts...</CommandEmpty>
              ) : (
                <>
                  <CommandEmpty>No font found.</CommandEmpty>
                  <CommandGroup>
                    {fonts.map((font) => (
                      <CommandItem
                      className='hover:invert-10'
                        key={font}
                        value={font}
                        onSelect={() => handleFontSelect(font)}
                      >
                        {font}
                        <Check
                          className={cn(
                            'ml-auto',
                            value === font ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* <div
        id="font-preview"
        className="mt-4 p-4 text-lg border rounded-md bg-neutral-800/20 text-white"
        style={{ fontFamily: value || 'inherit' }}
      >
        The quick brown fox jumps over the lazy dog.
      </div> */}
    </>
  )
}
