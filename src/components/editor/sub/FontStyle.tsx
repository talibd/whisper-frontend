'use client'
import React, { useState } from 'react'
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from '@/components/ui/popover';
import { AlignCenter, CaseSensitive } from 'lucide-react';
import { FontSelect } from './FontSelect';
import { MySelect } from './MySelect';
import { Input } from '@/components/ui/input';



export default function FontStyle() {
    const [fontSize, setFontSize] = useState('16');
    const [fontWeight, setFontWeight] = useState('12');
    const fontWeights = [
        { value: '300', label: '300-Light' },
        { value: '400', label: '400-Regular' },
        { value: '500', label: '500-Medium' },
        { value: '600', label: '600-Semi-Bold' },
        { value: '700', label: '700-Bold' },
    ];
    return (
        <Popover>
            <PopoverTrigger className='w-full h-full cursor-pointer flex items-center justify-center'>
                <CaseSensitive size={25} />
            </PopoverTrigger>
            <PopoverContent align='center' side='left' sideOffset={20} className="w-[270px] p-4 pt-3 mt-10 rounded-2xl bg-neutral-800 border border-neutral-600 shadow-lg">
                {/* Add your font style options here */}
                <div className="text-neutral-300 text-sm mb-3">Typography</div>


                <div className="grid grid-cols-4 grid-rows-5 gap-4">
                    <div className='text-sm text-neutral-400 my-auto'>Font</div>
                    <div className="col-start-1 row-start-2 text-sm text-neutral-400 my-auto">Weight</div>
                    <div className="col-start-1 row-start-3 text-sm text-neutral-400 my-auto">Size</div>
                    <div className="col-start-1 row-start-4">4</div>
                    <div className="col-start-1 row-start-5">5</div>
                    <div className="col-span-3 col-start-2 row-start-1">
                        <FontSelect />
                    </div>
                    <div className="col-span-3 col-start-2 row-start-2">
                        <MySelect placeholder='select weight' selectItems={fontWeights} />
                    </div>
                    <div className="col-span-3 col-start-2 row-start-3 grid grid-cols-2 grid-rows-1 gap-2">
                        <div className=' relative '>
                            <span className=' absolute top-2  right-2 text-neutral-400 text-sm pointer-events-none'>PX</span>
                            <Input
                                type="number"
                                name='fontSize'
                                className="text-neutral-200 pr-7"
                                min="0"
                                max="999"
                                value={fontSize}
                                onChange={(e) => {
                                    const input = e.target.value.slice(0, 3);
                                    setFontSize(input);
                                }}
                            />

                        </div>
                         <div className=' relative '>
                            <span className=' absolute top-2  right-2 text-neutral-400 text-sm pointer-events-none'>PX</span>
                            <Input
                                type="number"
                                name='fontWeight'
                                className="text-neutral-200 pr-7"
                                min="0"
                                max="999"
                                value={fontWeight}
                                onChange={(e) => {
                                    const input = e.target.value.slice(0, 3);
                                    setFontWeight(input);
                                }}
                            />

                        </div>
                    </div>
                    <div className="col-span-3 col-start-2 row-start-4">9</div>
                    <div className="col-span-3 row-start-5">10</div>
                </div>


            </PopoverContent>
        </Popover>
    )
}
