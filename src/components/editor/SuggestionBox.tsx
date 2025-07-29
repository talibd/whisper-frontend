import React from 'react'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'

export default function SuggestionBox() {
  return (
    <div className='mt-auto p-3 bg-neutral-800 rounded-2xl '>
        <form>
            <label htmlFor="suggestion" className="text-neutral-400 text-sm">Got a suggestion?</label>
            <Textarea 
                id="suggestion"
                placeholder="Let us know how we can improve." 
                className="mt-2 bg-neutral-700/70 border-neutral-600 focus:ring-white"
            />
            <Button type="submit" className="mt-3 w-full">Send suggestion</Button>
        </form>
    </div>
  )
}
