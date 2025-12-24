"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { Search, CreditCard, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserWithDues {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  totalDues: number;
  lastPaymentDate: Date | null;
}

interface Transaction {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string } | null;
  amount: number;
  type: "paid" | "reduced" | "waived";
  description: string | null;
  createdBy: string;
  createdByUser: { id: string; name: string; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [usersWithDues, setUsersWithDues] = useState<UserWithDues[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDues | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"paid" | "reduced" | "waived">("paid");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Transaction filters
  const [transactionUserId, setTransactionUserId] = useState<string>("all");
  const [transactionType, setTransactionType] = useState<string>("all");
  const [transactionStartDate, setTransactionStartDate] = useState<Date | null>(null);
  const [transactionEndDate, setTransactionEndDate] = useState<Date | null>(null);

  const loadUsers = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/payments/users", {
        headers: {
          "x-user-id": user.id,
          "x-user-email": user.email,
          "x-user-name": user.name,
          "x-user-role": user.role,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsersWithDues(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const params = new URLSearchParams();
      if (transactionUserId && transactionUserId !== "all") {
        params.append("userId", transactionUserId);
      }
      if (transactionType && transactionType !== "all") {
        params.append("type", transactionType);
      }
      if (transactionStartDate) {
        params.append("startDate", transactionStartDate.toISOString());
      }
      if (transactionEndDate) {
        params.append("endDate", transactionEndDate.toISOString());
      }

      const response = await fetch(`/api/payments?${params.toString()}`, {
        headers: {
          "x-user-id": user.id,
          "x-user-email": user.email,
          "x-user-name": user.name,
          "x-user-role": user.role,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([loadUsers(), loadTransactions()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user, transactionUserId, transactionType, transactionStartDate, transactionEndDate]);

  const handlePaymentClick = (userData: UserWithDues) => {
    setSelectedUser(userData);
    setPaymentAmount(userData.totalDues.toFixed(2));
    setPaymentType("paid");
    setPaymentDescription("");
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedUser || !user || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "x-user-id": user.id,
          "x-user-email": user.email,
          "x-user-name": user.name,
          "x-user-role": user.role,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount,
          type: paymentType,
          description: paymentDescription || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process payment");
      }

      // Reload data
      await Promise.all([loadUsers(), loadTransactions()]);
      setPaymentDialogOpen(false);
      setSelectedUser(null);
      setPaymentAmount("");
      setPaymentDescription("");
    } catch (error: any) {
      console.error("Failed to process payment:", error);
      alert(error.message || "Failed to process payment. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredUsers = usersWithDues.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updatedDues = selectedUser
    ? Math.max(0, selectedUser.totalDues - (parseFloat(paymentAmount) || 0))
    : 0;

  const getDisplayType = (type: string, description: string | null): string => {
    // For "reduced" type transactions, check description to determine specific type
    if (type === "reduced" && description) {
      if (description.toLowerCase().includes("fine")) {
        return "Fine";
      }
      if (description.toLowerCase().includes("guest expense")) {
        return "Guest Meal";
      }
    }
    // For other types, capitalize first letter
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "paid":
        return "success";
      case "reduced":
        return "soft";
      case "waived":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Payment Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage user payments and view transaction history
          </p>
        </div>
      </div>

      {/* Total Payable Amount */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Payable Amount</p>
              <p className="text-3xl font-bold mt-1">
                Rs {usersWithDues.reduce((sum, u) => sum + u.totalDues, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-semibold mt-1">{usersWithDues.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users with Payable Amounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No users found
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px] sm:min-w-[200px]">Name</TableHead>
                      <TableHead className="min-w-[150px] sm:min-w-[180px]">Email</TableHead>
                      <TableHead className="text-right min-w-[120px]">Payable Amount</TableHead>
                      <TableHead className="min-w-[100px] sm:min-w-[120px]">Last Payment</TableHead>
                      <TableHead className="text-right min-w-[140px] sm:min-w-[160px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar
                              alt={userData.name}
                              fallback={userData.name[0]}
                              className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                            />
                            <span className="font-medium truncate">{userData.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="truncate">{userData.email}</TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">
                          Rs {userData.totalDues.toFixed(2)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {userData.lastPaymentDate
                            ? new Date(userData.lastPaymentDate).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handlePaymentClick(userData)}
                            disabled={userData.totalDues === 0}
                            className="text-xs sm:text-sm"
                          >
                            Process Payment
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select
                value={transactionUserId}
                onValueChange={setTransactionUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {usersWithDues.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="reduced">Reduced</SelectItem>
                  <SelectItem value="waived">Waived</SelectItem>
                </SelectContent>
              </Select>

              <DateRangeFilter
                startDate={transactionStartDate}
                endDate={transactionEndDate}
                onDateRangeChange={(start, end) => {
                  setTransactionStartDate(start);
                  setTransactionEndDate(end);
                }}
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No transactions found
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px] sm:min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[120px] sm:min-w-[150px]">User</TableHead>
                      <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                      <TableHead className="min-w-[80px] sm:min-w-[100px]">Type</TableHead>
                      <TableHead className="min-w-[100px] sm:min-w-[120px]">Admin</TableHead>
                      <TableHead className="min-w-[120px] sm:min-w-[150px]">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="truncate">
                          {txn.user ? txn.user.name : "Unknown"}
                        </TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">
                          Rs {txn.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeBadgeVariant(txn.type)}>
                            {getDisplayType(txn.type, txn.description)}
                          </Badge>
                        </TableCell>
                        <TableCell className="truncate">
                          {txn.createdByUser ? txn.createdByUser.name : "Unknown"}
                        </TableCell>
                        <TableCell className="truncate">{txn.description || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Process payment for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <Avatar
                  alt={selectedUser.name}
                  fallback={selectedUser.name[0]}
                  className="h-10 w-10"
                />
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Payable Amount</Label>
                <div className="text-2xl font-bold">
                  Rs {selectedUser.totalDues.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="pl-4 block" htmlFor="amount">Amount (Rs)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  max={selectedUser.totalDues}
                  step="0.01"
                />
              </div>

              <div className="space-y-3">
                <Label className="pl-4 block">Payment Type <span className="text-destructive">*</span></Label>
                <RadioGroup
                  value={paymentType}
                  onValueChange={(value) =>
                    setPaymentType(value as "paid" | "reduced" | "waived")
                  }
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label
                      htmlFor="paid"
                      className={cn("cursor-pointer", paymentType === "paid" && "font-medium")}
                    >
                      Paid
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reduced" id="reduced" />
                    <Label
                      htmlFor="reduced"
                      className={cn("cursor-pointer", paymentType === "reduced" && "font-medium")}
                    >
                      Reduced
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="waived" id="waived" />
                    <Label
                      htmlFor="waived"
                      className={cn("cursor-pointer", paymentType === "waived" && "font-medium")}
                    >
                      Waived
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="pl-4 block" htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="Add a note..."
                />
              </div>

              {paymentAmount && !isNaN(parseFloat(paymentAmount)) && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Remaining Dues After Payment
                  </p>
                  <p className="text-xl font-bold">
                    Rs {updatedDues.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPaymentDialogOpen(false);
                setSelectedUser(null);
                setPaymentAmount("");
                setPaymentDescription("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={
                processingPayment ||
                !paymentAmount ||
                isNaN(parseFloat(paymentAmount)) ||
                parseFloat(paymentAmount) <= 0
              }
            >
              {processingPayment ? "Processing..." : "Submit Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

