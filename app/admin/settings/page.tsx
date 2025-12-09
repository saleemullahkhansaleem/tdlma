"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getSettings, updateSettings } from "@/lib/api/client";
import { Settings } from "@/lib/types/settings";
import { OffDaysManager } from "@/components/admin/off-days-manager";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, DollarSign, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [formData, setFormData] = useState({
    closeTime: "18:00",
    fineAmountUnclosed: 0,
    fineAmountUnopened: 0,
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const data = await getSettings(user);
      setSettings(data);
      setFormData({
        closeTime: data.closeTime,
        fineAmountUnclosed: data.fineAmountUnclosed,
        fineAmountUnopened: data.fineAmountUnopened,
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
    setSuccess(false);

    try {
      const updated = await updateSettings(formData, user);
      setSettings(updated);
      setSuccess(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure system-wide settings for meal management and fine policies
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            Settings saved successfully!
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

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Off Days Section - Takes 2/3 on desktop */}
        <div className="lg:col-span-2">
          <Card className="rounded-lg border-2 hover:shadow-md transition-shadow">
            <CardContent className="p-2 md:p-6">
              <OffDaysManager />
            </CardContent>
          </Card>
        </div>

        {/* General Settings - Takes 1/3 on desktop */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit}>
            <Card className="rounded-lg border-2 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">General Settings</CardTitle>
                <CardDescription>
                  Manage meal timing and fine policies
                </CardDescription>
              </CardHeader>
              <hr />
              <CardContent className="space-y-6 p-6">
                {/* Close Time */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Close Time
                    </label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      After this time, users cannot change their meal status.
                    </p>
                  </div>
                  {loading ? (
                    <Skeleton className="h-11 w-full" />
                  ) : (
                    <Input
                      type="time"
                      value={formData.closeTime}
                      onChange={(e) =>
                        setFormData({ ...formData, closeTime: e.target.value })
                      }
                      required
                      className="h-11 text-base"
                    />
                  )}
                </div>

                <hr />

                {/* Fine Amounts */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Fine Amounts
                    </label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Set fine amounts for unclosed and unopened meals.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Fine Amount (Unclosed)
                      </label>
                      {loading ? (
                        <Skeleton className="h-11 w-full" />
                      ) : (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
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
                            className="pl-10 h-11 text-base"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Charged when meal is opened but not closed
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Fine Amount (Unopened)
                      </label>
                      {loading ? (
                        <Skeleton className="h-11 w-full" />
                      ) : (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
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
                            className="pl-10 h-11 text-base"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Charged when meal is not opened at all
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-4 border-t">
                  <Button
                    type="submit"
                    className="w-full rounded-full"
                    disabled={saving || loading}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
