'use client';

import React, { useState } from 'react';
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from '@/components/ui/kibo-ui/color-picker';

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

export default function MyColorPicker() {
  const [color, setColor] = useState<string>('#ff0000');

  const handleColorChange = (val: any) => {
    if (typeof val === 'string' && val.startsWith('#')) {
      setColor(val);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className="w-8 h-8 rounded-full border cursor-pointer"
          style={{ backgroundColor: color }}
          title="Click to pick a color"
        />
      </PopoverTrigger>

      <PopoverContent className="w-[250px] h-[300px] p-0 bg-neutral-800 border shadow-md">
        <ColorPicker
          value={color}
          onChange={handleColorChange}
          className="max-w-sm p-4"
        >
          <ColorPickerSelection />
          <div className="flex items-center gap-4 mt-2">
            <ColorPickerEyeDropper />
            <div className="grid w-full gap-1">
              <ColorPickerHue />
              <ColorPickerAlpha />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <ColorPickerOutput />
            <ColorPickerFormat />
          </div>
        </ColorPicker>
      </PopoverContent>
    </Popover>
  );
}
