"use client";

import React from "react";
import { Controller, Control, FieldErrors, Path, ControllerRenderProps, FieldValues } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";

interface FormFieldSelectProps<TFieldValues extends FieldValues> extends Omit<React.ComponentProps<typeof SelectPrimitive.Root>, 'name' | 'onValueChange' | 'value'> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  errors?: FieldErrors<TFieldValues>;
  isLoading?: boolean;
  loadingMessage?: string;
  noOptionsMessage?: string;
  containerClassName?: string;
}

export function FormFieldSelect<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
  errors,
  isLoading = false,
  loadingMessage = "Loading...",
  noOptionsMessage = "No options available",
  containerClassName = "space-y-1",
  ...selectProps
}: FormFieldSelectProps<TFieldValues>) {
  const error = errors?.[name]?.message as string | undefined;

  return (
    <div className={containerClassName}>
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }: { field: ControllerRenderProps<TFieldValues, Path<TFieldValues>> }) => (
          <Select
            onValueChange={field.onChange}
            value={field.value || ""}
            disabled={isLoading || selectProps.disabled}
            {...selectProps}
          >
            <SelectTrigger id={name} className="w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"> {/* Added min-w-0 and overflow handling */}
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>{loadingMessage}</SelectItem>
              ) : options.length === 0 ? (
                <SelectItem value="no-options" disabled>{noOptionsMessage}</SelectItem>
              ) : (
                options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
