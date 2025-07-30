'use client';

import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { HexColorPicker, RgbaColorPicker } from "react-colorful";
import { Input } from '../../ui/input';

interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface MyColorPickerProps {
  color: RGBAColor;
  onChange: (color: RGBAColor) => void;
}

export default function MyColorPicker({ color, onChange }: MyColorPickerProps) {
  const [hexInput, setHexInput] = useState('');

  // Convert RGBA color to CSS string for display
  const colorString = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

  // Convert RGBA to hex
  const rgbaToHex = (rgba: RGBAColor): string => {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
  };

  // Convert hex to RGBA
  const hexToRgba = (hex: string): RGBAColor | null => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle 3-digit hex
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    // Validate hex format
    if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return null;
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b, a: color.a }; // Preserve alpha
  };

  // Update hex input when color changes
  useEffect(() => {
    setHexInput(rgbaToHex(color));
  }, [color]);

  // Handle hex input change
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexInput(value);
    
    const rgbaColor = hexToRgba(value);
    if (rgbaColor) {
      onChange(rgbaColor);
    }
  };

  // Handle hex input blur (validate and correct if needed)
  const handleHexInputBlur = () => {
    const rgbaColor = hexToRgba(hexInput);
    if (!rgbaColor) {
      // Reset to current color if invalid
      setHexInput(rgbaToHex(color));
    }
  };

  return (
    <Popover>
        <div className='relative'>
          <PopoverTrigger asChild>
        <div
          className="w-6 h-6 absolute top-[6px] left-2 rounded-full border-2 border-white cursor-pointer shadow-md  transition-transform"
          style={{ backgroundColor: colorString }}
          title="Click to pick a color"
        />
      </PopoverTrigger>
        <Input
              type="text"
              value={hexInput}
              onChange={handleHexInputChange}
              onBlur={handleHexInputBlur}
              placeholder="#ffffff"
              className="pl-10  text-sm "
              maxLength={7}
            />
        </div>

      <PopoverContent align='center' side='right' sideOffset={190} className="w-fit p-4 mt-10 bg-neutral-800 border border-neutral-600 shadow-lg">
        <div className="space-y-4">
          {/* RGBA Color Picker */}
          <RgbaColorPicker color={color} onChange={onChange} />
          
          {/* Hex Input */}
          {/* <div className="space-y-2">
            
            <Input
              type="text"
              value={hexInput}
              onChange={handleHexInputChange}
              onBlur={handleHexInputBlur}
              placeholder="#ffffff"
              className="w-full px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={7}
            />
          </div> */}
          
          {/* Color Preview */}
          {/* <div className="flex items-center justify-between text-sm text-neutral-300">
            <span>Preview:</span>
            <div className="flex items-center space-x-2">
              <div
                className="w-6 h-6 rounded border border-neutral-600"
                style={{ backgroundColor: colorString }}
              />
              <span className="font-mono text-xs">{colorString}</span>
            </div>
          </div> */}
        </div>
      </PopoverContent>
    </Popover>
  );
}