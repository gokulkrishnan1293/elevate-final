"use client";

import React from "react";
import { Controller, Control, FieldErrors, Path, ControllerRenderProps, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldInputProps<TFieldValues extends FieldValues> extends Omit<React.ComponentProps<"input">, 'name'> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  errors?: FieldErrors<TFieldValues>;
  containerClassName?: string;
}

export function FormFieldInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  errors,
  containerClassName = "space-y-1",
  ...inputProps
}: FormFieldInputProps<TFieldValues>) {
  const error = errors?.[name]?.message as string | undefined;
  
  return (
    <div className={containerClassName}>
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }: { field: ControllerRenderProps<TFieldValues, Path<TFieldValues>> }) => (
          <Input id={name} {...field} {...inputProps} value={field.value || ""} />
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
