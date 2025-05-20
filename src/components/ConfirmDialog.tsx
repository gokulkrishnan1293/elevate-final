"use client";

import React, { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: string | ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  confirmButtonVariant?: VariantProps<typeof buttonVariants>['variant'];
  cancelText?: string;
  cancelButtonVariant?: VariantProps<typeof buttonVariants>['variant'];
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirm",
  confirmButtonVariant = "default",
  cancelText = "Cancel",
  cancelButtonVariant = "outline",
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    // Parent will control closing by setting isOpen to false via onOpenChange or directly
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {typeof description === 'string' ? (
            <DialogDescription>{description}</DialogDescription>
          ) : (
            description
          )}
        </DialogHeader>
        <DialogFooter className="mt-4">
          {/* DialogClose will call onOpenChange(false) */}
          <DialogClose asChild> 
            <Button variant={cancelButtonVariant} disabled={isLoading}>
              {cancelText}
            </Button>
          </DialogClose>
          <Button
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
