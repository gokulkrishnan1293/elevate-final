import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  CheckIcon,
  XCircle,
  ChevronDown,
  XIcon,
  WandSparkles,
} from "lucide-react";
import { Control, Controller, FieldValues, Path, FieldErrors, ControllerRenderProps } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label"; // Import Label

/**
 * Variants for the multi-select component badges.
 */
const multiSelectVariants = cva(
  "m-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300",
  {
    variants: {
      variant: {
        default:
          "border-foreground/10 text-foreground bg-card hover:bg-card/80",
        secondary:
          "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        inverted: "inverted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// MultiSelectInput: The core presentational component.
interface MultiSelectInputProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange'>,
    VariantProps<typeof multiSelectVariants> {
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  name?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  placeholder?: string;
  animation?: number;
  maxCount?: number;
  modalPopover?: boolean;
  asChild?: boolean;
  className?: string;
  disabled?: boolean;
}

const MultiSelectInput = React.forwardRef<
  HTMLButtonElement,
  MultiSelectInputProps
>(
  (
    {
      value: selectedValues = [],
      onChange,
      onBlur,
      name,
      options,
      placeholder = "Select options",
      animation = 0,
      maxCount = 3,
      modalPopover = false,
      asChild = false,
      className,
      variant,
      disabled,
      ...buttonProps
    },
    ref
  ) => {
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const commandInputRef = React.useRef<HTMLInputElement>(null); // Ref for CommandInput

    const handleInputKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (disabled) return;
      if (event.key === "Enter") {
        setIsPopoverOpen(true);
      } else if (event.key === "Backspace" && !event.currentTarget.value) {
        const newSelectedValues = [...selectedValues];
        newSelectedValues.pop();
        onChange(newSelectedValues);
      }
    };

    const toggleOption = (optionValue: string) => {
      console.log("Toggling option:", optionValue,disabled,selectedValues);
      if (disabled) return;
      const newSelectedValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newSelectedValues);
    };

    const handleClear = () => {
      console.log("Toggling option:",disabled);
      if (disabled) return;
      onChange([]);
    };

    const handleTogglePopover = () => {
      if (disabled) return;
      setIsPopoverOpen((prev) => !prev);
    };

    const clearExtraOptions = () => {
      if (disabled) return;
      const newSelectedValues = selectedValues.slice(0, maxCount);
      onChange(newSelectedValues);
    };

    const toggleAll = () => {
      if (disabled) return;
      if (selectedValues.length === options.length) {
        handleClear();
      } else {
        const allOptionValues = options.map((option) => option.value);
        onChange(allOptionValues);
      }
    };

    return (
      <>
        <Popover
          open={isPopoverOpen}
          onOpenChange={(open) => {
            if (disabled) return; // Prevent state change if disabled
            setIsPopoverOpen(open);
          }}
          modal={modalPopover}
        >
          <PopoverTrigger asChild={true} disabled={disabled}>
            <Button
              ref={ref}
              {...buttonProps}
              name={name} // Pass name for potential label association if used standalone
              id={name} // Ensure button has an id for the label's htmlFor
              onClick={handleTogglePopover}
              disabled={disabled}
              className={cn(
                "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto",
                className,
                disabled && "cursor-not-allowed opacity-50"
              )}
              aria-expanded={isPopoverOpen}
            >
              {selectedValues.length > 0 ? (
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-wrap items-center">
                    {selectedValues.slice(0, maxCount).map((val) => {
                      const option = options.find((o) => o.value === val);
                      const IconComponent = option?.icon;
                      return (
                        <Badge
                          key={val}
                          className={cn(
                            isAnimating ? "animate-bounce" : "",
                            multiSelectVariants({ variant })
                          )}
                          style={{ animationDuration: `${animation}s` }}
                        >
                          {IconComponent && (
                            <IconComponent className="h-4 w-4 mr-2" />
                          )}
                          {option?.label}
                          <XCircle
                            className="ml-2 h-4 w-4 cursor-pointer"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleOption(val);
                            }}
                          />
                        </Badge>
                      );
                    })}
                    {selectedValues.length > maxCount && (
                      <Badge
                        className={cn(
                          "bg-transparent text-foreground border-foreground/1 hover:bg-transparent",
                          isAnimating ? "animate-bounce" : "",
                          multiSelectVariants({ variant })
                        )}
                        style={{ animationDuration: `${animation}s` }}
                      >
                        {`+ ${selectedValues.length - maxCount} more`}
                        <XCircle
                          className="ml-2 h-4 w-4 cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation();
                            clearExtraOptions();
                          }}
                        />
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <XIcon
                      className="h-4 mx-2 cursor-pointer text-muted-foreground"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleClear();
                      }}
                    />
                    <Separator
                      orientation="vertical"
                      className="flex min-h-6 h-full"
                    />
                    <ChevronDown className="h-4 mx-2 cursor-pointer text-muted-foreground" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full mx-auto">
                  <span className="text-sm text-muted-foreground mx-3">
                    {placeholder}
                  </span>
                  <ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
                </div>
              )}
            </Button>
          </PopoverTrigger>
            <PopoverContent
            className="min-w-0 w-full max-w-full p-0"
            align="start"
            onEscapeKeyDown={() => !disabled && setIsPopoverOpen(false)}
            onOpenAutoFocus={(e) => {
              // When the popover opens, explicitly focus the CommandInput.
              // Prevent default Radix auto-focus to take manual control.
              if (commandInputRef.current) {
                e.preventDefault();
                commandInputRef.current.focus();
              }
            }}
            >
            <Command>
              <CommandInput
                ref={commandInputRef} // Assign ref to CommandInput
                placeholder="Search..."
                // onKeyDown for CommandInput is handled by cmdk itself for search,
                // handleInputKeyDown was for the trigger button's behavior.
                disabled={disabled}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    key="all"
                    onSelect={toggleAll}
                    disabled={disabled}
                    className={cn("cursor-pointer", disabled && "cursor-not-allowed opacity-50")}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        selectedValues.length === options.length
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </div>
                    <span>(Select All)</span>
                  </CommandItem>
                  {options.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => toggleOption(option.value)}
                        disabled={disabled}
                        className={cn("cursor-pointer", disabled && "cursor-not-allowed opacity-50")}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </div>
                        {option.icon && (
                          <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <div className="flex items-center justify-between">
                    {selectedValues.length > 0 && (
                      <>
                        <CommandItem
                          onSelect={handleClear}
                          disabled={disabled}
                          className={cn("flex-1 justify-center cursor-pointer", disabled && "cursor-not-allowed opacity-50")}
                        >
                          Clear
                        </CommandItem>
                        <Separator
                          orientation="vertical"
                          className="flex min-h-6 h-full"
                        />
                      </>
                    )}
                    <CommandItem
                      onSelect={() => !disabled && setIsPopoverOpen(false)}
                      disabled={disabled}
                      className={cn("flex-1 justify-center cursor-pointer", disabled && "cursor-not-allowed opacity-50")}
                    >
                      Close
                    </CommandItem>
                  </div>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {animation > 0 && selectedValues.length > 0 && (
          <WandSparkles
            className={cn(
              "cursor-pointer my-2 text-foreground bg-background w-3 h-3",
              isAnimating ? "" : "text-muted-foreground",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => !disabled && setIsAnimating(!isAnimating)}
          />
        )}
      </>
    );
  }
);
MultiSelectInput.displayName = "MultiSelectInput";

/**
 * Props for the MultiSelectFormField component (react-hook-form wrapper)
 */
interface MultiSelectFormFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<MultiSelectInputProps, 'value' | 'onChange' | 'onBlur' | 'name' | 'ref'> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string; // Label is now mandatory for the wrapper
  errors?: FieldErrors<TFieldValues>;
  containerClassName?: string;
  // `disabled` prop is inherited and will be used by Controller and passed to MultiSelectInput
}

