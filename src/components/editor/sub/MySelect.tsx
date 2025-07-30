import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MySelectProps {
    placeholder?: string;
    selectItems?: { value: string; label: string }[];
    selectedValue?: string;
    dropDownWidth?:number;
    side?: 'bottom' | 'top' | 'left' | 'right';
    align?: 'start' | 'end' | 'center';
    onSelect?: (value: string) => void;
}

export function MySelect({
    placeholder,
    selectItems,
    selectedValue,
    dropDownWidth,
    side,
    align,
    onSelect,
}: MySelectProps) {
  return (
    <Select value={selectedValue} onValueChange={onSelect}>
      <SelectTrigger className="w-full text-neutral-300 text-sm font-normal" >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent side={side} align={align} className="h-[200px] bg-neutral-800" style={{ width: dropDownWidth ? `${dropDownWidth}px` : undefined }}>
        <SelectGroup >
            {selectItems?.map((item) => (
                <SelectItem
                className="hover:invert-10"
                key={item.value}
                value={item.value}
                >
                {item.label}
                </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
