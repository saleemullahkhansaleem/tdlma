"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-5 text-sm">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Profile</h2>
            <p className="text-xs text-muted-foreground">
              Update your basic information used across the app.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="font-medium">Full Name</label>
              <Input placeholder="Admin Name" />
            </div>
            <div className="space-y-1">
              <label className="font-medium">Email</label>
              <Input type="email" placeholder="admin@example.com" />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <h2 className="text-base font-semibold">Password</h2>
            <p className="text-xs text-muted-foreground">
              Change your password to keep your account secure.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="font-medium">Current Password</label>
              <Input type="password" placeholder="Enter current password" />
            </div>
            <div className="space-y-1">
              <label className="font-medium">New Password</label>
              <Input type="password" placeholder="Enter new password" />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Preferences</h2>
              <p className="text-xs text-muted-foreground">
                Control your appearance and reminder settings.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-0.5">
                <label className="font-medium">Theme</label>
                <p className="text-xs text-muted-foreground">
                  Switch between light and dark mode.
                </p>
              </div>
              <ThemeToggle size="default" variant="outline" />
            </div>

            <div className="space-y-1 pt-1">
              <label className="font-medium">Reminder Time</label>
              <Input type="time" defaultValue="10:00" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="rounded-full px-6">
              Cancel
            </Button>
            <Button className="rounded-full px-6">Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
