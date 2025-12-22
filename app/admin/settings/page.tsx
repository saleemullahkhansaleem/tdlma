"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Loader2, Settings as SettingsIcon, History, ChevronDown, ChevronUp } from "lucide-react";
import { SettingsHistoryView } from "@/components/admin/settings-history-view";

interface SettingType {
  key: string;
  description: string;
  unit: string | null;
  value_type: string;
  currentValue: string | number | boolean;
}

interface FieldState {
  value: string | number | boolean;
  effectiveFrom: string;
  saving: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ settingKey: string; message: string } | null>(null);
  const [settingsTypes, setSettingsTypes] = useState<SettingType[]>([]);
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [mounted, setMounted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    settingKey: string | null;
    settingLabel: string;
    newValue: string | number | boolean;
    effectiveFrom: string;
  }>({
    open: false,
    settingKey: null,
    settingLabel: "",
    newValue: "",
    effectiveFrom: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user) {
      loadSettingsTypes();
    }
  }, [user, mounted]);

  const loadSettingsTypes = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings/types", {
        headers: {
          "x-user-id": user.id,
          "x-user-email": user.email,
          "x-user-name": user.name,
          "x-user-role": user.role,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load settings types (${response.status})`);
      }

      const data: SettingType[] = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error("No settings types found. Please ensure the database is properly initialized.");
      }
      setSettingsTypes(data);

      // Initialize field states
      const initialStates: Record<string, FieldState> = {};
      data.forEach((type) => {
        initialStates[type.key] = {
          value: type.currentValue || (type.value_type === "number" ? 0 : type.value_type === "boolean" ? false : ""),
          effectiveFrom: "",
          saving: false,
        };
      });
      setFieldStates(initialStates);
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSave = async (settingKey: string) => {
    if (!user) return;

    const fieldState = fieldStates[settingKey];
    const settingType = settingsTypes.find((t) => t.key === settingKey);
    if (!settingType) return;

    // Validate effective date is provided
    if (!fieldState.effectiveFrom) {
      setError(`Effective date is required for ${settingType.description}`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validate effective date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fieldState.effectiveFrom)) {
      setError("Effective date must be in YYYY-MM-DD format");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validate effective date is not in the past
    const today = new Date().toISOString().split("T")[0];
    if (fieldState.effectiveFrom < today) {
      setError("Effective date cannot be in the past");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validate value hasn't changed
    if (fieldState.value === settingType.currentValue) {
      setError("No changes detected");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Show confirmation dialog
    setConfirmDialog({
      open: true,
      settingKey,
      settingLabel: settingType.description,
      newValue: fieldState.value,
      effectiveFrom: fieldState.effectiveFrom,
    });
  };

  const handleConfirmSave = async () => {
    if (!user || !confirmDialog.settingKey) return;

    const settingKey = confirmDialog.settingKey;
    const fieldState = fieldStates[settingKey];

    setError(null);
    setSuccess(null);
    setConfirmDialog({ ...confirmDialog, open: false });
    setFieldStates((prev) => ({
      ...prev,
      [settingKey]: { ...prev[settingKey], saving: true },
    }));

    try {
      const response = await fetch("/api/settings/field", {
        method: "PATCH",
        headers: {
          "x-user-id": user.id,
          "x-user-email": user.email,
          "x-user-name": user.name,
          "x-user-role": user.role,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          setting_key: settingKey,
          value: fieldState.value,
          effective_from: fieldState.effectiveFrom,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update setting");
      }

      // Reload settings types to get updated current values
      await loadSettingsTypes();

      const settingType = settingsTypes.find((t) => t.key === settingKey);
      setSuccess({
        settingKey,
        message: `${settingType?.description || settingKey} saved successfully!`,
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || `Failed to save ${settingKey}`);
      setFieldStates((prev) => ({
        ...prev,
        [settingKey]: { ...prev[settingKey], saving: false },
      }));
    }
  };

  const renderInput = (settingType: SettingType) => {
    const fieldState = fieldStates[settingType.key];
    if (!fieldState) return null;

    const unit = settingType.unit ? ` ${settingType.unit}` : "";

    if (settingType.value_type === "time") {
      return (
        <Input
          type="time"
          value={String(fieldState.value)}
          onChange={(e) =>
            setFieldStates((prev) => ({
              ...prev,
              [settingType.key]: { ...prev[settingType.key], value: e.target.value },
            }))
          }
          className="h-11 text-base"
        />
      );
    } else if (settingType.value_type === "number") {
      return (
        <div className="relative">
          {unit && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {unit.trim()}
            </span>
          )}
          <Input
            type="number"
            step="0.01"
            min="0"
            value={Number(fieldState.value)}
            onChange={(e) =>
              setFieldStates((prev) => ({
                ...prev,
                [settingType.key]: {
                  ...prev[settingType.key],
                  value: parseFloat(e.target.value) || 0,
                },
              }))
            }
            className={`h-11 text-base ${unit ? "pl-10" : ""}`}
            placeholder="0.00"
          />
        </div>
      );
    } else if (settingType.value_type === "boolean") {
      return (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(fieldState.value)}
              onChange={(e) =>
                setFieldStates((prev) => ({
                  ...prev,
                  [settingType.key]: { ...prev[settingType.key], value: e.target.checked },
                }))
              }
              className="h-4 w-4"
            />
            <span className="text-sm text-muted-foreground">
              {fieldState.value ? "Enabled" : "Disabled"}
            </span>
          </label>
        </div>
      );
    } else {
      // string type
      return (
        <Input
          type="text"
          value={String(fieldState.value)}
          onChange={(e) =>
            setFieldStates((prev) => ({
              ...prev,
              [settingType.key]: { ...prev[settingType.key], value: e.target.value },
            }))
          }
          className="h-11 text-base"
        />
      );
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-6 w-6" />
              Settings
            </h2>
            <p className="text-sm text-muted-foreground">
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure system-wide settings. Changes require an effective date and will be versioned.
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            {success.message}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      {/* Settings Grid */}
      {loading ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full mt-4" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {settingsTypes.map((settingType) => {
            const fieldState = fieldStates[settingType.key];
            if (!fieldState) return null;

            const unit = settingType.unit ? ` ${settingType.unit}` : "";
            const hasChanged = fieldState.value !== settingType.currentValue;

            return (
              <Card key={settingType.key} className="rounded-lg border-2 hover:shadow-md transition-shadow h-full flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">{settingType?.key.trim().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {settingType?.description} <br />
                    {settingType.value_type === "time" && "Time format: HH:mm"}
                    {settingType.value_type === "number" && `Amount in${unit}`}
                    {settingType.value_type === "boolean" && "Enable or disable this setting"}
                    {settingType.value_type === "string" && "Text value"}
                  </CardDescription>
                </CardHeader>
                <hr />
                <CardContent className="space-y-4 p-4 sm:p-6 flex-1 flex flex-col">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Value{unit}
                    </label>
                    {renderInput(settingType)}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Effective From <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="date"
                      value={fieldState.effectiveFrom}
                      onChange={(e) =>
                        setFieldStates((prev) => ({
                          ...prev,
                          [settingType.key]: {
                            ...prev[settingType.key],
                            effectiveFrom: e.target.value,
                          },
                        }))
                      }
                      min={new Date().toISOString().split("T")[0]}
                      className="h-11 text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      New value will apply from this date
                    </p>
                  </div>
                  <Button
                    onClick={() => handleFieldSave(settingType.key)}
                    disabled={
                      loading ||
                      fieldState.saving ||
                      !hasChanged ||
                      !fieldState.effectiveFrom
                    }
                    className="w-full"
                  >
                    {fieldState.saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save {settingType.key
                          .trim()
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase())
                        }
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Settings History Toggle Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          className="gap-2"
        >
          {showHistory ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide History
            </>
          ) : (
            <>
              <History className="h-4 w-4" />
              Show History
            </>
          )}
        </Button>
      </div>

      {/* Settings History - Only render when toggled */}
      {showHistory && <SettingsHistoryView />}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Setting Change</DialogTitle>
            <DialogDescription>
              This will create a new version of the setting. Previous values will be preserved for history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Setting</p>
              <p className="text-base font-semibold">{confirmDialog.settingLabel}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">New Value</p>
              <p className="text-base font-semibold">{String(confirmDialog.newValue)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Effective From</p>
              <p className="text-base font-semibold">
                {new Date(confirmDialog.effectiveFrom).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                This change will apply from the selected date. Previous values will be preserved for history.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSave}>Confirm & Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
