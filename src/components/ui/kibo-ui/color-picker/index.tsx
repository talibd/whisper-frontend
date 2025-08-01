'use client';

import Color from 'color';
import { PipetteIcon } from 'lucide-react';
import { Slider } from 'radix-ui';
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ColorPickerContextValue {
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  mode: string;
  setHue: (hue: number) => void;
  setSaturation: (saturation: number) => void;
  setLightness: (lightness: number) => void;
  setAlpha: (alpha: number) => void;
  setMode: (mode: string) => void;
}

const ColorPickerContext = createContext<ColorPickerContextValue | undefined>(
  undefined
);

export const useColorPicker = () => {
  const context = useContext(ColorPickerContext);

  if (!context) {
    throw new Error('useColorPicker must be used within a ColorPickerProvider');
  }

  return context;
};

export type ColorPickerProps = HTMLAttributes<HTMLDivElement> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export const ColorPicker = ({
  value,
  defaultValue = '#ff0000',
  onChange,
  className,
  ...props
}: ColorPickerProps) => {
  // Initialize from value or defaultValue
  const initialColor = Color(value || defaultValue);
  
  const [hue, setHue] = useState(initialColor.hue() || 0);
  const [saturation, setSaturation] = useState(initialColor.saturationl());
  const [lightness, setLightness] = useState(initialColor.lightness());
  const [alpha, setAlpha] = useState(initialColor.alpha() * 100);
  const [mode, setMode] = useState('hex');

  // Update internal state when controlled value changes
  useEffect(() => {
    if (value) {
      try {
        const color = Color(value);
        setHue(color.hue() || 0);
        setSaturation(color.saturationl());
        setLightness(color.lightness());
        setAlpha(color.alpha() * 100);
      } catch (error) {
        console.warn('Invalid color value:', value);
      }
    }
  }, [value]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      try {
        const color = Color.hsl(hue, saturation, lightness).alpha(alpha / 100);
        onChange(color.hex());
      } catch (error) {
        console.warn('Error creating color:', error);
      }
    }
  }, [hue, saturation, lightness, alpha, onChange]);

  return (
    <ColorPickerContext.Provider
      value={{
        hue,
        saturation,
        lightness,
        alpha,
        mode,
        setHue,
        setSaturation,
        setLightness,
        setAlpha,
        setMode,
      }}
    >
      <div
        className={cn('flex size-full flex-col gap-4', className)}
        {...props}
      />
    </ColorPickerContext.Provider>
  );
};

export type ColorPickerSelectionProps = HTMLAttributes<HTMLDivElement>;

