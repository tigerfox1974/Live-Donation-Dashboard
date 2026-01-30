import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from './ui/Button';
interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}
export function Stepper({ value, onChange, min = 1, max = 99 }: StepperProps) {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };
  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };
  return (
    <div className="flex items-center space-x-4">
      <Button
        variant="outline"
        size="lg"
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-16 h-16 rounded-full border-2"
        type="button">

        <Minus className="w-8 h-8" />
      </Button>

      <div className="flex-1 text-center">
        <span className="text-6xl font-bold text-[#1e3a5f] tabular-nums">
          {value}
        </span>
      </div>

      <Button
        variant="outline"
        size="lg"
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-16 h-16 rounded-full border-2"
        type="button">

        <Plus className="w-8 h-8" />
      </Button>
    </div>);

}