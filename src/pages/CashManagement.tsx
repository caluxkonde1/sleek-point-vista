import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Minus, DollarSign, TrendingUp, TrendingDown, Receipt, Calendar } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";

interface Transaction {
  final_amount: number;
  payment_method: string;
  created_at: string;
}

interface CashFlow {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  created_at: string;
}

interface CashSummary {
  totalSales: number;
  totalIncome: number;
  totalExpenses: number;
  netCash: number;
  cashSales: number;
}

const CashManagement = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [cashSummary, setCashSummary] = useState<CashSummary>({
    totalSales: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netCash: 0,
    cashSales: 0
  });
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
    category: ''
  });

  const incomeCategories = [
    'Sales', 'Investment', 'Loan', 'Interest', 'Other Income'
  ];

  const expenseCategories = [
    'Rent', 'Utilities', 'Supplies', 'Marketing', 'Salary', 'Transportation', 'Maintenance', 'Other Expense'
  ];

  useEffect(() => {
    loadCashData();
  }, [selectedDate]);

  const loadCashData = async () => {
    if (!profile?.outlet_id) return;

    try {
      const startDate = startOfDay(new Date(selectedDate)).toISOString();
      const endDate = endOfDay(new Date(selectedDate)).toISOString();

      // Load transactions for cash sales
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('final_amount, payment_method, created_at')
        .eq('outlet_id', profile.outlet_id)
        .eq('status', 'completed')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (transactionError) throw transactionError;

      // Load incomes
      const { data: incomes, error: incomeError } = await supabase
        .from('incomes')
        .select('*')
        .eq('outlet_id', profile.outlet_id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (incomeError) throw incomeError;

      // Load expenses
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('outlet_id', profile.outlet_id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (expenseError) throw expenseError;

      // Calculate summary
      const totalSales = transactions?.reduce((sum, t) => sum + t.final_amount, 0) || 0;
      const cashSales = transactions?.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + t.final_amount, 0) || 0;
      const totalIncome = incomes?.reduce((sum, i) => sum + i.amount, 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const netCash = cashSales + totalIncome - totalExpenses;

      setCashSummary({
        totalSales,
        totalIncome,
        totalExpenses,
        netCash,
        cashSales
      });

      // Combine cash flows
      const combinedFlows: CashFlow[] = [
        ...(incomes?.map(income => ({
          id: income.id,
          type: 'income' as const,
          amount: income.amount,
          description: income.description,
          category: income.category,
          created_at: income.created_at
        })) || []),
        ...(expenses?.map(expense => ({
          id: expense.id,
          type: 'expense' as const,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          created_at: expense.created_at
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCashFlows(combinedFlows);
    } catch (error) {
      console.error('Error loading cash data:', error);
      toast({
        title: "Error",
        description: "Failed to load cash data",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.outlet_id || !user) return;

    setLoading(true);

    try {
      const data = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        outlet_id: profile.outlet_id,
        user_id: user.id,
        date: selectedDate
      };

      const table = formData.type === 'income' ? 'incomes' : 'expenses';
      const { error } = await supabase.from(table).insert([data]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${formData.type === 'income' ? 'Income' : 'Expense'} recorded successfully`
      });

      resetForm();
      setIsDialogOpen(false);
      loadCashData();
    } catch (error) {
      console.error('Error saving cash flow:', error);
      toast({
        title: "Error",
        description: "Failed to save cash flow",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'income',
      amount: '',
      description: '',
      category: ''
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cash Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Cash Flow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Cash Flow</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData({...formData, type: value, category: ''})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.type === 'income' ? incomeCategories : expenseCategories).map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rp {cashSummary.cashSales.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rp {cashSummary.totalIncome.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Rp {cashSummary.totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${cashSummary.netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rp {cashSummary.netCash.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow List */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Details</CardTitle>
        </CardHeader>
        <CardContent>
          {cashFlows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No cash flows recorded for this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cashFlows.map(flow => (
                <div key={flow.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {flow.type === 'income' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{flow.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {flow.category} • {format(new Date(flow.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${flow.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {flow.type === 'income' ? '+' : '-'}Rp {flow.amount.toLocaleString()}
                    </p>
                    <Badge variant={flow.type === 'income' ? 'default' : 'destructive'}>
                      {flow.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashManagement;