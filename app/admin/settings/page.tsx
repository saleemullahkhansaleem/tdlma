"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getSettings, updateSettings } from "@/lib/api/client";
import { Settings } from "@/lib/types/settings";
import { DisabledDatesManager } from "@/components/admin/disabled-dates-manager";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [formData, setFormData] = useState({
    closeTime: "18:00",
    fineAmountUnclosed: 0,
    fineAmountUnopened: 0,
    disabledDates: [] as string[],
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getSettings(user);
      setSettings(data);
      setFormData({
        closeTime: data.closeTime,
        fineAmountUnclosed: data.fineAmountUnclosed,
        fineAmountUnopened: data.fineAmountUnopened,
        disabledDates: data.disabledDates,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const updated = await updateSettings(formData, user);
      setSettings(updated);
      // Show success message
      alert("Settings saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-32" />
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure system-wide settings for meal management
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-6 text-sm">
            {/* Close Time */}
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="font-medium">Close Time</label>
                <p className="text-xs text-muted-foreground">
                  After this time, users cannot change their meal status (open to close or close to open).
                </p>
              </div>
              <Input
                type="time"
                value={formData.closeTime}
                onChange={(e) =>
                  setFormData({ ...formData, closeTime: e.target.value })
                }
                required
              />
            </div>

            {/* Fine Amounts */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="font-medium">Fine Amount (Unclosed)</label>
                  <p className="text-xs text-muted-foreground">
                    Fine amount charged for unclosed meals.
                  </p>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    Rs
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fineAmountUnclosed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fineAmountUnclosed: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="font-medium">Fine Amount (Unopened)</label>
                  <p className="text-xs text-muted-foreground">
                    Fine amount charged for unopened meals.
                  </p>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    Rs
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fineAmountUnopened}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fineAmountUnopened: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Disabled Dates */}
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="font-medium">Disabled Dates</label>
                <p className="text-xs text-muted-foreground">
                  Select future dates to disable meals. Users will not be able to mark attendance for these dates.
                </p>
              </div>
              <DisabledDatesManager
                disabledDates={formData.disabledDates}
                onChange={(dates) =>
                  setFormData({ ...formData, disabledDates: dates })
                }
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={loadSettings}
                className="rounded-full px-6"
                disabled={saving}
              >
                Reset
              </Button>
              <Button
                type="submit"
                className="rounded-full px-6"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
