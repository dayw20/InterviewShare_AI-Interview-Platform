import React, { useState, FormEvent } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export function DatePicker({ value, onChange }: { value: string, onChange: (date: string) => void }) {
  const [date, setDate] = useState<Date | undefined>(value ? new Date(value) : undefined);

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      onChange(format(newDate, "yyyy-MM-dd")); 
    } else {
      onChange('');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[100px] justify-start text-left font-normal"
        >
          {/* Smaller calendar icon */}
          <CalendarIcon className="h-3 w-3" />
          {/* Display formatted date or placeholder */}
          {date ? format(date, "PPP") : <span>date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