export const ColorPickerSelection = memo(
  ({ className, ...props }: ColorPickerSelectionProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const { hue, saturation, lightness, setSaturation, setLightness } = useColorPicker();

    // Calculate position from current saturation and lightness
    const positionX = saturation / 100;
    const positionY = 1 - (lightness / 100);

    const backgroundGradient = useMemo(() => {
      return `linear-gradient(0deg, rgba(0,0,0,1), rgba(0,0,0,0)),
            linear-gradient(90deg, rgba(255,255,255,1), rgba(255,255,255,0)),
            hsl(${hue}, 100%, 50%)`;
    }, [hue]);

    const handlePointerMove = useCallback(
      (event: PointerEvent) => {
        if (!(isDragging && containerRef.current)) {
          return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(
          0,
          Math.min(1, (event.clientX - rect.left) / rect.width)
        );
        const y = Math.max(
          0,
          Math.min(1, (event.clientY - rect.top) / rect.height)
        );
        
        setSaturation(x * 100);
        setLightness((1 - y) * 100);
      },
      [isDragging, setSaturation, setLightness]
    );

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      handlePointerMove(e.nativeEvent);
    }, [handlePointerMove]);

    useEffect(() => {
      const handlePointerUp = () => setIsDragging(false);

      if (isDragging) {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
      }

      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }, [isDragging, handlePointerMove]);

    return (
      <div
        className={cn('relative size-full cursor-crosshair rounded min-h-[200px]', className)}
        onPointerDown={handlePointerDown}
        ref={containerRef}
        style={{
          background: backgroundGradient,
        }}
        {...props}
      >
        <div
          className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white"
          style={{
            left: `${positionX * 100}%`,
            top: `${positionY * 100}%`,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    );
  }
);

ColorPickerSelection.displayName = 'ColorPickerSelection';

export type ColorPickerHueProps = ComponentProps<typeof Slider.Root>;

export const ColorPickerHue = ({
  className,
  ...props
}: ColorPickerHueProps) => {
  const { hue, setHue } = useColorPicker();

  return (
    <Slider.Root
      className={cn('relative flex h-4 w-full touch-none', className)}
      max={360}
      onValueChange={([hue]) => setHue(hue)}
      step={1}
      value={[hue]}
      {...props}
    >
      <Slider.Track className="relative my-0.5 h-3 w-full grow rounded-full bg-[linear-gradient(90deg,#FF0000,#FFFF00,#00FF00,#00FFFF,#0000FF,#FF00FF,#FF0000)]">
        <Slider.Range className="absolute h-full" />
      </Slider.Track>
      <Slider.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </Slider.Root>
  );
};

export type ColorPickerAlphaProps = ComponentProps<typeof Slider.Root>;

export const ColorPickerAlpha = ({
  className,
  ...props
}: ColorPickerAlphaProps) => {
  const { alpha, setAlpha, hue, saturation, lightness } = useColorPicker();

  const alphaGradient = useMemo(() => {
    const color = Color.hsl(hue, saturation, lightness);
    return `linear-gradient(90deg, ${color.alpha(0).rgb().string()}, ${color.alpha(1).rgb().string()})`;
  }, [hue, saturation, lightness]);

  return (
    <Slider.Root
      className={cn('relative flex h-4 w-full touch-none', className)}
      max={100}
      onValueChange={([alpha]) => setAlpha(alpha)}
      step={1}
      value={[alpha]}
      {...props}
    >
      <Slider.Track
        className="relative my-0.5 h-3 w-full grow rounded-full"
        style={{
          background:
            'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==") left center',
        }}
      >
        <div 
          className="absolute inset-0 rounded-full" 
          style={{ background: alphaGradient }}
        />
        <Slider.Range className="absolute h-full rounded-full bg-transparent" />
      </Slider.Track>
      <Slider.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </Slider.Root>
  );
};

export type ColorPickerEyeDropperProps = ComponentProps<typeof Button>;

export const ColorPickerEyeDropper = ({
  className,
  ...props
}: ColorPickerEyeDropperProps) => {
  const { setHue, setSaturation, setLightness, setAlpha } = useColorPicker();

  const handleEyeDropper = async () => {
    try {
      // @ts-expect-error - EyeDropper API is experimental
      if (!window.EyeDropper) {
        alert('EyeDropper API is not supported in this browser');
        return;
      }
      
      // @ts-expect-error - EyeDropper API is experimental
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const color = Color(result.sRGBHex);
      
      setHue(color.hue() || 0);
      setSaturation(color.saturationl());
      setLightness(color.lightness());
      setAlpha(color.alpha() * 100);
    } catch (error) {
      console.error('EyeDropper failed:', error);
    }
  };

  return (
    <Button
      className={cn('shrink-0 text-muted-foreground', className)}
      onClick={handleEyeDropper}
      size="icon"
      variant="outline"
      type="button"
      {...props}
    >
      <PipetteIcon size={16} />
    </Button>
  );
};

export type ColorPickerOutputProps = ComponentProps<typeof SelectTrigger>;

const formats = ['hex', 'rgb', 'css', 'hsl'];

export const ColorPickerOutput = ({
  className,
  ...props
}: ColorPickerOutputProps) => {
  const { mode, setMode } = useColorPicker();

  return (
    <Select onValueChange={setMode} value={mode}>
      <SelectTrigger className="h-8 w-20 shrink-0 text-xs" {...props}>
        <SelectValue placeholder="Mode" />
      </SelectTrigger>
      <SelectContent>
        {formats.map((format) => (
          <SelectItem className="text-xs" key={format} value={format}>
            {format.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

type PercentageInputProps = ComponentProps<typeof Input>;

const PercentageInput = ({ className, ...props }: PercentageInputProps) => {
  return (
    <div className="relative">
      <Input
        readOnly
        type="text"
        {...props}
        className={cn(
          'h-8 w-[3.25rem] rounded-l-none bg-secondary px-2 text-xs shadow-none',
          className
        )}
      />
      <span className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground text-xs">
        %
      </span>
    </div>
  );
};

export type ColorPickerFormatProps = HTMLAttributes<HTMLDivElement>;

export const ColorPickerFormat = ({
  className,
  ...props
}: ColorPickerFormatProps) => {
  const { hue, saturation, lightness, alpha, mode } = useColorPicker();
  
  const color = useMemo(() => {
    try {
      return Color.hsl(hue, saturation, lightness).alpha(alpha / 100);
    } catch (error) {
      return Color('#000000');
    }
  }, [hue, saturation, lightness, alpha]);

  if (mode === 'hex') {
    const hex = color.hex();

    return (
      <div
        className={cn(
          '-space-x-px relative flex w-full items-center rounded-md shadow-sm',
          className
        )}
        {...props}
      >
        <Input
          className="h-8 rounded-r-none bg-secondary px-2 text-xs shadow-none"
          readOnly
          type="text"
          value={hex}
        />
        <PercentageInput value={Math.round(alpha)} />
      </div>
    );
  }

  if (mode === 'rgb') {
    const rgb = color
      .rgb()
      .array()
      .map((value) => Math.round(value));

    return (
      <div
        className={cn(
          '-space-x-px flex items-center rounded-md shadow-sm',
          className
        )}
        {...props}
      >
        {rgb.map((value, index) => (
          <Input
            className={cn(
              'h-8 w-12 bg-secondary px-2 text-xs shadow-none',
              index === 0 ? 'rounded-r-none' : index === rgb.length - 1 ? 'rounded-l-none' : 'rounded-none'
            )}
            key={index}
            readOnly
            type="text"
            value={value}
          />
        ))}
        <PercentageInput value={Math.round(alpha)} />
      </div>
    );
  }

  if (mode === 'css') {
    const rgb = color
      .rgb()
      .array()
      .map((value) => Math.round(value));

    return (
      <div className={cn('w-full rounded-md shadow-sm', className)} {...props}>
        <Input
          className="h-8 w-full bg-secondary px-2 text-xs shadow-none"
          readOnly
          type="text"
          value={`rgba(${rgb.join(', ')}, ${(alpha / 100).toFixed(2)})`}
        />
      </div>
    );
  }

  if (mode === 'hsl') {
    const hsl = [
      Math.round(hue),
      Math.round(saturation),
      Math.round(lightness)
    ];

    return (
      <div
        className={cn(
          '-space-x-px flex items-center rounded-md shadow-sm',
          className
        )}
        {...props}
      >
        {hsl.map((value, index) => (
          <Input
            className={cn(
              'h-8 w-12 bg-secondary px-2 text-xs shadow-none',
              index === 0 ? 'rounded-r-none' : index === hsl.length - 1 ? 'rounded-l-none' : 'rounded-none'
            )}
            key={index}
            readOnly
            type="text"
            value={value}
          />
        ))}
        <PercentageInput value={Math.round(alpha)} />
      </div>
    );
  }

  return null;
};