export function MultiSelectFormField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  errors,
  containerClassName = "space-y-1", // Default container class
  disabled, // Field-level disabled state
  className, // className for the MultiSelectInput's button
  options,
  placeholder,
  animation,
  maxCount,
  modalPopover,
  asChild,
  variant,
  ...rest // other native button props from MultiSelectInputProps for the <Button />
}: MultiSelectFormFieldProps<TFieldValues>) {
  const error = errors?.[name]?.message as string | undefined;

  return (
    <div className={containerClassName}>
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        disabled={disabled} // Pass field-level disabled to Controller
        render={({ field, fieldState }: { field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>, fieldState: any }) => (
          <MultiSelectInput
            ref={field.ref}
            name={field.name} // RHF field name, also used as id for label
            value={Array.isArray(field.value) ? field.value : []}
            onChange={field.onChange}
            onBlur={field.onBlur}
            options={options}
            placeholder={placeholder}
            animation={animation}
            maxCount={maxCount}
            modalPopover={modalPopover}
            asChild={asChild}
            variant={variant}
            // Pass the className for the button, and add error styling
            className={cn(className, fieldState.error && "border-destructive focus:border-destructive")}
            disabled={field.disabled} // RHF's disabled state for the input
            {...rest}
          />
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
// MultiSelectFormField.displayName = "MultiSelectFormField"; // Optional: if needed
